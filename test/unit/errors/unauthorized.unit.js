const ErrorClass = require('../../../app/errors/unauthorized')

describe('UnauthorizedError', () => {
  it('should exist', () => {
    expect(ErrorClass).not.to.be.undefined
  })

  it('should be and instance of UnauthorizedError and Error', () => {
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
      expect(error.name).to.equal('UnauthorizedError')
    })

    it('should have 401 as a statusCode', () => {
      let error = new ErrorClass()
      expect(error.statusCode).to.equal(401)
    })

    it('should have default message', () => {
      let error = new ErrorClass()
      expect(error.message).to.equal('No authorization!')
    })

    it('should output custom message', () => {
      let error = new ErrorClass('custom error msg')
      expect(error.message).to.equal('custom error msg')
    })
  })
})
