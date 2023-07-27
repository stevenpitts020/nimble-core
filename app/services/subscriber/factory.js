const AWS = require('aws-sdk')
const { Consumer } = require('sqs-consumer')
const _ = require('lodash')

function createSubscriber(opts) {
  const name = opts.name
  const app = require('../../core')
  const logger = app.logger.getLogger('app.services.subscriber.factory')

  const sqs = new AWS.SQS({
    apiVersion: '2012-11-05',
    // removes empty string/undefineds
    ..._.pickBy(app.config.get('sqs'), _.identity)
  })

  async function handleMessage(message) {
    try {
      logger.info(message, `[handleMessage] [${name}] message received`)

      const msg = unwrap(message) // unwrap the AWS message envelope (typically SNS -> SQS -> handler)

      logger.info(msg, `[handleMessage] delegating normalized message to [${name}].handleMessage...`)

      return opts.handleMessage(msg)
    } catch(err) {
      logger.error(err, `[handleMessage] [${name}] subscriber handle message failed with error`)
      throw err
    }
  }

  function isAwsEnvelope(message) {
    if (!_.isPlainObject(message)) return false // short circuit non-objects

    return !!( // perform fuzzy inspections of the message to determine AWS-ness
      message.MessageId // all AWS envelopes SHOULD have `MessageId`
      || message.Body // assume property `Body` (big-B) is an AWS convention (e.g. SQS)
      || message.Message // assume property `Message` (big-M) is an AWS convention (e.g. SNS)
    )
  }

  function unwrap(message) {
    if (!message) return message // base case, not a processable envelope
    if (!isAwsEnvelope(message)) return message // no message, or not a AWS envelope

    // extract the payload (different envelopes have different payload locations)
    let payload = message.Message || message.Body

    try { // parse the message's payload
      if (_.isString(payload)) {
        payload = _.trim(payload)
        try {
          payload = JSON.parse(payload)
        } catch(ex) {
          logger.info(ex, `[handleMessage] [${name}] message payload is not JSON [${payload}]`)
        }

        if (isAwsEnvelope(payload)) return unwrap(payload) // still an aws envelope, recurse to fully unwrap
      }
    } catch(ex) {
      logger.error(ex, `[handleMessage] [${name}] error extracting message payload [${payload}]`)
    }

    return payload
  }

  const params = {
    sqs,
    handleMessage,
    queueUrl: opts.queueUrl
  }
  const subscriber = Consumer.create(params)

  // this app errors
  subscriber.on('error', err => {
    logger.error(err, '[error] subscriber error')
    process.exit(1) // eslint-disable-line no-process-exit
  })

  // this is execution errors
  subscriber.on('processing_error', err => {
    logger.error(err, `[processing_error] subscriber processing error on job [${name}]`)
  })

  return subscriber
}

module.exports = createSubscriber
