const sinon = require('sinon')
const { Consumer } = require('sqs-consumer')

function message(msg) {
  return { Body: JSON.stringify(msg) }
}

describe('app.services.subscriber.creditReport', () => {

  afterEach(() => sinon.restore())

  it('should exist', () => {
    expect(app.services.subscriber.creditReport).not.to.be.undefined
    expect(app.services.subscriber.creditReport).to.be.an('function')
  })

  it('should return a message queue Consumer', () => {
    const target = app.services.subscriber.creditReport()

    expect(target).to.be.an('object')
    expect(target).to.be.instanceOf(Consumer)
    expect(target).to.have.ownProperty('handleMessage')
    expect(target.handleMessage).to.be.an('function')
  })

  describe('.handleMessage()', () => {
    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.document.create()
      await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
      await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
      await knex.raw("UPDATE signers SET status='PENDING'")
    })

    it('should call app.services.compliance.check with message.id', async () => {
      const fakeService = sinon.replace(app.services.creditReport, 'fetch', sinon.fake())

      const target = app.services.subscriber.creditReport()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeService).to.have.been.calledOnce
      expect(fakeService).to.have.been.calledWith(blueprints.signers.signer_1.id)
    })
  })
})
