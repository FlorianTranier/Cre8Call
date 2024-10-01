import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Events, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'

const actionsRow = () => {
  const row = new ActionRowBuilder()
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('rename')
      .setLabel('Rename')
      .setStyle(ButtonStyle.Primary)
  )

  return row
}

/**
 * @param {import('discord.js').Client} client
 * @param {Providers} providers
 */
const setupGeneratorChannelListener = (client, { redis }) => {
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return

    if (interaction.customId === 'rename') {
      const member = await redis.get(`tmpChannel:${interaction.channelId}`)
      if (member === interaction.member.id) {
        const modal = new ModalBuilder()
          .setTitle('Rename your channel')
          .setCustomId('renameChannel')

        const firstRow = new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setLabel('Enter a new name for your channel')
            .setCustomId('newName')
            .setStyle(TextInputStyle.Short)
        )

        modal.addComponents(firstRow)

        await interaction.showModal(modal)
      }
    }
  })

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return

    if (interaction.customId === 'renameChannel') {
      const member = await redis.get(`tmpChannel:${interaction.channelId}`)
      if (member === interaction.member.id) {
        const newChannelName = interaction.fields.getField('newName').value
        await interaction.channel.setName(newChannelName)
        await interaction.reply({ content: 'Channel renamed!', ephemeral: true })
      }
    }
  })

  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const generatorChannel = await redis.hGet(`guild:${newState.guild.id}`, 'generatorChannel')
    if (newState.channelId === generatorChannel) {
      const member = newState.member
      const newTempChannel = await newState.guild.channels.create({
        name: `📢 ${member.nickname ?? member.user.displayName ?? member.user.username}'s channel`,
        type: ChannelType.GuildVoice,
        parent: newState.channel.parent,
        bitrate: 96000
      })

      await Promise.all([
        redis.set(`tmpChannel:${newTempChannel.id}`, member.id),
        newTempChannel.setPosition(newState.channel.position + 1),
        member.voice.setChannel(newTempChannel),

        newTempChannel.send({
          content: `Welcome, ${member.toString() ?? member.user.username}!`,
          components: [actionsRow()],
          allowedMentions: { users: [member.id] }
        })
      ])
    }
  })
}

export { setupGeneratorChannelListener }
