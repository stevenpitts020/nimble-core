const _ = require('lodash')
const app = require('../../../core')

const service = app.services.account

function magic_link(req, res, next) {
  return service
    .magicLink(req.body)
    .then(uri => res.status(200).json({
      type: 'MAGIC_LINK',
      token: 'magic-link',
      message: process.env.NODE_ENV === 'local'
        ? uri // running in local dev mode, send back the URI
        : `Login-link sent to [${_.get(req.body, 'email')}].`})
    ).catch(next)
}

module.exports = magic_link
