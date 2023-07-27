const _ = require('lodash')
const app = require('../../../core')
const BadRequestError = require('../../../errors/bad_request')
const service = app.services.data

async function peopleSearch(req, res) {
  const query = req.body

  if (!_.isObject(query) || _.isEmpty(query)) throw new BadRequestError('body (query) required >> https://opensearch.org/docs/latest/opensearch/query-dsl/bool')

  const people = await service.peopleSearch(query)

  res.status(200)

  const ext = _.get(req, ['format'], 'json').toLowerCase()

  if (/^[cC][sS]?[vV]$/.test(ext)) return res.type('text/csv').send(people.hits)

  res.json(people)
}

module.exports = peopleSearch