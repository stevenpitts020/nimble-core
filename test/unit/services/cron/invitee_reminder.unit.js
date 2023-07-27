const sinon = require('sinon')
const moment = require('moment')

describe('app.services.cron.inviteeReminder', () => {
  let clock = null
  const baseDate = new Date('2019-01-01T01:00:00.001Z')
  let inviteReminderSpy, prospectPendingSignersSpy = null

  before(() => {
    inviteReminderSpy = sinon.spy(app.services.email, 'inviteReminder')
    prospectPendingSignersSpy = sinon.spy(app.services.email, 'prospectPendingSigners')
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
      expect(app.services.cron.inviteeReminder).not.to.be.undefined
    })

    it('should be a function', () => {
      expect(app.services.cron.inviteeReminder).to.be.an('Function')
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
      await knex('account_requests').update('status', 'INCOMPLETE').where('id', '00000000-0000-AAAA-AAAA-000000000111')
    })

    it('should return true', async () => {
      let result = await app.services.cron.inviteeReminder()
      expect(result).to.equal(true)
    })

    describe('when runing every hour', () => {
      it('should NOT SEND reminders when running 23 hours after', async () => {
        const now = moment(baseDate).add(23, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder()
        expect(inviteReminderSpy).to.not.have.been.called
        expect(prospectPendingSignersSpy).to.not.have.been.called
      })

      it('should SEND reminders when running 24 hours after', async () => {
        const now = moment(baseDate).add(24, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder()
        expect(inviteReminderSpy).to.have.been.called
        expect(prospectPendingSignersSpy).to.have.been.called
      })

      it('should NOT SEND reminders when running 25 hours after', async () => {
        const now = moment(baseDate).add(25, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder()
        expect(inviteReminderSpy).to.not.have.been.called
        expect(prospectPendingSignersSpy).to.not.have.been.called
      })
    })

    it('should send a reminder for each pending signer', async () => {
      const now = moment(baseDate).add(24, 'hour').toDate()
      sinon.useFakeTimers(now)
      await app.services.cron.inviteeReminder()
      expect(prospectPendingSignersSpy).to.have.been.calledOnce
      expect(inviteReminderSpy).to.have.been.calledTwice
      // status=completed
      expect(prospectPendingSignersSpy).to.have.been.calledWith('ffffffff-0000-473e-a5cb-1ea08a01e701')
      expect(inviteReminderSpy).to.not.have.been.calledWith('ffffffff-0000-473e-a5cb-1ea08a01e701')
      // status=invited
      expect(inviteReminderSpy).to.have.been.calledWith('ffffffff-0000-473e-a5cb-1ea08a01e801')
      expect(inviteReminderSpy).to.have.been.calledWith('ffffffff-0000-473e-a5cb-1ea08a01e901')
    })

    describe('Reminds after 7 days when runing every hour', () => {
      const days = 7
      const hours = days * 24
      it('should NOT SEND reminders when running 167 hours after', async () => {
        const now = moment(baseDate).add(hours - 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder(days)
        expect(inviteReminderSpy).to.not.have.been.called
        expect(prospectPendingSignersSpy).to.not.have.been.called
      })

      it('should SEND reminders when running 168 hours after', async () => {
        const now = moment(baseDate).add(hours, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder(days)
        expect(inviteReminderSpy).to.have.been.called
        expect(prospectPendingSignersSpy).to.have.been.called
      })

      it('should NOT SEND reminders when running 169 hours after', async () => {
        const now = moment(baseDate).add(hours + 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder(days)
        expect(inviteReminderSpy).to.not.have.been.called
        expect(prospectPendingSignersSpy).to.not.have.been.called
      })
    })

    describe('Reminds after 3 days when runing every hour', () => {
      const days = 3
      const hours = days * 24
      it('should NOT SEND reminders when running 71 hours after', async () => {
        const now = moment(baseDate).add(hours - 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder(days)
        expect(inviteReminderSpy).to.not.have.been.called
        expect(prospectPendingSignersSpy).to.not.have.been.called
      })

      it('should SEND reminders when running 72 hours after', async () => {
        const now = moment(baseDate).add(hours, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder(days)
        expect(inviteReminderSpy).to.have.been.called
        expect(prospectPendingSignersSpy).to.have.been.called
      })

      it('should NOT SEND reminders when running 73 hours after', async () => {
        const now = moment(baseDate).add(hours + 1, 'hour').toDate()
        sinon.useFakeTimers(now)
        await app.services.cron.inviteeReminder(days)
        expect(inviteReminderSpy).to.not.have.been.called
        expect(prospectPendingSignersSpy).to.not.have.been.called
      })
    })
  })
})
