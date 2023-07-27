const app = require('../core')

const ApplicantOneTimeToken = app.db.Model.extend({
  tableName: 'applicant_one_time_token',
  requireFetch: false,
  hasTimestamps: true
})

module.exports = app.db.model('ApplicantOneTimeTokenModel', ApplicantOneTimeToken)
