const Joi = require('@hapi/joi')
const _ = require('lodash')

const app = require('../../core')
const ApplicantOneTimeToken = app.repositories.applicantOneTimeToken
const validator = app.plugins.validator

const whitelist = ['id']
const schema = Joi.object().keys({
  id: Joi.string().uuid().required()
})

async function validate(data) {
  return validator(_.pick(data, whitelist), schema, { abortEarly: false })
}

async function markAlreadyUsed(tokenData, tx = app.db) {
  try{
    const data = await validate(tokenData)

    const updatedData = {
      id: data.id,
      is_already_used: true
    }

    await ApplicantOneTimeToken.forge(updatedData).save(null, { method: 'update', transacting: tx})
  } catch (err){
    throw new Error(err)
  }
}

module.exports = markAlreadyUsed
