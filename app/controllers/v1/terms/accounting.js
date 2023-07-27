const _ = require('lodash')
const app = require('../../../core')
const nimbleData = app.plugins.nimbleData

module.exports = async(req, res) => {
  const search = _.get(req, 'params.term')

  res.send(search
    ? await res.send(await nimbleData.get('chart-of-accounts', { search }))
    : await nimbleData.get('chart-of-accounts'))
}
