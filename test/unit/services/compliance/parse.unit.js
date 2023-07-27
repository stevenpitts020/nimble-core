const axios = require('axios')
const nock = require('nock')
const mocks = require('../../../support/mock/comply_advantage')

axios.defaults.adapter = require('axios/lib/adapters/http')

describe('app.services.compliance.parse', () => {
  let searchResult = {}
  beforeEach(() => {
    nock.disableNetConnect()
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
  })

  before(async () => {
    const scope = nock(app.config.get('complyAdvantage').baseUrl)
      .post('/searches')
      .reply(200, mocks.successResponse)

    const entity = {
      firstName: 'Robert',
      middleName: 'Gabriel',
      lastName: 'Mugabe'
    }

    searchResult = await app.services.compliance.search(entity)
    scope.done()
  })

  afterEach(() => { nock.cleanAll() })

  describe('search', async () => {

    it('should exist as a method', () => {
      expect(app.services.compliance).to.have.ownProperty('parse')
      expect(app.services.compliance.parse).to.be.an('Function')
    })

    it('should return an array', async () => {
      const target = await app.services.compliance.parse(searchResult)
      expect(target).to.be.an('array')
    })

    describe('parsed result', () => {
      it('should return an array of object', async () => {
        const target = await app.services.compliance.parse(searchResult)
        for (let item of target) {
          expect(item).to.be.an('object')
        }
      })

      it('object should have an expected schema', async () => {
        const target = await app.services.compliance.parse(searchResult)
        const first = _.first(target)

        expect(first).to.have.ownProperty('fullName')
        expect(first).to.have.ownProperty('nameAka')
        expect(first).to.have.ownProperty('dateOfBirth')
        expect(first).to.have.ownProperty('dateOfDeath')
        expect(first).to.have.ownProperty('matchTypes')
        expect(first).to.have.ownProperty('countries')
        expect(first).to.have.ownProperty('associates')
        expect(first).to.have.ownProperty('adverseMedia')
        expect(first).to.have.ownProperty('warnings')
        expect(first).to.have.ownProperty('sanctions')
        expect(first).to.have.ownProperty('politicalExposure')

        expect(first.dateOfDeath).to.equal(null)
        expect(first.dateOfBirth).to.be.an('string')
        expect(first.matchTypes).to.be.an('string')
        expect(first.nameAka).to.be.an('array')
        expect(first.fullName).to.be.an('string')
        expect(first.countries).to.be.an('array')
        expect(first.associates).to.be.an('array')
        expect(first.adverseMedia).to.be.an('array')
        expect(first.warnings).to.be.an('array')
        expect(first.sanctions).to.be.an('array')
        expect(first.politicalExposure).to.be.an('array')
      })

      it('object should have an expected result schema', async () => {
        const target = await app.services.compliance.parse(searchResult)
        const first = _.first(target)


        expect(first.associates).to.have.lengthOf(13)
        expect(first.countries).to.have.lengthOf(9)
        expect(first.nameAka).to.have.lengthOf(51)
        expect(first.adverseMedia).to.have.lengthOf(30)
        expect(first.politicalExposure).to.have.lengthOf(32)
        expect(first.warnings).to.have.lengthOf(0)
        expect(first.sanctions).to.have.lengthOf(51)


        const item = _.first(first.sanctions)

        expect(item).to.have.ownProperty('name')
        expect(item).to.have.ownProperty('url')
        expect(item).to.have.ownProperty('date')
        expect(item).to.have.ownProperty('source')
        expect(item).to.have.ownProperty('value')
        expect(item).to.have.ownProperty('countryCodes')
      })

      it('object should have an expected result data', async () => {
        const target = await app.services.compliance.parse(searchResult)

        expect(target).to.deep.equal(mocks.parsedResult)
      })


    })

  })
})
