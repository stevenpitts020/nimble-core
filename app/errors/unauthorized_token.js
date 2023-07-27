class UnauthorizedTokenError extends Error {
  constructor(message) {
    super(message || 'No authorization token was found!')
    this.name = 'UnauthorizedTokenError'
    this.statusCode = 401
  }
}

module.exports = UnauthorizedTokenError
