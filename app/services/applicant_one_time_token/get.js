const Joi = require('@hapi/joi')
const app = require('../../core')
const ApplicantOneTimeToken = app.repositories.applicantOneTimeToken
const applicantOneTimeTokenModel = app.models.applicantOneTimeToken

const schema = Joi.object().keys({ id: Joi.string().uuid() })

async function get(id, tx = app.db) {
  const filterData = await app.plugins.validator({id}, schema, { abortEarly: false })

  const model = await ApplicantOneTimeToken.forge(filterData)
    .fetch({
      withRelated: [],
      transacting: tx
    })
    .then(async m => !m ? null : m)

  return new applicantOneTimeTokenModel(model).data()
}

module.exports = get
