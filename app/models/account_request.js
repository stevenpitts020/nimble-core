const Joi = require('@hapi/joi')
const _ = require('lodash')

const app = require('../core')
const BaseModel = require('./model')

class AccountRequest extends BaseModel {
  constructor(data) {
    super(AccountRequest.props(), AccountRequest.relations(), data)
  }

  static props() {
    return [
      'id',
      'status',
      'institutionId',
      'branchId',
      'bsaScore',
      'bsaRisk',
      'createdById',
      'createdAt',
      'productConfigurations',
      'referrers', // FIXME: exists for backward compatability
      'referredById',
      'statusUpdatedById',
      'statusUpdatedAt',
      'statusEmailSubject',
      'statusEmailBody',
      'contractDocumentId',
      'contractDocumentEnvelopeId',
      'contractDocumentCreatedAt',
      'contractDocumentEnvelopeStatus',
      'contractDocumentEnvelopeStatusUpdatedAt'
    ]
  }

  static relations() {
    return ['signers', 'referredBy', 'statusUpdatedBy', 'productConfigurations', 'productOptions', 'branch']
  }

  data() {
    const SignerModel = app.models.signer
    const UserModel = app.models.user
    const InstitutionBranchModel = app.models.institutionBranch
    const signers = this._data.signers.map(signerData => new SignerModel(signerData).data())

    return {
      ..._.omit(this._data, [
        'signers',
        'referredBy',
        'statusUpdatedBy',
        'verificationStatus',
        'productConfigurations',
        'productOptions',
        'branch'
      ]),
      signers: signers,
      verificationStatus: AccountRequest.getVerificationStatus(signers),
      referredBy: this._data.referredBy ? new UserModel(this._data.referredBy).data() : null,
      statusUpdatedBy: this._data.statusUpdatedBy ? new UserModel(this._data.statusUpdatedBy).data() : null,
      productConfigurations: this.mapProductConfigurations(),
      branch: this._data.branch ? new InstitutionBranchModel(this._data.branch).data() : null
    }
  }

  mapProductConfigurations() {
    if (!_.has(this._data, 'productConfigurations')) {
      return []
    }

    const AccountRequestProduct = app.models.accountRequestProduct
    const ProductOption = app.models.productOption

    return this._data.productConfigurations.map(obj => {
      // filter relevant options for this product
      const options = _.get(this._data, 'productOptions', [])
        .filter(po => po.productId === obj.productId)
        .map(po => new ProductOption(po).data())
      // assign that to the product
      obj.product.options = options

      // build sub model
      return new AccountRequestProduct(obj).data()
    })
  }

  static status() {
    return ['DRAFT', 'INCOMPLETE', 'PENDING', 'SIGNED', 'APPROVED', 'DECLINED']
  }

  static getVerificationStatus(signers) {
    const KEYMAP = {  // map each states to its  (0) VALID and (1) INVALID
      verificationStatusFace: ['VALID', 'INVALID'],
      verificationStatusDocument: ['VALID', 'INVALID'],
      verificationStatusAddress: ['VALID', 'INVALID'],
      verificationStatusSanctions: ['NOMATCH', 'MATCH'],
      verificationStatusMedia: ['NOMATCH', 'MATCH'],
      verificationStatusPoliticalExposure: ['NOMATCH', 'MATCH']
    }

    // if we dont have signers, default to PENDING
    if (_.isEmpty(signers)) {
      return Object.keys(KEYMAP).reduce((o, k) => ({ ...o, [k]: 'PENDING' }), {})
    }

    // for each signer
    const counter = signers.reduce((acountStatus, signer) => {
      return {
        ...acountStatus, // create an object
        ...Object.keys(KEYMAP).reduce((status, key) => { // with the keys from KEYMAP
          return {
            ...status,
            [key]: signer[key] + (acountStatus[key] === undefined ? '' : ',' + acountStatus[key]) // create a list of results
          }
        }, {})
      }
    }, {})

    const acountVerificationStatus = Object.keys(counter).reduce((acountStatus, key) => {
      const value = counter[key]
        .split(',')
        .map(i => KEYMAP[key].indexOf(i)) // match with index of KEYMAP
        .reduce((sum, num) => { // sum the indexes. so we can check for -1, 0 or 1 later
          return sum + (num >= 0 ? num : -Infinity) // PENDING should prevent any number from reaching >= 0
        }, 0)
      return { // create an object with the same keys
        ...acountStatus,
        [key]: value < 0 ? 'PENDING' : KEYMAP[key][0 + !!value] // fetch the correct value from the KEYMAP based on 0 or 1
      }
    }, {})

    return acountVerificationStatus
  }

  static referrer() { // FIXME: exists for backward compatability
    return Joi.object().keys({
      id: Joi.string(),
      name: Joi.string(),
      email: Joi.string().email()
    })
  }

  static productConfigurationSchema() {
    return Joi.object().keys({
      productId: Joi.string().uuid().required(),
      initialDeposit: Joi.number().integer().positive().allow(0).required(),
      options: Joi.array().optional().min(0).items(Joi.object().keys({
        key: Joi.string().required(),
        title: Joi.string().required(),
        category: Joi.string().required(),
        value: Joi.string().required()
      }))
    })
  }

  static schema(operation) {
    if (![
      'get',
      'create',
      'patch',
      'patch.api.public',
      'update',
      'update.api.public',
      'update.api.private',
      'webhook'
    ].includes(operation)) {
      throw new Error('Invalid schema operation.')
    }

    switch (operation) {
      case 'create':
        return Joi.object().keys({
          referredById: Joi.string().uuid().optional().allow(null),
          institutionId: Joi.string().uuid().required(),
          productConfigurations: Joi.array().required().items(this.productConfigurationSchema()).min(1).max(1)
        })
      case 'update':
        return Joi.object().keys({
          id: Joi.string().uuid().required(),
          createdById: Joi.string().uuid(),
          status: Joi.string().valid(...AccountRequest.status()),
          bsaRisk: Joi.string().valid('High', 'Moderate', 'Low'),
          bsaScore: Joi.number().min(0).default(0),
          referredById: Joi.string().uuid().optional().allow(null, '', '!'),
          statusUpdatedById: Joi.string().uuid(),
          statusEmailSubject: Joi.string(),
          statusEmailBody: Joi.string(),
          statusUpdatedAt: Joi.date(),
          branchId: Joi.string().uuid(),
          productConfigurations: Joi.array().items(this.productConfigurationSchema()).min(1).max(1)
        })
      case 'patch':
        return Joi.object().keys({
          id: Joi.string().uuid().required(),
          deleted: Joi.boolean().optional(),
          status: Joi.string().optional().valid(...AccountRequest.status()),
          bsaRisk: Joi.string().optional().valid('High', 'Moderate', 'Low'),
          bsaScore: Joi.number().optional().min(0).default(0),
          statusEmailSubject: Joi.string().optional(),
          statusEmailBody: Joi.string().optional(),
          branchId: Joi.string().optional().uuid(),
          referredById: Joi.string().uuid().optional().allow(null, '', '!'),
          referrers: Joi.array().optional().items(this.referrer()), // FIXME: exists for backward compatability
          productConfigurations: Joi.array().optional().items(this.productConfigurationSchema()).min(1).max(1)
        })
      case 'update.api.public':
        return Joi.object().keys({
          id: Joi.string().uuid().required(),
          status: Joi.string().optional().valid('INCOMPLETE'),
          referredById: Joi.string().uuid().optional().allow(null, '', '!'),
          productConfigurations: Joi.array().optional().items(this.productConfigurationSchema()).min(1).max(1)
        })
      case 'update.api.private':
        return Joi.object().keys({
          id: Joi.string().uuid().required(),
          status: Joi.string().required().valid('APPROVED', 'DECLINED'),
          statusEmailSubject: Joi.string().required(),
          statusEmailBody: Joi.string().required(),
          referredById: Joi.string().uuid().optional().allow(null, '', '!'),
          branchId: Joi.alternatives().conditional('status', { is: 'APPROVED', then: Joi.string().uuid().required() })
        })
      case 'patch.api.public':
        return Joi.object().keys({
          id: Joi.string().uuid().required(),
          deleted: Joi.boolean().optional(),
          status: Joi.string().optional().valid(...AccountRequest.status()),
          referredById: Joi.string().uuid().optional().allow(null, '', '!'),
          referrers: Joi.array().optional().items(this.referrer()), // FIXME: exists for backward compatability
          productConfigurations: Joi.array().optional().items(this.productConfigurationSchema()).min(1).max(1)
        })
      case 'webhook':
        return Joi.object().keys({
          id: Joi.string().uuid().required(),
          token: Joi.string().required()
        })
      default:
      case 'get':
        return Joi.object().keys({
          id: Joi.string().uuid().required()
        })
    }
  }
}

module.exports = AccountRequest
