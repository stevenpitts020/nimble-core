class NotImplementedError extends Error {
  constructor(message) {
    super(message || 'Not Implemented')
    this.name = 'NotImplementedError'
    this.statusCode = 501
  }
}

module.exports = NotImplementedError
