const _ = require('lodash')

const properties = ['count']

function serializer(data) {
  let obj = _.pick(data, properties)
  //convert everything to int
  return _.mapValues(obj, _.toInteger)
}

module.exports = serializer
