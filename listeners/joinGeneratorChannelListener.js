import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Events, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'

const actionsRow = () => {
  const row = new ActionRowBuilder()
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('configure')
      .setLabel('🛠️ Configure')
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

    if (interaction.customId === 'configure') {
      const member = await redis.get(`tmpChannel:${interaction.channelId}`)
      if (member === interaction.member.id) {
        const modal = new ModalBuilder()
          .setTitle('Rename your channel')
          .setCustomId('configureChannel')

        const firstRow = new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setLabel('Enter a new name for your channel')
            .setCustomId('newName')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(interaction.channel.name)
        )

        const secondRow = new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('maxUsers')
            .setLabel('Max users (0 for unlimited)')
            .setMaxLength(2)
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(interaction.channel.userLimit.toString())
        )

        modal.addComponents(firstRow, secondRow)

        await interaction.showModal(modal)
      }
    }
  })

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return

    if (interaction.customId === 'configureChannel') {
      const member = await redis.get(`tmpChannel:${interaction.channelId}`)
      if (member === interaction.member.id) {
        const newChannelName = interaction.fields.getField('newName').value
        const maxUsers = parseInt(interaction.fields.getField('maxUsers').value)
        await interaction.channel.setName(newChannelName)
        await interaction.channel.setUserLimit(maxUsers)
        await interaction.reply({ content: 'Channel updated!', ephemeral: true })
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
          content: `Welcome ! You can change the name of the channel here ⬇️`,
          components: [actionsRow()]
        })
      ])
    }
  })
}

export { setupGeneratorChannelListener }
