const ErrorClass = require('../../../app/errors/forbidden')

describe('ForbiddenError', () => {
  it('should exist', () => {
    expect(ErrorClass).not.to.be.undefined
  })

  it('should be and instance of ForbiddenError and Error', () => {
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
      expect(error.name).to.equal('ForbiddenError')
    })

    it('should have 403 as a statusCode', () => {
      let error = new ErrorClass()
      expect(error.statusCode).to.equal(403)
    })

    it('should have default message', () => {
      let error = new ErrorClass()
      expect(error.message).to.equal('The server understood the request but refuses to authorize it.')
    })

    it('should output custom message', () => {
      let error = new ErrorClass('custom error msg')
      expect(error.message).to.equal('custom error msg')
    })
  })
})
