const minimist = require('minimist')
const app = require('../app/core')
const logger = app.logger.getLogger('tasks.unlock_user')

async function unlockUser(email) {
  await app.load()

  // reset loginFailedAttempts
  const user = (await app.repositories.user.forge({ email }).fetch()).toJSON()
  await app.repositories.user.forge({ id: user.id }).save(
    { failedLoginAttempts: 0 },
    { method: 'update'}
  )

  // send recover email
  return app.services.account.recover(email)
}

const options = {
  string: ['email'],
  alias: { e: 'email' }
}
const argv = minimist(process.argv.slice(2), options)

unlockUser(argv.email)
  .then(() => {
    setTimeout(() => { process.exit() }, 1000) //eslint-disable-line
  })
  .catch((err) => {
    logger.error(err, '[unlockUser] error while unlocking user')
    process.exit() //eslint-disable-line no-process-exit
  })
