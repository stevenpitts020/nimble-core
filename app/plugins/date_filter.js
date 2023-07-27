const _ = require('lodash')
const moment = require('moment')

const BadRequestError = require('../errors/bad_request')

function getValidDate(str) {
  if (str.length < 4) {
    // this provides some basic protection from empty.
    throw new BadRequestError('Parameters since/until must be a valid date')
  }

  let date = moment.utc(str)

  if (!date.isValid()) {
    date = moment.unix(str)
    if (!date.isValid()) {
      throw new BadRequestError('Parameters since/until must be a valid date')
    }
  }

  return date.toISOString()
}

/**
 * NON ASYNC function that set the query builder with date filters
 *
 * @param {object} query
 * @param {object} params
 */
function filter(query, params, field) {
  const filters = _.pick(params, ['since', 'until'])

  if (_.has(filters, 'since')) {
    let since = getValidDate(filters.since)
    query.where(field, '>=', since)
  }

  if (_.has(filters, 'until')) {
    let until = getValidDate(filters.until)
    query.where(field, '<=', until)
  }

  return query
}

module.exports = filter
