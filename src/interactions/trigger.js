import { airGet } from '../utils'
import checkinNotifier from './checkinNotifier'

const getAdmin = (bot, user) => new Promise((resolve, reject) => {
  bot.api.users.info({ user }, (err, res) => {
    if (err) {
      console.error(err)
      reject(err)
    }
    resolve(res.user.is_owner)
  })
})

const triggerInteraction = (bot, message) => {
  getAdmin(bot, message.user).then((admin) => {
    if (!admin) {
      bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'broken_heart'
      })
      throw new Error('user_not_leader')
    }

    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: 'heartbeat'
    })

    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.toLocaleDateString('en', { weekday: 'long' })
    console.log(`*orpheus hears her heart beat in her chest. The time is ${currentHour} on ${currentDay}*`)

    airGet('Clubs').then(clubs => clubs.forEach(club => {
      const day = club.fields['Checkin Day']
      const hour = club.fields['Checkin Hour']
      const channel = club.fields['Slack Channel ID']

      if (!channel) { return }
      if (!day || day != currentDay) { return }
      if (!hour || hour != currentHour) { return }

      console.log(`*starting checkin w/ "${club.fields['ID']}" in channel ${channel}*`)
      bot.replyInThread(message, `I'm reaching out to <#${channel}> (database ID \`${club.fields['ID']}\`)`)

      checkinNotifier(null, { channel })
    }))
  }).catch(err => {
    console.error(err)
    bot.whisper(message, `Got error: \`${err}\``)
  })
}

export default triggerInteraction