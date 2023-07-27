const app = require('../../../core')

const service = app.services.institution
const serializer = app.serializers.v1.institution

async function update(req, res, next) {
  return service
    .update({ ...req.body, id: req.params.id })
    .then(serializer)
    .then(institution => res.status(200).json(institution))
    .catch(next)
}

module.exports = update
