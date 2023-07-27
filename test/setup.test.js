before(async function() {
  this.timeout(10000)
  global.app = await require('../index')

  await knex.migrate.latest()
  return await seed.flush()
})

afterEach(async function() {
  this.timeout(10000)

  nock.enableNetConnect()

  return await seed.flush()
})
