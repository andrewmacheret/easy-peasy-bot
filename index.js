const request = require('request-promise-native')
const app = require('./lib/apps')
const BambooPoller = require('./lib/bamboo-poller')
let poller = null

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */
function onInstallation(bot, installer) {
  if (installer) {
    bot.startPrivateConversation({user: installer}, function (err, convo) {
      if (err) {
        console.error(err)
      } else {
        convo.say('I am a bot that has just joined your team')
        convo.say('You must now /invite me to a channel so that I can be of use!')
      }
    })
  }
}

/**
 * Configure the persistence options
 */
const config = {
  json_file_store: './db_slack_bot_a/',
  retry: Infinity
}

const controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation)

controller.setTickDelay(30000)

/**
 * Events
 */

controller.on('rtm_open', startup)

controller.on('rtm_close', shutdown)

controller.on('bot_channel_join', join)

controller.on('direct_mention', status)

controller.on('mention', status)

controller.on('tick', tick)

/**
 * Functions
 */

function join(bot, message) {
  bot.reply(message, "I'm here!")
}

function tick(bot) {
  poll(bot)
}


function startup(bot) {
  console.info('** The RTM api just connected!')
  poller = new BambooPoller({
    server: process.env.BAMBOO_URL,
    buildKey: process.env.BAMBOO_PLAN_KEY,
    maxResults: parseInt(process.env.BAMBOO_MAX_RESULTS) || 10,
    username: process.env.BAMBOO_USERNAME,
    password: process.env.BAMBOO_PASSWORD
  })
  poll(bot)
}

function shutdown() {
  console.info('** The RTM api just closed')
  poller = null
}

function status(bot, message) {
  if (poller) {
    poller.status(data => {
        bot.reply(message, text(data))
    })
  }
}

function poll(bot) {
  if (poller) {
    poller.poll(data => {
      bot.say({
        text: text(data),
        channel: process.env.CHANNEL
      })
    })
  }
}

function text(data) {
  for (const key in data) {
    data[key] = key
  }
}


