const AWS = require('aws-sdk')
const _ = require('lodash')
const app = require('../../core')
const logger = app.logger.getLogger('app.services.event_stream.publish')

const client = new AWS.SNS({
  apiVersion: '2010-03-31',
  // removes empty string/undefineds
  ..._.pickBy(app.config.get('sns'), _.identity)
})

async function publish(params) {
  logger.info('[publish] start publishing event [%s] for id [%s]', params.event, params.id)
  try {
    const payload = {
      id: params.id,
      event: params.event
    }
    const data = {
      Message: JSON.stringify(payload),
      TopicArn: params.topicArn
    }

    logger.debug('[publish] event publishing to topic %s', data.TopicArn)
    const response = await client.publish(data).promise()
    logger.debug('[publish] event published with message id %s', response.MessageId)
  } catch (err) {
    logger.error(err, '[publish] event publish failed')
    throw err
  }
}

module.exports = publish
