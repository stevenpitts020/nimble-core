const app = require('../app/core')
const logger = app.logger.getLogger('scripts.test_email_templates')

logger.info('[worker] starting worker to test email templates on env: %s', process.env.NODE_ENV)

// boot app
app.load().then(async () => {

  const emailTestData = {
    welcomeEmail: {
      statusEmailSubject: "statusEmailSubject",
      firstName: "firstName",
      lastName: "lastName",
      uri: "uri",
      institution: 'institution',
      institutionUrl: 'institutionUrl',
    },

    AccountRequestApproved: {
      statusEmailSubject: "statusEmailSubject",
      statusEmailBody: "statusEmailBody"
    },

    AccountRequestDeclined: {
      statusEmailSubject: "statusEmailSubject",
      statusEmailBody: "statusEmailBody"
    },

    inviteeSignupEmail: {
      inviteeName: 'inviteeName',
      invitedByFirstName: 'invitedByFirstName',
      invitedByFullName: 'invitedByFullName',
      accountType: 'accountType',
      inviteeRole: 'inviteeRole',
      institution: 'institution',
      institutionUrl: 'institutionUrl',
      url: 'url',
      statusEmailSubject: 'statusEmailSubject'
    },

    inviteeSignupReminderEmail: {
      inviteeName: 'inviteeName',
      invitedByFirstName: 'invitedByFirstName',
      invitedByFullName: 'invitedByFullName',
      accountType: 'accountType',
      inviteeRole: 'inviteeRole',
      institution: 'institution',
      institutionUrl: 'institutionUrl',
      url: 'url',
      statusEmailSubject: 'statusEmailSubject'
    },

    passwordResetEmail: {
      statusEmailSubject: 'statusEmailSubject',
      firstName: 'firstName',
      lastName: 'lastName',
      uri: 'uri',
      institution: 'institution',
      institutionUrl: 'institutionUrl',
    },

    magicLinkEmail: {
      statusEmailSubject: 'statusEmailSubject',
      firstName: 'firstName',
      lastName: 'lastName',
      uri: 'uri',
      institution: 'institution',
      institutionUrl: 'institutionUrl'
    },

    prospectPendingSignersEmail: {
      prospectFirstName: 'prospectFirstName',
      accountType: 'accountType',
      statusEmailSubject: 'statusEmailSubject',
      institution: 'institution',
      institutionUrl: 'institutionUrl',
    },

    signerEmailVerificationEmail: {
      signerEmail: "signerEmail",
      signerFirstName: "signerFirstName",
      verifyUrl: "verifyUrl",
      institution: "institution",
      institutionUrl: "institutionUrl",
      statusEmailSubject: "statusEmailSubject",
    },

  }

  for (const emailTemplate in emailTestData) {
    logger.info(`[load] testing template ${emailTemplate} with data ${JSON.stringify(emailTestData[emailTemplate])}`)

    try {
      await app.plugins.aws.testRenderTemplate(emailTemplate, emailTestData[emailTemplate])
      logger.info(`[load] [${emailTemplate}]:`, 'OK!')
    } catch (err) {
      logger.error(err, `[load] [${emailTemplate}]:`)
    }

  }

}).catch(err => {
  // exit on error
  logger.error(err, 'Ending worker with error')
  process.exit(0) // eslint-disable-line no-process-exit
}).then(() => {
  // exit on done
  logger.info('[load] ending worker')
  process.exit(0) // eslint-disable-line no-process-exit
})
