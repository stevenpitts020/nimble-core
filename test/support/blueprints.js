const glob = require('glob')
const _ = require('lodash')
_.mixin(require("lodash-inflection"))

function getEntity(data, pk, id) {
  const entity = Object.values(data).find(e => _.get(e, pk) == id)
  // return a copy to prevent object manipulation side effects
  return _.cloneDeep(entity)
}

/**
 * This function will dynamicly load all blueprints place in the data blueprints folder
 */
function loadBlueprintFiles() {
  return glob.sync(`${__dirname}/blueprints/**/*.json`).reduce((memo, filename) => {
    if (filename === '.keep') {
      return memo
    }

    //gets the file content
    let blueprint = require(filename)
    //gets the folder name
    let type = filename.split('/').slice(-2).shift()

    //gets the file name
    let name = filename.split('/').pop().replace('.json', '')

    const path = [type,name].join('.')
    _.set(memo, path, blueprint)

    const entityName = _.singularize(_.camelCase(type))
    memo[entityName] = Object.assign({}, memo[entityName], {
      get: _.partial(getEntity, memo[type], 'id')
    })

    return memo
  }, {})
}

module.exports = loadBlueprintFiles()
