const sinon = require('sinon')
const moment = require('moment')

describe('app.services.cron.emailVerificationReminder', () => {
  let clock = null
  const baseDate = new Date('2019-01-01T01:00:00.001Z')
  let emailVerificationEmailSpy

  before(() => {
    emailVerificationEmailSpy = sinon.spy(app.services.email, 'emailVerification')
  })

  beforeEach(() => {
    clock = sinon.useFakeTimers(baseDate)
    sinon.reset()
  })

  afterEach(() => {
    sinon.reset()
  })

  after(() => {
    clock.restore()
    sinon.restore()
  })

  describe('service method', () => {
    it('should exist', () => {
      expect(app.services.cron.emailVerificationReminder).not.to.be.undefined
    })

    it('should be a function', () => {
      expect(app.services.cron.emailVerificationReminder).to.be.an('Function')
    })
  })

  describe('running the service', () => {
    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
      await seed.document.create()

      await seed.accountRequest.create('00000000-0000-AAAA-AAAA-000000000111')
      await seed.signer.create('ffffffff-0000-473e-a5cb-1ea08a01e701')
      await seed.signer.create('ffffffff-0000-473e-a5cb-1ea08a01e801')
      await seed.signer.create('ffffffff-0000-473e-a5cb-1ea08a01e901')

      await seed.signerEmailVerification.create('FF000000-0000-0000-1111-1ea08a01e801')
      await seed.signerEmailVerification.create('FF000000-0000-0000-2222-1ea08a01e901')
      await seed.signerEmailVerification.create('FF000000-0000-0000-3333-1ea08a01e901')
      await seed.signerEmailVerification.create('FF000000-0000-0000-4444-1ea08a01e901')

      await knex('signers').update('email_verified', false).where('id', 'ffffffff-0000-473e-a5cb-1ea08a01e801')
      await knex('signers').update('email_verified', false).where('id', 'ffffffff-0000-473e-a5cb-1ea08a01e901')

    })

    it('should return true', async () => {
      let result = await app.services.cron.emailVerificationReminder()
      expect(result).to.equal(true)
    })

    describe('when runing every hour', () => {
      it('should NOT SEND reminders when running 23 hours after', async () => {
        const now = moment(baseDate).add(23, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder()
        expect(emailVerificationEmailSpy).to.not.have.been.called
      })

      it('should SEND reminders when running 24 hours after', async () => {
        const now = moment(baseDate).add(24, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder()
        expect(emailVerificationEmailSpy).to.have.been.called
      })

      it('should NOT SEND reminders when running 25 hours after', async () => {
        const now = moment(baseDate).add(25, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder()
        expect(emailVerificationEmailSpy).to.not.have.been.called
      })
    })

    it('should send a reminder for unverified signers', async () => {
      const now = moment(baseDate).add(24, 'hour').toDate()
      sinon.useFakeTimers(now)
      await app.services.cron.emailVerificationReminder()
      expect(emailVerificationEmailSpy).to.have.been.calledTwice

      expect(emailVerificationEmailSpy).to.have.been.calledWith('ff000000-0000-0000-1111-1ea08a01e801', sinon.match.any)
      expect(emailVerificationEmailSpy).to.have.been.calledWith('ff000000-0000-0000-4444-1ea08a01e901', sinon.match.any)
    })

    describe('Reminds after 7 days when runing every hour', () => {
      const days = 7
      const hours = days * 24
      it('should NOT SEND reminders when running 167 hours after', async () => {
        const now = moment(baseDate).add(hours - 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder(days)
        expect(emailVerificationEmailSpy).to.not.have.been.called
      })

      it('should SEND reminders when running 168 hours after', async () => {
        const now = moment(baseDate).add(hours, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder(days)
        expect(emailVerificationEmailSpy).to.have.been.called
      })

      it('should NOT SEND reminders when running 169 hours after', async () => {
        const now = moment(baseDate).add(hours + 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder(days)
        expect(emailVerificationEmailSpy).to.not.have.been.called
      })
    })

    describe('Reminds after 3 days when runing every hour', () => {
      const days = 3
      const hours = days * 24
      it('should NOT SEND reminders when running 71 hours after', async () => {
        const now = moment(baseDate).add(hours - 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder(days)
        expect(emailVerificationEmailSpy).to.not.have.been.called
      })

      it('should SEND reminders when running 72 hours after', async () => {
        const now = moment(baseDate).add(hours, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder(days)
        expect(emailVerificationEmailSpy).to.have.been.called
      })

      it('should NOT SEND reminders when running 73 hours after', async () => {
        const now = moment(baseDate).add(hours + 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.emailVerificationReminder(days)
        expect(emailVerificationEmailSpy).to.not.have.been.called
      })
    })
  })
})
