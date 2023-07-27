const Joi = require('@hapi/joi')
const app = require('../../core')
const ApplicationRepositories = app.repositories.application
const ApplicationModel = app.models.application

const schema = Joi.object().keys({ applicantId: Joi.string().uuid() })

async function list(param, tx = app.db) {
  if (param.applicantId === null){
    return Promise.reject("ApplicantId must be provided.")
  }

  const filterData = await app.plugins.validator({applicantId: param.applicantId}, schema, { abortEarly: false })

  const qb = ApplicationRepositories.query(q => {
    q.where('applicant_id', filterData.applicantId)
    q.where('status', 'PENDING')
  })

  const data = await qb.fetchAll({
    withRelated: [],
    transacting: tx
  })

  return data.models.map(application => new ApplicationModel(application).data())
}

module.exports = list
