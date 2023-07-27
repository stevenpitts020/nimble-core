const ErrorClass = require('../../../app/errors/conflict')

describe('ConflictError', () => {
  it('should exist', () => {
    expect(ErrorClass).not.to.be.undefined
  })

  it('should be and instance of ConflictError and Error', () => {
    let error = new ErrorClass()
    expect(error).to.be.instanceOf(ErrorClass)
    expect(error).to.be.instanceOf(Error)
  })

  it('should have a status code and message', () => {
    let error = new ErrorClass()
    expect(error).have.property('statusCode')
    expect(error).have.property('message')
  })

  describe('when instanced', () => {
    it('should have correct name', () => {
      let error = new ErrorClass()
      expect(error.name).to.equal('ConflictError')
    })

    it('should have 409 as a statusCode', () => {
      let error = new ErrorClass()
      expect(error.statusCode).to.equal(409)
    })

    it('should have default message', () => {
      let error = new ErrorClass()
      expect(error.message).to.equal(
        'The request could not be completed due to a conflict with the current state of the target resource'
      )
    })

    it('should output custom message', () => {
      let error = new ErrorClass('custom error msg')
      expect(error.message).to.equal('custom error msg')
    })
  })
})
