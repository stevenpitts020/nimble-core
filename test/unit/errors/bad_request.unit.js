const ErrorClass = require('../../../app/errors/bad_request')

describe('BadRequestError', () => {
  it('should exist', () => {
    expect(ErrorClass).not.to.be.undefined
  })

  it('should be and instance of BadRequestError and Error', () => {
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
      expect(error.name).to.equal('BadRequestError')
    })

    it('should have 400 as a statusCode', () => {
      let error = new ErrorClass()
      expect(error.statusCode).to.equal(400)
    })

    it('should have default message', () => {
      let error = new ErrorClass()
      expect(error.message).to.equal(
        'The server cannot or will not process the request due to something that is perceived to be a client error'
      )
    })

    it('should output custom message', () => {
      let error = new ErrorClass('custom error msg')
      expect(error.message).to.equal('custom error msg')
    })
  })
})
