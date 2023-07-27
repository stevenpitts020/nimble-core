const Joi = require('@hapi/joi')
const app = require('../../core')
const User = app.repositories.user
const UserModel = app.models.user

const schema = Joi.object().keys({ id: Joi.string().uuid() })

async function get(id, tx = app.db, institutionId = null) {
  app.plugins.validator({id}, schema, { abortEarly: false })

  const filter = institutionId ? { id, institutionId } : { id }

  const model = await User.forge(filter)
    .fetch({
      withRelated: ['accounts', 'institution', 'branch'],
      transacting: tx
    })
    .then(async m => !m ? null : m)

  return new UserModel(model).data()
}

module.exports = get
