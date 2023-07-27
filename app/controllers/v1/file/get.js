const app = require('../../../core')
const service = app.services.file
const serializer = app.serializers.v1.file

function get(req, res, next) {
  return service.get(req.params.id).then(serializer).then(res.json).catch(next)
}

module.exports = get
