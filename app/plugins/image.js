const _ = require('lodash')
const config = require('../../config')

class ImageFactory {
  constructor(assetsUrl, cdnUrl) {
    this.assetsLocation = assetsUrl
    this.cdnLocation = cdnUrl
  }

  asset(uri) {
    return new AssetImage(this.assetsLocation, uri)
  }

  cdn(uri) {
    return new CDNImage(this.cdnLocation, uri)
  }
}

class AssetImage {
  constructor(location, uri) {
    this.location = location
    this.uri = uri

    return {
      default: this.__generateUrl(this.uri)
    }
  }

  __generateUrl(uri) {
    return [this.location, uri].join('/')
  }
}

class CDNImage {
  constructor(location, uri) {
    this.location = location
    this.uri = uri

    return {
      // uplaod bucket images return full URL for now
      // TODO: take care of auth and private bucket access here
      default: uri
    }
  }
}

const s3 = _.trim(config.get('aws.s3_endpoint'))
const up = _.trim(config.get('aws.s3_upload_bucket'))
const ass = _.trim(config.get('aws.s3_asset_bucket'))
const up_cdn = _.trim(config.get('image.uploads_cdn'))
const ass_cdn = _.trim(config.get('image.assets_cdn'))

module.exports = new ImageFactory(
  ass_cdn
    ? `${config.get('protocol')}://${ass_cdn}` // use the cdn for assets (if set), otherwise delegate to the assets s3 bucket
    : (s3.startsWith('http') ? (s3.endsWith('/') ? s3 : s3 + '/') + ass : `${config.get('protocol')}://${ass}.${s3}`),
  up_cdn
    ? `${config.get('protocol')}://${up_cdn}` // use the cdn for uploads (if set), otherwise delegate to the upload s3 bucket
    : s3.startsWith('http') ? (s3.endsWith('/') ? s3 : s3 + '/') + up : `${config.get('protocol')}://${up}.${s3}`
)
