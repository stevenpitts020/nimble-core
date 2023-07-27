class ConflictError extends Error {
  constructor(message) {
    super(
      message ||
        'The request could not be completed due to a conflict with the current state of the target resource'
    )
    this.name = 'ConflictError'
    this.statusCode = 409
  }
}

module.exports = ConflictError
