const app = require('../../core')

function getUri(path = '') {
  const protocol = app.config.get('protocol')
  const domain = app.config.get('domain')
  return `${protocol}://${domain}${path}`
}

module.exports = getUri
