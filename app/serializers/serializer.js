const _ = require('lodash')

function serializer(properties, data) {
  return _.reduce(properties, (memo, prop) => {
    let val = _.get(data, prop, null)

    // serialize date properties as ISO-8601
    if (_.isDate(val)) { val = val.toISOString() }

    _.set(memo, prop, val)
    return memo
  }, {})
}

module.exports = serializer
