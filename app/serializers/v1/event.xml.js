const app = require('../../core')

function serializer(event) {
  const tag = app.plugins.xml.tag
  const format = app.plugins.xml.format


  // we only have one case: event.name=account_request_approved
  // if we have more event types in the future, 
  // we need to add a switch here, that calls the correct serializer for each event.data
  return '<?xml-model href="metadata.xsd"?>\n' + format(tag('event', {
    name: event.name,
    rid: event.rid,
    timestamp: event.timestamp,
  }, [app.serializers.v1.accountRequestXml(event.data)]))
}

module.exports = serializer