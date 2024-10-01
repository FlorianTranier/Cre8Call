import { Events } from 'discord.js'

/**
 * @param {import('discord.js').Client} client
 * @param {Providers} providers
 */
const setupEmptyChannelListener = (client, { redis }) => {
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const tmpChannel = await redis.get(`tmpChannel:${oldState.channelId}`)
    if (tmpChannel) {
      const members = await oldState.channel.members
      if (members.size === 0) {
        await Promise.all([
          redis.del(`tmpChannel:${oldState.channelId}`),
          oldState.channel.delete()
        ])
      }
    }
  })
}

export { setupEmptyChannelListener }
