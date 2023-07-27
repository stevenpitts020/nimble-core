const Joi = require('@hapi/joi')
const validator = require('../../../app/plugins/validator')
const BadRequestError = require('../../../app/errors/bad_request')

const schema = Joi.object().keys({
  id: Joi.string().uuid(),
  name: Joi.string(),
  category: Joi.string(),
})

describe('plugins/validator', () => {
  it('throws error with invalid data', () => {
    const data = { id: 1 }
    expect(() => validator(data, schema)).to.throw(BadRequestError)
  })

  it('throws error with not-allowed properties', () => {
    const data = { notInSchema: 'some value' }
    expect(() => validator(data, schema)).to.throw(BadRequestError)
  })

  it('returns data with valid data', () => {
    const data = {
      id: 'ffffffff-aaaa-bbbb-b000-999999999999',
      name: 'a name',
      category: 'testing',
    }
    let validData
    expect(() => {
      validData = validator(data, schema)
    }).not.to.throw(BadRequestError)
    expect(validData).to.deep.equal(data)
  })
})
