const app = require('../../core')
const moment = require('moment')
const SignerEmailVerification = app.repositories.signerEmailVerification
const SignerEmailVerificationModel = app.models.signerEmailVerification
const logger = app.logger.getLogger('app.services.cron.email_verification_reminder')

async function email_verification_reminder(days = 1, tx = app.db) {
  logger.info('[email_verification_reminder] starting')

  const timeInterval = parseInt(app.config.get('cronInterval'), 10)
  const timeWindowStart = moment().subtract(days, 'days')
  const timeWindowEnd = moment(timeWindowStart).add(timeInterval, 'minutes')

  // build query
  const query = SignerEmailVerification.query(q => {
    // we want the MOST RECENT signerEmailVerification grouped by signer_id
    q.select(tx.knex.raw('DISTINCT ON(signer_id) *')) // groupBy signer_id

    q.where('consumed_at', null)
    q.where('created_at', '>=', timeWindowStart)
    q.where('created_at', '<', timeWindowEnd)

    q.orderBy(tx.knex.raw('signer_id, created_at'), 'DESC') // order by created_at to fetch MOST RECENT
  })

  // fetch results
  const result = await query.fetchAll({transacting: tx})

  // map to SignerEmailVerificationModel
  const SignerEmailVerificationList = result.models.map(m => new SignerEmailVerificationModel(m).data())

  // if nothing was found, we are done
  logger.info(`[email_verification_reminder] found ${SignerEmailVerificationList.length} UNVERIFIED signers since ${timeWindowStart} until ${timeWindowEnd}`)
  if (SignerEmailVerificationList.length === 0) {
    return true
  }

  // foreach signer email verification
  for (const signerEmailVerification of SignerEmailVerificationList) {
    logger.info(`[email_verification_reminder] reminding ${signerEmailVerification.signerId} with an email to verify email`)

    // update signer email verification
    await SignerEmailVerification.forge({ id: signerEmailVerification.id }).save({
      expiresAt: moment().add(1, 'days'),
      consumedAt: null
    }, { method: 'update', transacting: tx })

    // Send email
    await app.services.email.emailVerification(signerEmailVerification.id, tx)
  }

  return true
}

module.exports = email_verification_reminder
