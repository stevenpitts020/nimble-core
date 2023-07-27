class InternalServerError extends Error {
  constructor(message) {
    super(message || 'Something unexpected happened!')
    this.name = 'InternalServerError'
    this.statusCode = 500
  }
}

module.exports = InternalServerError
