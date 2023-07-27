const sinon = require('sinon')
const { Consumer } = require('sqs-consumer')
const mocks = require('../../support/mock/shufti')

function message(msg) {
  return { Message: JSON.stringify(msg) }
}

describe('app.services.subscriber.identity', () => {

  afterEach(() => sinon.restore())

  it('should exist', () => {
    expect(app.services.subscriber.identity).not.to.be.undefined
    expect(app.services.subscriber.identity).to.be.an('function')
  })

  it('should return a message queue Consumer', () => {
    const target = app.services.subscriber.identity()

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

    it('should call app.services.identity.check with message.id', async () => {
      const fakeService = sinon.replace(app.services.identity, 'verify', sinon.fake())

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeService).to.have.been.calledOnce
      expect(fakeService).to.have.been.calledWith(blueprints.signers.signer_1.id)
    })

    it('should update signer with INVALID if the request was invalid', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.requestInvalid))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)
      expect(result.rows[0].verification_status_face).to.equal('INVALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('INVALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('INVALID', 'verification_status_address')
    })

    it('should update signer with PENDING if the request was pending', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.requestPending))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)
      expect(result.rows[0].verification_status_face).to.equal('PENDING', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('PENDING', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('PENDING', 'verification_status_address')
    })

    it('should update signer with INVALID if declined without a reason', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationDeclinedNoReason))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('INVALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('INVALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('INVALID', 'verification_status_address')
    })

    it('should update signer with PENDING if the response does not have result', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve({ ...mocks.verificationDeclinedNoReason, event: 'request.timeout' }))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('PENDING', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('PENDING', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('PENDING', 'verification_status_address')
    })

    it('should consider face INVALID if face cant be found', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationDeclinedFaceOnDocument))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('INVALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('VALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('VALID', 'verification_status_address')
    })

    it('should consider all VALID if request accepted', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationAccepted))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('VALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('VALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('VALID', 'verification_status_address')
    })

    it('should fail document if type is INVALID', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationDeclinedDocumentType))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('VALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('INVALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('VALID', 'verification_status_address')
    })

    it('should fail document if document is INVALID', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationDeclinedDocument))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('VALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('INVALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('INVALID', 'verification_status_address')
    })

    it('should fail document if document is expired', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationDeclinedDocumentExpired))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('VALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('INVALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('VALID', 'verification_status_address')
    })

    it('should fail face if face does not match', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationDeclinedFace))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

      expect(result.rows[0].verification_status_face).to.equal('INVALID', 'verification_status_face')
      expect(result.rows[0].verification_status_document).to.equal('INVALID', 'verification_status_document')
      expect(result.rows[0].verification_status_address).to.equal('VALID', 'verification_status_address')
    })

    it('should only run once even if called twice', async () => {
      const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationDeclinedFace))
      const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
      sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

      const target = app.services.subscriber.identity()

      // first call, will run
      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      // seccond call, will be skipped
      await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

      expect(fakeShufti).to.have.been.calledOnce
    })

    describe('when signer document type is PASSPORT', () => {
      beforeEach(async () => {
        await knex.raw(`
          UPDATE signers
          SET document_type='PASSPORT', document_issuer='USA', back_id_proof_document_id=null
          where id='${blueprints.signers.signer_1.id}'`
        )
      })

      it('should consider all VALID if request accepted', async () => {
        const fakeShuftiFn = sinon.fake.returns(Promise.resolve(mocks.verificationAccepted))
        const fakeShufti = sinon.replace(app.plugins.shufti, 'getUserVerification', fakeShuftiFn)
        sinon.replace(app.plugins.aws, 'getContent', () => Promise.resolve('ABC'))

        const target = app.services.subscriber.identity()

        await target.handleMessage(message({ id: blueprints.signers.signer_1.id }))

        expect(fakeShufti).to.have.been.calledOnce

        const result = await knex.raw(`SELECT * FROM signers WHERE id='${blueprints.signers.signer_1.id}'`)

        expect(result.rows[0].verification_status_face).to.equal('VALID', 'verification_status_face')
        expect(result.rows[0].verification_status_document).to.equal('VALID', 'verification_status_document')
        expect(result.rows[0].verification_status_address).to.equal('VALID', 'verification_status_address')
      })
    })
  })
})
