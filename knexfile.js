const config = require('./config')
const dbConfig = config.get('database')

const knexConfig = {
  client: 'pg',
  debug: config.get('database').debug,
  connection: dbConfig.uri,
  pool: {
    min: 1,
    max: 6,
    propagateCreateError: false
  },
  migrations: {
    tableName: dbConfig.migrations
  },
  seeds: {
    directory: './seeds'
  }
}

module.exports = knexConfig
