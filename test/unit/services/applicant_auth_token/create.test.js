const target = require('../../../../app/services/applicant_auth_token/create')
const { expect } = require('chai')

describe('app.services.applicantOneTimeToken.create', () => {
  let body, clock

  before(() => {
    clock = sinon.useFakeTimers()
  })

  after(() => {
    clock.restore()
  })

  beforeEach(async () => {
    await seed.applicantOneTimeToken.create('2345f171-b3b7-4167-abfb-ff9203514bde')
  })

  it('should exist', () => {
    expect(target).not.to.be.undefined
  })

  describe('auth_tokens', () => {
    describe('method:verify-code', () => {
      beforeEach(() => {
        body = {
          id: '5856878184',
          role: 'applicant',
          method: 'verify-code'
        }
      })

      describe('body properties are invalid or missing', () => {
        it('should throw an error when missing or invalid Id', () => {
          const bodyProp = { id: null }
          const errorMessage = "Id is missing"
          expect(target).not.to.be.undefined

          return Promise.all([
            expect(target(bodyProp)).to.eventually.have.property('message').equal(errorMessage)
          ])
        })

        it('should throw an error when missing or invalid role', () => {
          const bodyProp = { id: "111", role: null }
          const errorMessage = "Role is missing"
          expect(target).not.to.be.undefined

          return Promise.all([
            expect(target(bodyProp)).to.eventually.have.property('message').equal(errorMessage)
          ])
        })

        it('should throw an error when missing or invalid method', () => {
          const bodyProp = { id: "111", role: "test", method: null }
          const errorMessage = "Method is missing"
          expect(target).not.to.be.undefined

          return Promise.all([
            expect(target(bodyProp)).to.eventually.have.property('message').equal(errorMessage)
          ])
        })
      })

      describe('body properties have valid data', () => {
        it('should return data', () => {
          return Promise.all([
            expect(target({...body})).to.eventually.have.property('id').equal(body.id)
          ])
        })
      })
    })

    describe('method:token-exchange', () => {
      beforeEach(() => {
        body = {
          id: '5856878184',
          role: 'applicant',
          method: 'token-exchange',
          verification_token: 'aaa',
          verification_code: '123'
        }
      })

      describe('body properties are invalid or missing', () => {
        it('should throw an error when missing or invalid verification_token', () => {
          const bodyProp = { ...body, verification_token: null }
          const errorMessage = "Verification token is missing"
          expect(target).not.to.be.undefined

          return Promise.all([
            expect(target(bodyProp)).to.eventually.have.property('message').equal(errorMessage)
          ])
        })

        it('should throw an error when missing or invalid verification_code', () => {
          const bodyProp = { ...body, verification_code: null }
          const errorMessage = "Verification code is missing"
          expect(target).not.to.be.undefined

          return Promise.all([
            expect(target(bodyProp)).to.eventually.have.property('message').equal(errorMessage)
          ])
        })
      })

      // describe('body properties have valid data', () => {
      //   it('should return data', () => {
      //     return Promise.all([
      //       expect(target({...body})).to.eventually.have.property('id').equal(body.id)
      //     ])
      //   })
      // })
    })
  })
})
