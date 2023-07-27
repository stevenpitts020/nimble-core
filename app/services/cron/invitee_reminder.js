const app = require('../../core')
const moment = require('moment')
const AccountRequest = app.repositories.accountRequest
const AccountRequestModel = app.models.accountRequest
const logger = app.logger.getLogger('app.services.cron.invitee_reminder')

async function invitee_reminder(days = 1, tx = app.db) {
  logger.info('[invitee_reminder] starting')

  const timeInterval = parseInt(app.config.get('cronInterval'), 10)
  const timeWindowStart = moment().subtract(days, 'days')
  const timeWindowEnd = moment(timeWindowStart).add(timeInterval, 'minutes')

  // build query
  const query = AccountRequest.query(q => {
    q.where('status', 'INCOMPLETE')
    q.where('created_at', '>=', timeWindowStart)
    q.where('created_at', '<', timeWindowEnd)
  })

  // fetch results
  const result = await query.fetchAll({
    withRelated: ['signers'],
    transacting: tx
  })

  // map to AccountRequestModel
  const AccountRequestList = result.models.map(m => new AccountRequestModel(m).data())

  // if nothing was found, we are done
  logger.info(`[invitee_reminder] found ${AccountRequestList.length} INCOMPLETE account requests since ${timeWindowStart} until ${timeWindowEnd}`)
  if (AccountRequestList.length === 0) {
    return true
  }


  // foreach account request
  for (const accountRequest of AccountRequestList) {
    // filter by INVITED signers
    const invitedSigners = accountRequest.signers.filter(signer => signer.status === 'INVITED')
    logger.info(`[invitee_reminder] found ${invitedSigners.length} INVITED signers for account request ${accountRequest.id}`)
    if (invitedSigners.length > 0) {
      const originalSigner = accountRequest.signers.find(s => s.id === accountRequest.createdById)
      // SEND warning to the original signer
      if (originalSigner) {
        logger.info(`[invitee_reminder] reminding ${originalSigner.id} that invites are pending with an email`)
        await app.services.email.prospectPendingSigners(originalSigner.id)
      }
      // foreach INCOMPLETE signer
      for (const signer of invitedSigners) {
        logger.info(`[invitee_reminder] reminding ${signer.id} with an email`)
        await app.services.email.inviteReminder(signer.id)
      }
    }
  }

  return true
}

module.exports = invitee_reminder
