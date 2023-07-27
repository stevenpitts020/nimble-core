const app = require('../../core')

async function get() {
  try {
    // verify we can execute a repository-backed service request
    // TODO: allow service to implement health and delegate to each; use explicit health table to prevent locks, etc
    await app.services.user.list({ limit: 1, offset: 0 })
  } catch(err) {
    return {
      code: 500,
      status: 'Internal Server Error',
      message: `Unavailable: ${err.message}`
    }
  }

  return {
    code: 200,
    status: 'ok',
    message: 'Available'
  }
}

module.exports = get
