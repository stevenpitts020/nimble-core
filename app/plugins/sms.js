const Mustache = require('mustache')
const logger = require('./logger').getLogger('app.plugins.sms')
const TextCleaner = require('text-cleaner')
const config = require('../../config')
let twilio

module.exports = {
  notify: ctx => {
    logger.info(ctx, '[sms:notify]')

    // coerce phone
    let phone = ctx.recipient.mobile || ''
    if (phone.length < 7) return Promise.reject('InvalidPhoneNumber')
    if (phone.length === 7) phone = `+1${phone}`
    if (!phone.startsWith('+')) phone = `+${phone}`

    const rendered = TextCleaner(Mustache.render(ctx.message, ctx)).stripHtml().decodeHtmlEntities().condense()

    const message = {
      to: phone,
      body: Buffer.from(rendered, 'utf-8').toString(),
      messagingServiceSid: config.get('twilio.messagingSvcSid')
    }

    logger.info({ message }, '[sms:notify:message]')

    // lazy load twilio
    if (!twilio) twilio = require('twilio')(config.get('twilio.accountSid'), config.get('twilio.authToken'))

    return twilio.messages.create(message)
  }
}
