const _ = require('lodash')
const app = require('../../core')
const validator = app.plugins.validator
const Search = app.repositories.search
const SearchModel = app.models.search
const InternalServerError = require('../../errors/internal_server')

const PROPS = SearchModel.props('delete')
const SCHEMA = SearchModel.schema('delete')

const logger = app.logger.getLogger('app.services.data.search.delete')

async function searchDelete(example, tx = app.db) {
  example = _.omitBy(example, _.isNil)

  logger.info({ op: 'search.delete', phase: 'started.validate', example })

  try {
    const model = SearchModel.prePersist(validator(_.pick(example, PROPS), SCHEMA, { abortEarly: false }))

    const where = _.reduce(model, (memo, val, key) => {
      memo[_.snakeCase(key)] = val
      return memo
    }, {})

    logger.info({ op: 'search.delete', phase: 'started.delete', where })

    await Search.where(where).destroy({ require: false, transacting: tx })

    logger.info({ op: 'search.delete', phase: 'started.ended' })

    return model
  } catch(err) {
    logger.error(err, { phase: 'ended.delete:fail', example })
    throw new InternalServerError(err.message)
  }
}

module.exports = searchDelete