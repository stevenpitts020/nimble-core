const config = require('../../config')
const cors = require('cors')

module.exports = function coresMiddleware() {
  return cors({ exposedHeaders: config.corsHeaders })
}
