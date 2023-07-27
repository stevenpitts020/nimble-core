const _ = require('lodash')
const config = require('../../config')
const postmark = require('postmark')
const aws = require('./aws')
const Mustache = require('mustache')
const logger = require('./logger').getLogger('app.plugins.email')

class EmailService {
  constructor(service) {
    let apiKey = config.get('email').apiKey
    this.from = config.get('email').from
    this.service = new service.ServerClient(apiKey)
    this.aws = aws
  }

  send(template, data) {

    if (!template) {
      throw new Error('EmailService: Missing template name')
    }

    if (!_.has(data, 'email')) {
      throw new Error('EmailService: Missing on metadata {email: ""}')
    }

    logger.debug(data, `[send] email was sent to ${data.email} with template ${template} with data`)

    return this.service.sendEmailWithTemplate({
      From: this.from,
      To: data.email,
      TemplateAlias: template,
      TemplateModel: data
    })
  }

  notify(ctx) {
    logger.info(ctx, '[email:notify]')
    const title = ctx.title ? Mustache.render(ctx.title, ctx) : 'New Notification'
    const plain = Mustache.render(ctx.message, ctx)
    const html = ctx.html || plain.replace(/\r\n|\r|\n/g, '<br>')

    logger.info({ title, message: plain }, '[email:notify:rendered]')

    return this.aws.sendEmailTemplate('notification', ctx.recipient.email, ctx.cc, { title, html, plain })
  }

  awsSend(template, data) {
    if (!template) {
      throw new Error('EmailService: Missing template name')
    }

    if (!_.has(data, 'email')) {
      throw new Error('EmailService: Missing on metadata {email: ""}')
    }

    return this.aws.sendEmailTemplate(template, data.email, data.cc, data)
  }

  sendPasswordRecovery(data) {
    const statusEmailSubject = 'Password Recovery'
    return this.awsSend('passwordResetEmail', { statusEmailSubject, ...data })
  }

  sendMagicLink(data) {
    const statusEmailSubject = `${data.institution || 'Bank'} | NimbleFi Login` // TODO: templatize
    return this.awsSend('magicLinkEmail', { statusEmailSubject, ...data })
  }

  sendAccountRequestStatus(status, data) {
    if (status === 'APPROVED') {
      return this.awsSend('AccountRequestApproved', data)
    }

    if (status === 'DECLINED') {
      return this.awsSend('AccountRequestDeclined', data)
    }
  }

}

module.exports = new EmailService(postmark)
