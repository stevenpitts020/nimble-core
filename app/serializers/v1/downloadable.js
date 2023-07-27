const app = require('../../core')

function serializer(data) {
  const format = { uri: null }
  if (data && data.id) {
    const document = data.id
    const options = {
      resources: [`documents#${document}`],
      scopes: ['documents']
    }
    const token = app.services.token.get(options)
    format.uri = app.services.api.uri(`/v1/documents/${document}?token=${token}`)
  }

  return format
}

module.exports = serializer
