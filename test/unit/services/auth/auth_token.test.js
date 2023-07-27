const target = require('../../../../app/services/auth/auth_token')
const { expect } = require('chai')

describe('app.services.auth.auth_token', () => {
  let clock

  before(() => {
    clock = sinon.useFakeTimers()
  })

  after(() => {
    clock.restore()
  })


  it('should exist', () => {
    expect(target).not.to.be.undefined
  })

  describe('auth_token service', () => {
    it('should return data', () => {
      const errorMessage = 'Not implemented yet.'
      expect(target).not.to.be.undefined

      return Promise.all([
        expect(target()).to.eventually.be.rejectedWith(errorMessage)
      ])
    })
  })
})

