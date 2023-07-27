const Joi = require('@hapi/joi')
const app = require('../../core')
const BadRequestError = require('../../errors/bad_request')
const User = app.repositories.user
const UserModel = app.models.user

const schema = Joi.object().keys({ id: Joi.string().uuid() })

async function findOneByExample(example, tx = app.db) {
  if (!example && !example.id) throw new BadRequestError('IdRequired')

  app.plugins.validator({ id: example.id }, schema, { abortEarly: false })

  const model = await User.forge(example).fetch({
    withRelated: ['accounts', 'institution', 'branch'],
    transacting: tx
  }).then(async m => !m ? null : m)

  return new UserModel(model).data()
}

module.exports = findOneByExample
