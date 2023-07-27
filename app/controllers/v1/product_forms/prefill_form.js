const app = require('../../../core')
const { validate } = require('../../../models/product_forms/uniform_residential_loan')
const service = app.services.productForms

async function prefillForm(req, res) {
  const productName = req.params.productName
  const data = service.get(productName)
  const [error, success] = validate(data);
  (success)
    ? res.status(201).json(data)
    : res.status(400).json(error.details)
}

module.exports = prefillForm
