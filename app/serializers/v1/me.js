const _ = require('lodash')
const app = require('../../core')
const defaultSerializer = require('../serializer')

const properties = ['id', 'email', 'firstName', 'lastName', 'createdAt', 'branchId', 'roles', 'status', 'phone']

function serializer(data) {
  let format = defaultSerializer(properties, data)

  format.institution = app.serializers.v1.institution(data.institution)
  format.branch = app.serializers.v1.institutionBranch(data.branch)

  if (_.has(data, 'accounts')) {
    format.accounts = data.accounts.map(app.serializers.v1.account)
  }

  format._refLink = `${app.config.get('protocol')}://${app.config.get('frontend.onboarding_domain')}/${data.institution ? data.institution.domain : ''}/onboarding/?_rbid=${data.id}`

  return format
}

module.exports = serializer
