const subscriberFactory = require('./factory')
const app = require('../../core')

module.exports = function() {
  return subscriberFactory({
    name: 'app.services.compliance.verify',
    handleMessage: async function handleMessage(message) {
      await app.services.compliance.verify(message.id)
    },
    queueUrl: app.config.get('sqs').complianceQueue
  })
}
