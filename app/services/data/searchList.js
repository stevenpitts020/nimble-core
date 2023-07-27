const _ = require('lodash')
const app = require('../../core')
const Search = app.repositories.search
const SearchModel = app.models.search
const BadRequestError = require('../../errors/bad_request')

async function searchList(example, tx = app.db) {
  if (!example || _.isEmpty(example)) throw new BadRequestError('`example` required')

  const query = Search.query(sql => _.forEach(example, (val, key) => {
    sql.where(_.snakeCase(key), val)
  }))

  const searches = await query.fetchAll({ transacting: tx })

  return searches.map(search => new SearchModel(search).data())
}

module.exports = searchList