const AWS = require('aws-sdk')
const _ = require('lodash')
const { uuid } = require('uuidv4')
const isBase64 = require('is-base64')
const logger = require('./logger').getLogger('app.plugins.aws')

const config = require('../../config')
const BadRequestError = require('../errors/bad_request')

class AWSFacade {
  constructor(AWSFacadeConfig) {
    // removes empty string/undefineds
    this.config = _.pickBy(AWSFacadeConfig, _.identity)
    this.config.s3 = _.pickBy(AWSFacadeConfig.s3, _.identity)
    this.config.ses = _.pickBy(AWSFacadeConfig.ses, _.identity)
    this.config.sns = _.pickBy(AWSFacadeConfig.sns, _.identity)
    this.config.sms = _.pickBy(AWSFacadeConfig.sms, _.identity)
    this.config.lambda = _.pickBy(AWSFacadeConfig.lambda, _.identity)

    this.uuid = uuid // exposing as public allows for test mocking

    // instance aws services
    this.s3 = new AWS.S3({
      ...this.config,
      s3ForcePathStyle: true,
      ...this.config.s3 // s3 service overwrites
    })

    this.ses = new AWS.SES({
      ...this.config,
      ...this.config.ses // ses service overwrites
    })

    this.lambda = new AWS.Lambda({
      ...this.config,
      ...this.config.lambda // lambda service overwrites
    })

    this.sns = new AWS.SNS({
      ...this.config,
      ...this.config.sns
    })

    this.sns.setSMSAttributes({
      DefaultSMSType: 'Transactional',
      DefaultSenderID: this.config.sms.senderId || 'NimbleFi'
    })
  }

  invokeLambda(params = {
    FunctionName: 'my-function',
    Payload: ''
  }) {
    return new Promise((accept, reject) => {
      this.lambda.invoke(params, function(err, response) {
        if (err) {
          logger.error(err, `[invokeLambda] error invoking for function ${params.FunctionName}`)
          return reject(err)
        }
        accept(response)
      })
    })
  }

  sanitizeEmailData(emailData) {
    if (!emailData) return emailData

    let data = _.clone(emailData)

    if (config.get('env') === 'prod') { // do production redactions
      if (data.uri) data.uri = 'REDACTED' // the URI may contain unmasked tokens
      if (data.token) data.token = 'REDACTED' // redact tokens
    }

    return data
  }

  sendEmailTemplate(template, emailTo, emailCc, emailData) {
    logger.info(this.sanitizeEmailData(emailData), `[sendEmailTemplate:START] sending: to=${emailTo} cc=${emailCc} from=${this.config.ses.from} template=${template}`)

    let params = {
      Destination: {
        ToAddresses: [emailTo],
        CcAddresses: [emailCc]
      },
      Source: this.config.ses.from,
      Template: template,
      TemplateData: JSON.stringify(emailData)
    }

    return new Promise((accept, reject) => {
      this.ses.sendTemplatedEmail(params, (err, response) => {
        if (err) {
          logger.error(this.sanitizeEmailData(emailData), `[sendEmailTemplate:ERROR] failed to=${emailTo} cc=${emailCc} from=${this.config.ses.from} template=${template}`)
          logger.error(err)
          return reject(err)
        }

        logger.info(this.sanitizeEmailData(emailData), `[sendEmailTemplate:DONE] sent:  to=${emailTo} cc=${emailCc} from=${this.config.ses.from} template=${template}`)
        accept(response)
      })
    })
  }

  sendSms(phone, message) {
    phone = phone.startsWith('+') ? phone : `+${phone}` // coerce phone with leading +

    logger.info({ phone, message }, `[sendSms:START] sending SMS message to=${phone}`)

    return new Promise((accept, reject) => {
      const publish = {
        Message: message,
        PhoneNumber: phone,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
          'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: this.config.sms.senderId || 'NimbleFi' },
          'AWS.MM.SMS.OriginationNumber': { DataType: 'String', StringValue: _.sample(this.config.sms.originationNumbers) }
        }
      }

      this.sns.publish(publish, (err, response) => {
        if (err) {
          logger.error({ publish, response }, `[sendSms:ERROR] failed to send SMS message to=${phone}`)
          logger.error(err)
          return reject(err)
        }

        logger.info({ publish, response }, `[sendSms:DONE] sent SMS to=${phone}`)
        accept(response)
      })
    })
  }

  /**
   * If you suspect that the email is not rendering due to errors in the html,
   * you can call this method instead of sendEmailTemplate that verifies
   * if the rendering is correct.
   * Note: make sure your development.js contains a valid AWS key and secret
   *
   * @param {string} emailTemplate - name of the template
   * @param {object} emailData - params required by the template
   */
  testRenderTemplate(emailTemplate, emailData) {
    let params = {
      TemplateName: [emailTemplate, config.get('api_environment')].join('-'),
      TemplateData: JSON.stringify(emailData)
    }

    return new Promise((accept, reject) => {
      this.ses.testRenderTemplate(params, (err, response) => {
        if (err) return reject(err)
        accept(response)
      })
    })
  }

  getExtension(img) {
    if (_.isObject(img)) {
      if (img.mimetype) return img.mimetype.substring(img.mimetype.lastIndexOf('/') + 1)
      const filename = img.name || img.filename || img.originalname
      if (filename) return filename.substring(filename.lastIndexOf('.') + 1)
      return null
    }

    return (firstCharacter => {
      switch (firstCharacter) {
        case 'i':
          return 'png'
        case '/':
          return 'jpg'
        case 'R':
          return 'gif'
        case 'U':
          return 'webp'
        default:
          throw new BadRequestError('image base64 must be png/jpg/gif/webp')
      }
    })(img.charAt(0))
  }

  getKey(folder = '', content, uuid, format = 'image') {
    const name = uuid || this.uuid()
    const ext = format === 'image' ? this.getExtension(content) : 'pdf'
    return `${folder}/${name}.${ext}`
  }

  s3SaveToFTP(key, doc, options = {}) {
    logger.debug(`[s3SaveToFTP] was called for key ${key}`)
    return new Promise((accept, reject) => {
      this.s3.putObject({
        Bucket: this.config.s3.ftp_bucket,
        Key: key.toLowerCase(),
        Body: doc,
        ...options
      }, (err) => {
        if (err) {
          logger.error(err, `[s3SaveToFTP] error for key ${key}`)
          return reject(err)
        }
        logger.debug(`[s3SaveToFTP] finished for key ${key}`)
        accept(`${this.config.cdn}/${key}`)
      })
    })
  }

  s3CopyToFTP(source, destination) {
    logger.debug(`[s3CopyToFTP] was called for source ${source} and destination ${destination}`)
    return new Promise((accept, reject) => {
      this.s3.copyObject({
        Bucket: this.config.s3.ftp_bucket,
        CopySource: `/${this.config.s3.upload_bucket}/${source}`,
        Key: destination
      }, (err) => {
        if (err) {
          logger.error(err, `[s3CopyToFTP] error for source ${source} and destination ${destination}`)
          return reject(err)
        }
        logger.debug(`[s3CopyToFTP] finished for source ${source} and destination ${destination}`)
        accept(`${this.config.cdn}/${destination}`)
      })
    })
  }

  putFile(file, directory = '', acl = 'authenticated-read') {
    const ctx = { op: 'putFile', file: isBase64(file) ? '[base64:bytes]' : _.omit(file, ['buffer']), directory, acl }

    logger.info({ phase: 'start', ...ctx })

    return new Promise((accept, reject) => {
      const Body = isBase64(file) ? Buffer.from(file, 'base64') : file.buffer

      if (!Buffer.isBuffer(Body)) return reject(new Error('required: `file.image: Buffer` or `file: string[base64-bytes]`'))

      const ext = this.getExtension(file)

      const Key = `${directory || _.toString(Math.floor(Math.random() * 10))}/${uuid()}${ext ? '.' + ext : ''}`

      const ACL = acl || 'authenticated-read'

      const s3Req = {
        Key,
        ACL,
        Body,
        Bucket: this.config.s3.upload_bucket
      }

      ctx['s3Req'] = _.omit(s3Req, ['Body'])

      logger.info({ phase: 's3.putObject:request', ...ctx })

      this.s3.putObject(s3Req, (err, s3Res) => {
        if (err) {
          logger.error(err, { ...ctx, phase: 's3.putObject:error' })
          return reject(err)
        }

        logger.info({ ...ctx, phase: 's3.putObject:success', s3Res })

        accept(_.merge(_.mapKeys(_.omit(s3Req, ['Body']), (v, k) => _.toLower(k)), s3Res.VersionId ? { version: s3Res.VersionId } : {}))
      })
    })
  }

  deleteFile(file) {
    const ctx = { op: 'deleteFile', file }

    logger.info({ ...ctx, phase: 'start' })

    const s3Req = _.merge({
      Key: file.key,
      Bucket: file.bucket || this.config.s3.upload_bucket
    }, file.version ? { VersionId: file.version } : {})

    ctx['s3Req'] = s3Req

    logger.info({ phase: 's3.deleteObject:request', ...ctx })

    return new Promise((accept, reject) => {
      this.s3.deleteObject(s3Req, (err, s3Res) => {
        if (err) {
          logger.error(err, { ...ctx, phase: 's3.deleteObject:error' })
          return reject(err)
        }

        logger.info({ ...ctx, phase: 's3.deleteObject:success', s3Res })

        accept({ success: true })
      })
    })
  }

  s3ImgUpload(img, folder = '', uuid, acl) {
    logger.debug(`[s3ImgUpload] was called with uuid ${uuid} and acl ${acl}`)
    const name = uuid || this.uuid()
    const ext = this.getExtension(img)
    return this.s3Upload(folder, name, ext, _.isObject(img) && img.buffer && Buffer.isBuffer(img.buffer) ? img.buffer : Buffer.from(img, 'base64'), acl)
  }

  s3Upload(folder = '', name, ext, doc, acl, options = {}) {
    logger.debug(`[s3Upload] was called with name ${name} and acl ${acl} ${this.config.s3.upload_bucket}/${folder}/${name}.${ext}`)
    return new Promise((accept, reject) => {
      const Key = `${folder}/${name}${name.includes('.') ? '' : '.' + ext}`

      this.s3.putObject({
        Bucket: this.config.s3.upload_bucket,
        Key,
        Body: doc,
        ...(acl ? { ACL: acl } : {}), // optional non-default ACL
        ...options
      }, (err) => {
        if (err) {
          logger.error(err, `[s3Upload] error for name ${name} and acl ${acl}`)
          return reject(err)
        }
        logger.debug(`[s3Upload] finished for name ${name} and acl ${acl}`)
        accept(`${this.config.cdn}/${Key}`)
      })
    })
  }

  s3PresignedUrl(id) {
    logger.debug(`[s3PresignedUrl] was called with id ${id}`)
    return new Promise((accept, reject) => {
      const params = {
        Bucket: this.config.s3.upload_bucket,
        Key: id,
        Expires: this.config.s3.PresignedUrlExpires
      }
      this.s3.getSignedUrl('getObject', params, (err, result) => {
        if (err) {
          logger.error(err, `[s3PresignedUrl] error for id ${id}`)
          return reject(err)
        }

        logger.debug(`[s3PresignedUrl] finished for id ${id}`)
        accept(result)
      })
    })
  }

  async getContent(id) {
    logger.debug(`[getContent] was called with id ${id}`)
    const params = {
      Bucket: this.config.s3.upload_bucket,
      Key: id
    }
    const response = await this.s3.getObject(params).promise()
    logger.debug(`[getContent] finished for id ${id}`)
    return response.Body.toString('base64')
  }
}

const s3 = _.trim(config.get('aws.s3_endpoint'))
const up = _.trim(config.get('aws.s3_upload_bucket'))
const up_cdn = _.trim(config.get('image.uploads_cdn'))

const awsConfigVars = {
  credentials: {
    accessKeyId: config.get('aws.key'),
    secretAccessKey: config.get('aws.secret')
  },
  endpoint: config.get('aws.endpoint'),
  cdn: up_cdn ? `${config.get('protocol')}://${up_cdn}` : s3.startsWith('http') ? (s3.endsWith('/') ? s3 : s3 + '/') + up : `${config.get('protocol')}://${up}.${s3}`,
  s3: {
    ftp_bucket: config.get('aws.s3_ftp_bucket'),
    upload_bucket: up,
    endpoint: s3,
    signatureVersion: config.get('aws.s3_signature_version') || 'v4',
    PresignedUrlExpires: 60
  },
  ses: {
    endpoint: config.get('aws.ses_endpoint'),
    region: config.get('aws.ses_region') || config.get('aws.region'),
    from: config.get('aws.ses_email_from'),
    version: config.get('aws.ses_email_version') || 'latest'
  },
  lambda: {
    endpoint: config.get('aws.lambda_endpoint'),
    region: config.get('aws.lambda_region') || config.get('aws.region')
  },
  sns: {
    region: config.get('aws.sns_region') || config.get('aws.region'),
    apiVersion: config.get('aws.sns_version') || '2010-03-31'
  },
  sms: {
    senderId: config.get('aws.sms_sender_id') || 'NimbleFi',
    originationNumbers: (config.get('aws.sms_origination_numbers') || '').split(',')
  }
}

module.exports = new AWSFacade(awsConfigVars)
