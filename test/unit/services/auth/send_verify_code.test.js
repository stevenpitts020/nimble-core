const target = require('../../../../app/services/auth/send_verify_code')
const { expect } = require('chai')

describe('app.services.auth.send_verify_code', () => {
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

  describe('send_verify_code service', () => {
    it('should return data', () => {
      const errorMessage = 'Not implemented yet.'
      expect(target).not.to.be.undefined

      return Promise.all([
        expect(target()).to.eventually.be.rejectedWith(errorMessage)
      ])
    })
  })
})

