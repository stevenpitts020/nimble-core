const _ = require('lodash')
const swaggerUi = require('swagger-ui-express')
const glob = require('glob')
const YAML = require('yamljs')
const app = require('../core')
const logger = app.logger.getLogger('app.plugins.swagger')

// will look for files insite $path
function loadAndMergeFromPath(spec, path, parent) {
  glob
    .sync(`${__dirname}/../../docs/${path}/**/*.yaml`)
    .map(file => YAML.load(file))
    .forEach(assignToSpec(spec, path, parent))
}

// will break up definitions inside an object $part and merge them onto $spec.$part
function assignToSpec(spec, part, parent) {
  return obj => {
    const section = parent ? spec[parent][part] : spec[part]
    Object.keys(obj).forEach(key => {
      if (_.has(section, key)) {
        // if the key already exists, merge the specs
        let current_spec = section[key]
        let new_spec = obj[key]
        section[key] = { ...current_spec, ...new_spec }
      } else {
        section[key] = obj[key]
      }
    })
  }
}

function buildSwaggerDocument() {
  const spec = YAML.load(__dirname + '/../../docs/openapi.yaml')

  // load individual yaml files and merge them with the spec under the same path
  loadAndMergeFromPath(spec, 'paths')
  loadAndMergeFromPath(spec, 'schemas', 'components')

  return spec
}

let swaggerDocument = buildSwaggerDocument()

module.exports = function swaggerDecorator(app) {
  swaggerDocument.servers[0].url = `${app.config.get('protocol')}://${app.config.get('domain')}/v1`
  logger.debug('[swaggerDecorator] setting up swagger')

  app.router.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      isExplorer: true,
      swaggerOptions: {
        operationsSorter: (a, b) => {
          // from https://github.com/swagger-api/swagger-ui/issues/4158#issuecomment-362631294
          var methodsOrder = ["get", "post", "put", "delete", "patch", "options", "trace"]
          var result = methodsOrder.indexOf(a.get("method")) - methodsOrder.indexOf(b.get("method"))          // Or if you want to sort the methods alphabetically (delete, get, head, options, ...):
          // var result = a.get("method").localeCompare(b.get("method"));

          if (result === 0) {
            result = a.get("path").localeCompare(b.get("path"))
          }

          return result
        }
      }
    })
  )

  logger.info(`[swaggerDecorator] open API docs at ${app.config.get('protocol')}://${app.config.get('domain')}/docs`)
}
