const BadRequestError = require('../errors/bad_request')

const JSON_CONTENT_TYPE = 'application/json'

function contentTypeSupport(req, res, next) {
  const isContentTypeSpecified = req.get('Content-Type') === undefined
  const isJsonContentType = req.get('Content-Type') === JSON_CONTENT_TYPE
  const isEmptyObjectBody =
    isContentTypeSpecified && Object.keys(req.body || {}).length === 0
  const isPostOrPut = /^POST|PUT$/.test(req.method)
  req.headers['content-type'] = req.get('Content-Type') || JSON_CONTENT_TYPE

  // skip content check if dealing with docusign webhooks webhooks/docusign/connect
  if (req.url.includes('webhooks/docusign/connect')) {
    return next()
  }

  // binary uploads can be form-data
  if (isPostOrPut && req.url.includes('files')) return next()

  if (isPostOrPut && !(isJsonContentType || isEmptyObjectBody)) {
    return next(new BadRequestError('Content-type not supported!'))
  }

  next()
}

module.exports = function contentTypeSupportMiddleware() {
  return contentTypeSupport
}
