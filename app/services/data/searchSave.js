const _ = require('lodash')
const app = require('../../core')
const validator = app.plugins.validator
const Search = app.repositories.search
const SearchModel = app.models.search
const InternalServerError = require('../../errors/internal_server')

const logger = app.logger.getLogger('app.services.data.search.save')

async function searchSave(search, tx = app.db) {
  search = _.omitBy(search, _.isNil)

  const id = _.get(search, 'id')
  const create = _.isNil(id)

  const schema = create ? 'create' : 'update'

  logger.info({ op: 'search.save', create, phase: 'started', data: search })

  try {
    if (create) search.id = _.snakeCase(search.name)
    else search = _.merge(Search.forge({ id }).fetch({ transacting: tx }), search)

    search = _.omitBy(search, _.isNil)

    const model = SearchModel.prePersist(validator(_.pick(search, SearchModel.props(schema)), SearchModel.schema(schema), { abortEarly: false }))

    const entity = await Search.forge(model).save(null, { method: create ? 'insert' : 'update', patch: !create, transacting: tx })

    logger.info({ phase: 'data.search.create.entity:success', entity })

    return await app.services.data.searchGet(entity.get('id'), tx)
  } catch(err) {
    logger.error(err, { phase: 'data.search.create.entity:fail', search })
    throw new InternalServerError(err.message)
  }
}

module.exports = searchSave