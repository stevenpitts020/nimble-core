const app = require('../../../core')

const service = app.services.complianceVerification
const serializer = app.serializers.v1.signerComplianceVerification

async function get(req, res, next) {
  const id = req.params.id

  return service
    .list(id)
    .then((data) => data.map(serializer))
    .then((data) => res.status(200).json(data))
    .catch(next)
}

module.exports = get

