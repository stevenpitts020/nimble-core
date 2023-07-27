const _ = require('lodash')
const app = require('../../../core')
const logger = app.logger.getLogger('app.services.account_requests.helpers.referrers')

module.exports = {

  /**
   * Normalizes and checks `model.referredById`.
   *
   * @param model (generally an account_request) which carries `referredById` and potentially `institutionId`
   * @param institutionId the institution to which `referredById` should belong
   * @param tx the existing transaction
   */
  normalizeReferredById: async(model, institutionId = null, tx = app.db) => {
    if (!_.has(model, 'referredById')) return model

    model.referredById = _.trim(model.referredById)

    if (!model.referredById || model.referredById === '!') { // removing referredBy, set explicitly to null
      model.referredById = null
      return model
    }

    const iid = institutionId || model.institutionId

    if (!iid) { // no institution id to verify referredById, remove it
      logger.warn(model, 'referredById set, but institutionId not provided or found on model; ignoring referredById')
      _.unset(model, 'referredById')
      return model
    }

    try { // check if the user identified by `referredById` belongs to the institution identified by `iid`
      await app.services.user.findOneByExample({ id: model.referredById, institutionId: iid }, tx) // throws if not found
    } catch(ex) {
      logger.warn(model, `referredById set, but user not found for id=${model.referredById} and institutionId=${iid}; ignoring referredById`)
      _.unset(model, 'referredById')
      return model
    }

    return model // no more checks, the user identified by `referredById` belongs to the institution identified by `iid`
  }
}
