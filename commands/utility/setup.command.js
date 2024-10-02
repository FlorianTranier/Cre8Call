import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js'

const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup the bot for your server')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

/**
 * @param {Providers} providers
 */
const execute = ({ redis }) =>
  /**
 * @param {import('discord.js').CommandInteraction} interaction
 */
  async (interaction) => {
    const generatorChannel = await redis.hGet(`guild:${interaction.guild.id}`, 'generatorChannel')
    if (!generatorChannel) {
      const category = await interaction.guild.channels.create({
        type: ChannelType.GuildCategory,
        name: 'VOICE CHANNELS'
      })

      const generatorChannel = await interaction.guild.channels.create({
        type: ChannelType.GuildVoice,
        name: '⚡・JOIN TO CREATE',
        parent: category
      })

      await redis.hSet(`guild:${interaction.guild.id}`, {
        generatorChannel: generatorChannel.id
      })
    }

    await interaction.reply('Setup complete')
  }

export { data, execute }
