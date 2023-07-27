const moment = require('moment')
const PreconditionFailedError = require('../../errors/precondition_failed')
const _ = require('lodash')
const app = require('../../core')
const logger = app.logger.getLogger('app.services.compliance.search')

async function search(entity, filterTypes) {
  logger.debug(`[search] started`)
  const filters = {
    types: filterTypes,
    entity_type: "person",
  }

  if (entity.dateOfBirth) {
    filters.birth_year = moment(entity.dateOfBirth).year()
  }

  const searchTerm = [
    entity.firstName,
    entity.middleName,
    entity.lastName
  ].join(" ").replace(/\s+/g, ' ').trim() // join name in single trimmed string

  if (!searchTerm) {
    throw new PreconditionFailedError('invalid search term')
  }

  const payload = {
    search_term: searchTerm,
    filters,
    exact_match: true
  }

  try {
    const query = app.repositories.complyAdvantage.post("/searches", payload)

    const result = await query
      .then(result => _.get(result, 'data.content.data', []))
      .then(result => _.omit(result, 'hits', []))

    const hits = await query
      .then(result => _.get(result, 'data.content.data.hits', [])) // fetch result array
      .then(hits => _.orderBy(hits, (item) => item.score, ['desc'])) // order by score

    return { search: payload, result, hits }
  } catch (err) {
    logger.info(err, `[search] error searching for searchTerm: [${searchTerm}]`)
    throw new PreconditionFailedError(err)
  }
}

module.exports = search
