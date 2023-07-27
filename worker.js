const app = require('./app/core')
const logger = app.logger.getLogger('worker')
const cron = require('node-cron')

logger.info('[load] starting worker with a %sm configuration', app.config.get('cronInterval'))

app.load().then(async() => cron.schedule('0 * * * *', () => {
    logger.info('[exec] executing work')

    // run the 24 hours after reminder
    app.services.cron.inviteeReminder(1)
    // run the 3 days reminder
    app.services.cron.inviteeReminder(3)
    // run the 7 days reminder
    app.services.cron.inviteeReminder(7)

    // email verification reminder
    app.services.cron.emailVerificationReminder(1)
    app.services.cron.emailVerificationReminder(3)
    app.services.cron.emailVerificationReminder(7)
  })
).catch(err => {
  // exit on error
  logger.error(err, '[load] ending worker with error')
}).then(() => {
  // exit on done
  logger.info('[load] ending worker')
})
