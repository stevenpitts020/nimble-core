const axios = require('axios')
const nock = require('nock')
const mocks = require('../../../support/mock/comply_advantage')

axios.defaults.adapter = require('axios/lib/adapters/http')

describe('app.services.compliance.search', () => {

  beforeEach(() => {
    nock.disableNetConnect()
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
  })

  afterEach(() => { nock.cleanAll() })

  describe('search', async () => {

    it('should exist as a method', () => {
      expect(app.services.compliance).to.have.ownProperty('search')
      expect(app.services.compliance.search).to.be.an('Function')
    })

    it('should throw exception when there is no name for entity', async () => {
      try {
        await app.services.compliance.search({})
      } catch (error) {
        expect(error.name).to.equal('PreConditionFailedError')
        expect(error.statusCode).to.equal(412)
      }
    })


    it('should return search terms', async () => {
      const scope = nock(app.config.get('complyAdvantage').baseUrl)
        .post('/searches')
        .reply(200, mocks.successResponse)

      const entity = {
        firstName: 'Robert',
        middleName: 'Gabriel',
        lastName: 'Mugabe'
      }

      const search = await app.services.compliance.search(entity)
      expect(search).to.have.ownProperty('search')
      scope.done()
    })

    it('should return search result', async () => {
      const scope = nock(app.config.get('complyAdvantage').baseUrl)
        .post('/searches')
        .reply(200, mocks.successResponse)

      const entity = {
        firstName: 'Robert',
        middleName: 'Gabriel',
        lastName: 'Mugabe'
      }

      const search = await app.services.compliance.search(entity)
      expect(search).to.have.ownProperty('result')
      scope.done()
    })

    it('should return array of results', async () => {
      const scope = nock(app.config.get('complyAdvantage').baseUrl)
        .post('/searches')
        .reply(200, mocks.successResponse)

      const entity = {
        firstName: 'Robert',
        middleName: 'Gabriel',
        lastName: 'Mugabe'
      }

      const search = await app.services.compliance.search(entity)
      expect(search).to.have.ownProperty('hits')
      expect(search.hits).to.be.an('array')
      expect(search.hits).to.have.lengthOf(2)
      scope.done()
    })

    it('should return must relevant hit from search term first', async () => {
      const scope = nock(app.config.get('complyAdvantage').baseUrl)
        .post('/searches')
        .reply(200, mocks.successResponse)

      const entity = {
        firstName: 'Robert',
        middleName: 'Gabriel',
        lastName: 'Mugabe'
      }

      const search = await app.services.compliance.search(entity)
      expect(search.hits[0].doc.id).to.equal('N0HUXBOHUAA52RH')
      scope.done()
    })

    it('should throws exception once bad request happen', async () => {
      const scope = nock(app.config.get('complyAdvantage').baseUrl)
        .post('/searches')
        .reply(400, mocks.badRequestResponse)

      const entity = {
        firstName: 'Robert',
        middleName: 'Gabriel',
        lastName: 'Mugabe'
      }

      try {
        await app.services.compliance.search(entity)
      } catch (error) {
        expect(error.name).to.equal('PreConditionFailedError')
        expect(error.statusCode).to.equal(412)
      }
      scope.done()
    })
  })
})
