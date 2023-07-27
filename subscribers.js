const app = require('./app/core')
const logger = app.logger.getLogger('subscribers')

app
  .load()
  .then(async () => {
    logger.info('[load] starting susbcribers')
    app.services.subscriber.compliance().start()
    app.services.subscriber.identity().start()
    app.services.subscriber.exporter().start()
  })
  .catch(err => {
    // exit on error
    logger.error(err, '[load] ending subscribers with error')
    process.exit(1) // eslint-disable-line no-process-exit
  })
