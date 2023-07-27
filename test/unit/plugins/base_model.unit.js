const Joi = require('@hapi/joi')
const BaseModel = require('../../../app/models/model')

describe('BaseModel class', () => {
  it('should exist', () => {
    expect(BaseModel).not.to.be.undefined
  })

  it('should be an extendable class', () => {
    expect(BaseModel).to.be.an('Function')
    class A extends BaseModel {}
    expect(A.prototype).to.be.an.instanceOf(BaseModel)
  })

  it('should have static Props', () => {
    expect(BaseModel.data).to.be.undefined //not static
    expect(BaseModel.props).to.be.an('Function')
    expect(BaseModel.relations).to.be.an('Function')
    expect(BaseModel.schema).to.be.an('Function')
  })

  it('should have defaults', () => {
    expect(BaseModel.props()).to.deep.equal([])
    expect(BaseModel.relations()).to.deep.equal([])
    expect(BaseModel.schema().describe()).to.deep.equal(Joi.object().keys({}).describe())
  })

  it('should have Props', () => {
    let model = new BaseModel([], [], {})

    expect(model._data).to.be.an('object')
    expect(model.props).to.be.an('array')
    expect(model.relations).to.be.undefined // static
    expect(model.schema).to.be.undefined // static
  })

  it('should throw if data is empty', () => {
    let fn = () => new BaseModel([], [], null)
    expect(fn).to.throw("The requested resource couldn't be found")
  })

  it('should import data based on prop() keys', () => {
    let data = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    }
    let model = new BaseModel(['a', 'b', 'd'], [], data)
    expect(model.data().a).to.equal(1)
    expect(model.data().b).to.equal(2)
    expect(model.data().c).to.be.undefined
    expect(model.data().d).to.equal(4)
  })

  it('should import sub data based on relations() keys', () => {
    let data = {
      a: 1,
      b: 2,
      c: {
        z: 11,
        y: 22
      },
      d: 4
    }
    let model = new BaseModel(['a', 'b', 'd'], ['c', 'notthere'], data)

    expect(model.data().a).to.equal(1)
    expect(model.data().b).to.equal(2)
    expect(model.data().c).to.deep.equal({ z: 11, y: 22 })
    expect(model.data().notthere).to.be.undefined
    expect(model.data().d).to.equal(4)
  })

  it('should call data.toJSON if possible', () => {
    let data = {
      a: 1,
      toJSON: () => {
        return { b: 2 }
      }
    }
    let model = new BaseModel(['a', 'b'], [], data)
    expect(model.data().a).to.be.undefined
    expect(model.data().b).to.equal(2)
  })
})
