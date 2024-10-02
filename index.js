import { Client, Events, GatewayIntentBits } from 'discord.js'
import { commandHandlers } from './commands/commands.js'
import { createClient } from 'redis'
import { setupGeneratorChannelListener } from './listeners/joinGeneratorChannelListener.js'
import { setupEmptyChannelListener } from './listeners/emptyChannelListener.js'

const token = process.env.BOT_TOKEN

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] })

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`)
})

// Log in to Discord with your client's token
client.login(token)

const providers = {}

const redis = await createClient({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD
})
await redis.connect()
providers.redis = redis

await setupGeneratorChannelListener(client, providers)
await setupEmptyChannelListener(client, providers)

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return

  const commandHandler = commandHandlers(providers)[interaction.commandName]

  if (!commandHandler) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await commandHandler(interaction)
  } catch (error) {
    console.error(error)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
    }
  }
})
