const _ = require('lodash')
const app = require('../../core')
const PreconditionFailedError = require('../../errors/precondition_failed')
const createProductConfigurations = require('./helpers/create_product_configurations')
const referrers = require('./helpers/referrers')

const AccountRequest = app.repositories.accountRequest
const AccountRequestModel = app.models.accountRequest
const AccountRequestProduct = app.repositories.accountRequestProduct
const AccountRequestProductOption = app.repositories.accountRequestProductOption
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.account_request.update')

const whitelist = AccountRequestModel.props()

async function validate(params) {
  let data = _.pick(params, whitelist)
  validator(data, AccountRequestModel.schema('update'), { abortEarly: false })
  return data
}

function getSignerFullName(signer) {
  if (signer == null) {
    return ''
  }

  const names = []
  if (signer.firstName) names.push(signer.firstName)
  if (signer.middleName) names.push(signer.middleName)
  if (signer.lastName) names.push(signer.lastName)

  return names.join(' ').trim()
}

function sendAccountRequestApprovedQueueMessage(accountRequestId) {
  app.services.eventStream.publish({
    topicArn: app.config.get('sns').topicAccountRequest,
    id: accountRequestId,
    event: app.services.eventStream.events.accountRequestApproved
  })
}

/**
 * Send a message to all the signers informing the account was approved or declined
 *
 * @param {string} statusTo - status transitioned to
 * @param {*} accountRequest - account request obj
 * @param {*} options - extra options to send to the email (like subject, etc)
 */
function sendAprovedDeclinedMessage(statusTo, accountRequest, options) {
  // send email to each signer
  const statusEmailBody = options.statusEmailBody
  accountRequest.signers.forEach(async signer => {
    if (signer.emailVerified) {
      options.statusEmailBody = statusEmailBody
        .replace(/{\$Signer_FirstName}/g, signer.firstName)
        .replace(/{\$Signer_FullName}/g, getSignerFullName(signer))
      await app.plugins.email.sendAccountRequestStatus(statusTo, {
        email: signer.email,
        ...options
      })
      logger.debug(`[sendAprovedDeclinedMessage] email sent on transition status to ${statusTo} for email ${signer.email}`)
    }
  })
}


/**
   * Send contract by docusign to all signers to sign.
   *
   * @param {*} accountRequest - account request obj
   */
async function sendContractToSigners(accountRequestId, tx = app.db) {
  // compiling and sending contract
  try {
    await app.services.contract.send(accountRequestId, tx)
  } catch (err) {
    logger.error(err, `[sendContractToSigners] Error while processing "app.services.contract.send" for account request id [${accountRequestId}]`)
  }
}

/**
 * This function is responsible for triggering side-effects (or actions)
 * when a state transitions from A to B.
 * Example: Transition from signed to declined to send an email.
 *
 *
 * @param {{from: string, to: string, accountRequest: obj, options: any}} payload - state from
 */
async function stateTransition(payload, tx = app.db) {
  const transition = `from_${payload.from}_to_${payload.to}`
  logger.info(`[stateTransition] called ${transition}`)

  // TODO: We are missing some transitions. Webhook must update Status to be SIGNED
  switch (transition) {
    case 'from_DRAFT_to_INCOMPLETE':
      await sendContractToSigners(payload.accountRequest.id, tx)
      logger.info('[stateTransition] transition from_DRAFT_to_INCOMPLETE sent contract to signers')
      break
    case 'from_INCOMPLETE_to_PENDING':
      logger.info('[stateTransition] transition from_INCOMPLETE_to_PENDING nothing to do')
      break
    case 'from_SIGNED_to_APPROVED':
      sendAccountRequestApprovedQueueMessage(payload.accountRequest.id.toUpperCase())
      sendAprovedDeclinedMessage(payload.to, payload.accountRequest, payload.options)
      break
    case 'from_SIGNED_to_DECLINED':
      // Temporarily removed in issue #73
      // sendAprovedDeclinedMessage(payload.to, payload.accountRequest, payload.options)
      break
    default:
      logger.info(`[stateTransition] transition ${transition} is not recognized.`)
  }
  return
}

async function update(params, statusUpdatedById, tx = app.db) {
  // simple update, not changing statusUpdatedById
  if (!statusUpdatedById) {
    const data = await validate(params)
    const accountRequest = await app.services.accountRequest.get(data.id, tx)

    if (_.has(data, 'status')) {
      // when moving to INCOMPLETE signer creation is closed
      if (data.status === 'INCOMPLETE' && accountRequest.status !== 'DRAFT') {
        throw new PreconditionFailedError('Status can only be changed to INCOMPLETE if it was previously DRAFT')
      }
      // when moving to PENDING all signers have all personal data
      if (data.status === 'PENDING' && accountRequest.status !== 'INCOMPLETE') {
        throw new PreconditionFailedError('Status can only be changed to PENDING if it was previously INCOMPLETE')
      }

      await stateTransition(
        { from: accountRequest.status, to: data.status, accountRequest: accountRequest, options: null },
        tx
      )
    }

    if (_.has(data, 'productConfigurations')) {
      if (accountRequest.status !== 'DRAFT' && accountRequest.status !== 'INCOMPLETE') {
        throw new PreconditionFailedError('Can only update product configurations on status DRAFT or INCOMPLETE')
      }

      if (accountRequest.productConfigurations.length != 0) {
        // Delete previous products configuration
        const payload = { account_request_id: accountRequest.id }
        await AccountRequestProduct.where(payload).destroy({ require: false, transacting: tx })
        await AccountRequestProductOption.where(payload).destroy({ require: false, transacting: tx })
      }

      await createProductConfigurations(accountRequest.id, data, tx)
    }

    await referrers.normalizeReferredById(data, accountRequest.institutionId, tx) // mutates data.referredById

    // account request update
    await AccountRequest.forge({ id: data.id })
      .save({ ..._.omit(data, AccountRequestModel.relations()) }, {
        method: 'update',
        transacting: tx
      })

    return await app.services.accountRequest.get(accountRequest.id, tx)
  }

  // complex update, changing statusUpdatedById
  const data = await validate({
    ...params,
    statusUpdatedById,
    statusUpdatedAt: new Date()
  })

  const user = await app.services.user.get(statusUpdatedById, tx)
  const id = await tx.transaction(async tx => {
    // fetch
    const accountRequest = await app.services.accountRequest.get(data.id, tx)

    if (_.has(data, 'status')) {
      if (accountRequest.status === 'APPROVED' || accountRequest.status === 'DECLINED')
        throw new PreconditionFailedError('Status can not be changed if it was previously ' + accountRequest.status)

      if (accountRequest.status != 'SIGNED' && data.status === 'APPROVED')
        throw new PreconditionFailedError('Status can only be changed to APROVED if it was previously SIGNED')

      await stateTransition(
        {
          from: accountRequest.status,
          to: data.status,
          accountRequest: accountRequest,
          options: {
            cc: user.email,
            statusEmailSubject: data.statusEmailSubject,
            statusEmailBody: data.statusEmailBody.replace(/\n/g, '<br/>')
          }
        },
        tx
      )
    }

    // update
    const updatedAccountRequest = await AccountRequest.forge({ id: data.id }).save(data, {
      method: 'update',
      transacting: tx
    })

    return updatedAccountRequest.get('id')
  })

  return app.services.accountRequest.get(id, tx)
}

module.exports = update
