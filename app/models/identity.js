//const _ = require('lodash')
const BaseModel = require('./model')

class IdentityModel extends BaseModel {
  constructor(data) {
    super(IdentityModel.props(), IdentityModel.relations(), data)
  }

  static props() {
    return [
      'firstName', 'middleName', 'lastName', 'address', 'city',
      'state', 'zipCode', 'dateOfBirth', 'documentNumber',
      'documentExpirationDate', 'documentIssuedDate', 'documentIssuer'
    ]
  }
}

module.exports = IdentityModel
