import { initBot, airCreate, getInfoForUser, airPatch, transcript } from '../utils'

const interactionClubInit = async (bot = initBot(), message) => {
  // find person record, create if it doesn't exist
  // create a new club record for the user
  // create a new club channel and add the user to it
  // update the record with the channel info
  // send a welcome message in the club channel

  const userId = message.user
  const userInfo = await getInfoForUser(userId)
  const personRecord = userInfo.person
  const fullName = userInfo.slackUser.real_name
  console.log('user info', userInfo)
  console.log('person', personRecord)

  const clubRecord = await airCreate('Clubs', {
    'POC': [personRecord.id],
    'Leaders': [personRecord.id],
    'High School Name': fullName
  })
  const clubId = clubRecord.fields['ID']
  const clubChannel = await createClubChannel(clubId, userId)
  await Promise.all([
    airPatch('Clubs', clubRecord.id, {
      'Slack Channel ID': clubChannel
    }),
    bot.api.chat.postMessage({
      channel: clubChannel,
      text: transcript('tutorial.init.start')
    })
  ])

  // Fill in any fields that aren't already filled in
  getInfoForUser(userId)
}

const createClubChannel = (id, user) => (
  new Promise((resolve, reject) => {
    bot.api.conversations.create({
      name: id
    }, (err, res) => {
      if (err) reject('error creating club channel', err)
      console.log('new club channel created!', res, res.channel.id)
      bot.api.conversations.invite({
        channel: res.channel.id,
        users: `${user}`
      }, (err, res) => {
        if (err) {
          console.log('error inviting user to new club channel', err)
          reject(err)
        }
        resolve(res.channel.id)
      })
    })
  })
)

export default interactionClubInit