const nock = require('nock')
const shuftiResponse = require('../../../support/mock/shufti')
const mircroblinkResponse = require('../../../support/mock/microblink')
const complyAdvantage = require('../../../support/mock/comply_advantage')

const config = require('../../../../config')
const _ = require('lodash')

async function insert(table, data) {
  const row = await knex(table).returning('*').insert(data)
  return _.first(row)
}

async function post(endpoint, obj) {
  return request(app.server)
    .post(endpoint)
    .send(obj)
    .expect('Content-Type', /json/)
}

async function get(endpoint) {
  return request(app.server)
    .get(endpoint)
    .expect('Content-Type', /json/)
}

async function put(endpoint, obj) {
  return request(app.server)
    .put(endpoint)
    .send(obj)
    .expect('Content-Type', /json/)
}

async function withMicroblink(mock, assertOnError, bodyFn) {
  const scope = nock(config.get('microblink').baseUrl)
    .post('/recognize/execute')
    .reply(mock.status, mock.response)

  try {
    await bodyFn()
  } catch(e) {
    assertOnError(e)
  }
  finally {
    scope.done()
  }
}

/*
* mock:
*  oauth
*  documentTabs
*  createEnvelope
* */
async function withDocusign(mockResponse, bodyFn) {
  nock(`https://${config.get('docusign').oauthPath}`)
    .post('/oauth/token')
    .reply(200, mockResponse.oauth)

  nock(config.get('docusign').basePath)
  .get(`/v2.1/accounts/${config.get('docusign').accountID}/templates/NONE/documents/1/tabs`)
  .reply(200, mockResponse.documentTabs)

  nock(config.get('docusign').basePath)
  .post(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes`)
  .reply(200, mockResponse.createEnvelope)

  try {
    await bodyFn()
  }finally {
    nock.cleanAll()
  }
}

async function withInvalidDocusign(bodyFn) {
  nock(`https://${config.get('docusign').oauthPath}`)
    .post('/oauth/token')
    .reply(401, {error: 'Invalid'})

  try {
    await bodyFn()
  }finally {
    nock.cleanAll()
  }
}


async function signerById(id) {
  return await knex('signers')
    .join('account_requests', 'account_requests.id', 'signers.account_request_id')
    .where('signers.id', id)
    .select(
      'signers.id as signer_id',
      'signers.role as signer_role',
      'signers.first_name as signer_first_name',
      'signers.address as signer_address',
      'signers.middle_name as signer_middle_name',
      'signers.last_name as signer_last_name',
      'signers.city as signer_city',
      'signers.date_of_birth as signer_date_of_birth',
      'signers.state as signer_state',
      'signers.zip_code as signer_zip_code',
      'signers.address as signer_address',
      'signers.document_type as signer_document_type',
      'signers.document_number as signer_document_number',
      'signers.document_expiration_date as signer_document_expiration_date',
      'signers.document_issued_date as signer_document_issued_date',
      'signers.identity_verification_result as signer_identity_verification_result',
      'signers.identity_verification_status as signer_identity_verification_status',
      'signers.identity_verified as signer_identity_verified',
      'signers.institution_id as signer_institution_id',
      'signers.check_sanction as signer_check_sanction',
      'signers.sanction_verified_at as signer_sanction_verified_at',
      'signers.check_political_exposure as signer_check_political_exposure',
      'signers.political_exposure_verified_at as signer_political_exposure_verified_at',
      'signers.check_adverse_media as signer_check_adverse_media',
      'signers.adverse_media_verified_at as signer_adverse_media_verified_at',
      'signers.check_anti_money_laundering as signer_check_anti_money_laundering',
      'signers.anti_money_laundering_verified_at as signer_anti_money_laundering_verified_at',
      'account_requests.status as account_request_status')
    .first()
}

async function mockExternalServices(mockData, bodyFn) {
  const sleep = (ms)  => new Promise(resolve => setTimeout(resolve, ms))

  const defaultMockData = {
    microblink: {status: 200,
      response: mircroblinkResponse.successResponse,
      endpoint: '/recognize/execute' },
    shufti: {status: 200,
      response: shuftiResponse.acceptedResponse,
      endpoint: '/api/', async: true},
    complyAdvantage: {status: 200,
      response: complyAdvantage.successResponse,
      endpoint: '/searches', async: true }
  }

  if (typeof mockData === 'function') {
    bodyFn = mockData
    mockData = {}
  }

  mockData = _.merge(_.cloneDeep(defaultMockData), mockData)
  const services = Object.keys(mockData)
  const scopes = services.map(service => {
    const scope = nock(config.get(service).baseUrl)
      .post(mockData[service].endpoint)
      .reply(mockData[service].status, mockData[service].response)

    return {async:mockData[service].async, scope: scope }
  })

  await bodyFn()

  scopes.map(async service => {
    if (service.async) {
     await sleep(50)
    }
    service.scope.done()
  })
}

function disableNet() {
  nock.disableNetConnect()
  nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
}

function removeInterceptors() {
  nock.cleanAll()
}

async function createSigner(data) {
  data = data || {}
  const ar = await insert('account_requests',
    {..._.omit(data, 'step'), status: "PENDING"}
  )

  const signerData = {
    account_request_id: ar.id,
    consent: true,
    role: 'PRIMARY',
    email: 'somedude@wearesingular.com',
  }

  return await insert('signers', {...signerData, ...data})
}

module.exports = {
  get,
  post,
  put,
  withDocusign,
  withMicroblink,
  withInvalidDocusign,
  mockExternalServices,
  signerById,
  disableNet,
  removeInterceptors,
  insert,
  createSigner}
