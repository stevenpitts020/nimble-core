const schema = {
  env: {
    doc: 'The application environment (dev, prod or test)',
    format: ['production', 'staging', 'development', 'test', 'local'],
    default: 'production',
    env: 'NODE_ENV'
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 8080,
    env: 'PORT'
  },
  protocol: {
    doc: 'The protocol of the API (self)',
    format: String,
    default: 'https',
    env: 'API_PROTOCOL'
  },
  domain: {
    doc: 'The host of the API (self)',
    format: String,
    default: 'localhost:8080',
    env: 'API_DOMAIN'
  },
  api_environment: {
    doc: 'The common environment slug',
    format: String,
    default: 'local',
    env: 'API_ENVIRONMENT'
  },
  logLevel: {
    // https://github.com/trentm/node-bunyan#levels
    doc: 'bunyan log level',
    format: Number,
    default: 20,
    env: 'LOG_LEVEL'
  },
  frontend: {
    backoffice_domain: {
      doc: 'The domain of the backoffice/crm web-app',
      format: String,
      default: 'localhost:3000',
      env: 'BACKOFFICE_DOMAIN'
    },
    onboarding_domain: {
      doc: 'The domain of the onboarding web-app',
      format: String,
      default: 'localhost:3001',
      env: 'ONBOARDING_DOMAIN'
    },
    recovery_password_uri: {
      doc: 'Backoffice password recovery endpoint',
      format: String,
      default: ':protocol://:backoffice_domain/auth/:email/recover-password/:code/:expiresAt',
      env: 'PASSWORD_RECOVERY_URI'
    },
    magic_link_uri: {
      doc: 'Backoffice magic-link endpoint',
      format: String,
      default: ':protocol://:backoffice_domain/login/:email/:token',
      env: 'MAGIC_LINK_URI'
    },
    welcome_uri: {
      doc: 'onboarding welcome http endpoint',
      format: String,
      default: ':protocol://:onboarding_domain/auth/:email/set-password/:code/:expiresAt',
      env: 'WELCOME_URI'
    },
    signerEmailVerificationURI: {
      doc: 'email verification http endpoint',
      format: String,
      default: ':protocol://:onboarding_domain/:domain/email-verification/:signer_id/:id?token=:token',
      env: 'SIGNER_EMAIL_VERIFICATION_URI'
    },
    inviteeOnboardingURI: {
      doc: 'onboarding for invitee signers http endpoint',
      format: String,
      default: ':protocol://:onboarding_domain/:domain/onboarding/:prospect_id/signers/:signer_id?name=:invitedBy&token=:token',
      env: 'INVITEE_ONBOARDING_URI'
    }
  },
  nimbleData: {
    endpoint: {
      doc: 'The NimbleData Endpoint',
      format: String,
      default: 'https://data-dev.nimblefi.com',
      env: 'NIMBLE_DATA_ENDPOINT'
    },
    apiKey: {
      doc: 'The NimbleData API Key',
      format: String,
      default: '',
      env: 'NIMBLE_DATA_API_KEY'
    },
    apiEndpoint: {
      doc: 'The NimbleData API Endpoint',
      format: String,
      default: 'https://api-data-dev.nimblefi.com',
      env: 'NIMBLE_DATA_API_ENDPOINT'
    }
  },
  auth: {
    adminApiKey: {
      doc: 'The API Key to be used by administrators',
      format: String,
      default: 'superpowers',
      env: 'ADMIN_API_KEY'
    },
    ttl: {
      doc: 'The ttl for JWT tokens in seconds',
      format: Number,
      default: 7200, // 2h
      env: 'JWT_EXPIRATION'
    },
    secret: {
      doc: 'The JWT secret key',
      format: String,
      default: '94Rmnaf@da$EBgEnfY6agYh=Bw9EGkQT6YHb6cFsk$j_YD$s+bEY43T43D[dQDZkA',
      env: 'JWT_SECRET'
    },
    maxFailedLoginAttempts: {
      doc: 'The max number of failed login attempts',
      format: Number,
      default: 5,
      env: 'MAX_FAILED_LOGIN_ATTEMPTS'
    }
  },
  aws: {
    key: {
      doc: 'the AWS access ID for the app',
      format: String,
      default: '',
      env: 'AWS_ACCESS_KEY_ID'
    },
    secret: {
      doc: 'the AWS access secret for the app',
      format: String,
      default: '',
      env: 'AWS_SECRET_ACCESS_KEY'
    },
    endpoint: {
      doc: 'the AWS SDK endpoint, null means aws-sdk default',
      format: String,
      default: '',
      env: 'AWS_ENDPOINT'
    },
    region: {
      doc: 'the AWS SDK region, null means aws-sdk default',
      format: String,
      default: 'us-east-2',
      env: 'AWS_DEFAULT_REGION'
    },
    s3_endpoint: {
      doc: 'the AWS SDK endpoint for s3 requests, null means aws-sdk default',
      format: String,
      default: 's3.us-east-2.amazonaws.com',
      env: 'AWS_S3_ENDPOINT'
    },
    s3_ftp_bucket: {
      doc: 's3 bucket for sftp access',
      format: String,
      default: 'local-ftp',
      env: 'AWS_S3_FTP_BUCKET'
    },
    s3_upload_bucket: {
      doc: 's3 bucket name where uploads are to be stored',
      format: String,
      default: 'local-uploads',
      env: 'AWS_S3_UPLOADS_BUCKET'
    },
    s3_asset_bucket: {
      doc: 's3 bucket name where assets are to be stored',
      format: String,
      default: 'nimble-core-assets',
      env: 'AWS_S3_ASSETS_BUCKET'
    },
    s3_signature_version: {
      doc: 's3 bucket access control presigned signature version',
      format: String,
      default: 'v4',
      env: 'AWS_S3_SIGNATURE_VERSION'
    },
    ses_endpoint: {
      doc: 'the AWS SDK endpoint for SES requests, null means aws-sdk default',
      format: String,
      default: 'email.us-east-2.amazonaws.com',
      env: 'AWS_SES_ENDPOINT'
    },
    ses_region: {
      doc: 'the AWS SDK region for SES requests, null means aws-sdk default',
      format: String,
      default: 'us-east-2',
      env: 'AWS_SES_REGION'
    },
    ses_email_from: {
      doc: 'the email set as From: field when using SES',
      format: String,
      default: 'no-reply@nimblefi.com',
      env: 'AWS_SES_EMAIL_FROM'
    },
    ses_email_version: {
      doc: 'the ses API version',
      format: String,
      default: 'latest',
      env: 'AWS_SES_EMAIL_VERSION'
    },
    sns_region: {
      doc: 'the AWS SNS region',
      format: String,
      default: 'us-east-2',
      env: 'AWS_SNS_REGION'
    },
    sns_version: {
      doc: 'the AWS SNS api-version',
      format: String,
      default: '2010-03-31',
      env: 'AWS_SNS_VERSION'
    },
    sms_sender_id: {
      doc: 'the AWS SNS->SMS Sender ID',
      format: String,
      default: 'NimbleFi',
      env: 'AWS_SMS_SENDER_ID'
    },
    sms_origination_numbers: {
      doc: 'the AWS SNS->SMS Origination Numbers',
      format: String,
      default: '+18335861528,+18335941169',
      env: 'AWS_SMS_ORIGINATION_NUMBER'
    },
    lambda_endpoint: {
      doc: 'the AWS SDK endpoint for lambda requests, null means aws-sdk default',
      format: String,
      default: '',
      env: 'AWS_LAMBDA_ENDPOINT'
    },
    lambda_region: {
      doc: 'the AWS SDK region for lambda requests, null means aws-sdk default',
      format: String,
      default: 'us-east-2',
      env: 'AWS_LAMBDA_REGION'
    }
  },
  sns: {
    endpoint: {
      doc: 'AWS SDK endpoint for SNS requests',
      format: String,
      default: '',
      env: 'AWS_SNS_ENDPOINT'
    },
    accessKeyId: {
      doc: 'AWS SNS Access Key Id',
      format: String,
      default: '',
      env: 'AWS_SNS_ACCESS_KEY'
    },
    secretAccessKey: {
      doc: 'AWS SNS Access Key Secret',
      format: String,
      default: '',
      env: 'AWS_SNS_SECRET_ACCESS_KEY'
    },
    region: {
      doc: 'AWS SNS Region',
      format: String,
      default: '',
      env: 'AWS_SNS_REGION'
    },
    topicSigner: {
      doc: 'AWS SDK endpoint for SNS requests for signers',
      format: String,
      default: '',
      env: 'AWS_SNS_SIGNER_TOPIC'
    },
    topicAccountRequest: {
      doc: 'AWS SDK endpoint for SNS requests for account requests',
      format: String,
      default: '',
      env: 'AWS_SNS_ACCOUNT_REQUEST_TOPIC'
    }
  },
  sqs: {
    endpoint: {
      doc: 'AWS SDK endpoint for SQS requests',
      format: String,
      default: '',
      env: 'AWS_SQS_ENDPOINT'
    },
    accessKeyId: {
      doc: 'AWS SQS Access Key Id',
      format: String,
      default: '',
      env: 'AWS_SQS_ACCESS_KEY'
    },
    secretAccessKey: {
      doc: 'AWS SQS Access Key Secret',
      format: String,
      default: '',
      env: 'AWS_SQS_SECRET_ACCESS_KEY'
    },
    region: {
      doc: 'AWS SQS Region',
      format: String,
      default: '',
      env: 'AWS_SQS_REGION'
    },
    creditReportQueue: {
      doc: 'AWS SDK SQS queue for credit report',
      format: String,
      default: '',
      env: 'AWS_SQS_CREDIT_REPORT_QUEUE'
    },
    complianceQueue: {
      doc: 'AWS SDK SQS queue for compliance checks',
      format: String,
      default: '',
      env: 'AWS_SQS_COMPLIANCE_QUEUE'
    },
    identityQueue: {
      doc: 'AWS SDK SQS queue for identity checks',
      format: String,
      default: '',
      env: 'AWS_SQS_IDENTITY_QUEUE'
    },
    accountRequestQueue: {
      doc: 'AWS SDK SQS queue for account request exports',
      format: String,
      default: '',
      env: 'AWS_SQS_ACCOUNT_REQUEST_QUEUE'
    }
  },
  image: {
    assets_cdn: {
      doc: 'the preferred domain for image asset readers; if unset, then aws.s3_asset_bucket will be preferred',
      format: String,
      default: 'cdn.nimblefi.com',
      env: 'ASSETS_CDN'
    },
    uploads_cdn: {
      doc: 'the preferred domain for public user uploads; if unset, then aws.s3_upload_bucket will be preferred',
      format: String,
      default: '',
      env: 'UPLOADS_CDN'
    },
    limit: {
      doc: 'size limit for image uploads',
      format: String,
      default: '8mb',
      env: 'IMG_LIMIT'
    },
    basePath: {
      doc: 'the path where uploaded images get saved',
      format: String,
      default: '/tmp/nimble/',
      env: 'IMG_BASE_PATH'
    }
  },
  database: {
    uri: {
      doc: 'The database connection string',
      format: '*',
      timezone: 'UTC',
      default: 'postgres://nimble-core-user:nimble-core-pass@localhost:5432/nimble-core-db',
      env: 'JDBC_URL'
    },
    migrations: {
      doc: 'The database migrations table name',
      format: '*',
      default: 'migrations'
    },
    debug: {
      doc: 'The database migrations table name',
      format: Boolean,
      default: false,
      env: 'KNEX_DEBUG'
    }
  },
  email: {
    from: {
      doc: 'The From: field on emails, must match sender signature from postmark',
      format: String,
      default: 'noreply@nimblefi.com',
      env: 'EMAIL_FROM'
    },
    apiKey: {
      doc: 'The postmark api key ',
      format: String,
      default: '6ffebcd8-b865-42b6-b55f-62731414fc28', // test server api key
      env: 'EMAIL_API_KEY'
    }
  },
  microblink: {
    secret: {
      doc: 'microblink secret ',
      format: String,
      default: 'none',
      env: 'MICROBLINK_SECRET'
    },
    baseUrl: {
      doc: 'microblink base url',
      format: String,
      default: 'https://api.microblink.com',
      env: 'MICROBLINK_BASE_URL'
    }
  },
  shufti: {
    secret: {
      doc: 'shufti secret ',
      format: String,
      default: 'NONE',
      env: 'SHUFTI_SECRET'
    },
    clientId: {
      doc: 'shufti client id ',
      format: String,
      default: 'NONE',
      env: 'SHUFTI_CLIENT_ID'
    },
    baseUrl: {
      doc: 'shufti base url',
      format: String,
      default: 'https://shuftipro.com',
      env: 'SHUFTI_BASE_URL'
    },
    webhook: {
      doc: 'shufti webhook url',
      format: String,
      default: ':protocol://:api_domain/api/v1/webhooks/shufti/identity-verification',
      env: 'SHUFTI_WEBHOOK_URL'
    }
  },
  docusign: {
    oauthPath: {
      doc: 'Docusign OAUTH URL',
      format: String,
      default: 'account-d.docusign.com',
      env: 'DOCUSIGN_BASE_OAUTH_PATH'
    },
    basePath: {
      doc: 'Docusign URL',
      format: String,
      default: 'https://demo.docusign.net/restapi',
      env: 'DOCUSIGN_BASE_PATH'
    },
    userID: {
      doc: 'User ID',
      format: String,
      default: 'NONE',
      env: 'DOCUSIGN_USER_ID'
    },
    clientID: {
      doc: 'Client ID',
      format: String,
      default: 'NONE',
      env: 'DOCUSIGN_CLIENT_ID'
    },
    accountID: {
      doc: 'Account ID',
      format: String,
      default: '8872016',
      env: 'DOCUSIGN_ACCOUNT_ID'
    },
    templateID: {
      doc: 'Template ID',
      format: String,
      default: 'NONE',
      env: 'DOCUSIGN_TEMPLATE_ID'
    },
    documentID: {
      doc: 'Document ID',
      format: String,
      default: '99672193',
      env: 'DOCUSIGN_DOCUMENT_ID'
    },
    privateKey: {
      doc: 'Private Key Filepath',
      format: String,
      default: 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBa0R4UUlCV3NyT2ZQMEh2V0FnMThFMEJHRnNpSEpMcDFnN0liRDNqeWxtajRrTlVtCnNXOFgxaWllRkVxcDI2c3lzSGFXSVluUU9zd3gwT2RSNFBKZ2NGdS90ZzBpc2JhSkRPdEdPaS9FWGZTNjd5dmMKRkxwa3YzenRnbUhlNlFkeDBWRjhGTXlUcGFaaWpxZm80b3FPZFNoaVpHOFhkRi9ob3VHeEh5Sk8rSGNwOTNMWQovY3V2eFRQeVBPOVJIWlZ1SmhPR3BmVzJTdXlsNU9oeDh6KzB0ckRFc0NFZ1pqSXVzU2QwSGZPdGJIeWFQSUVUCjExVXZ3MUsvODdQZkZpTmhEUkdBdDN3Sy9sOUJEc1JPZjFkNVNjTzBLWklhYTFSaG5EV3I5YUF5VEUzdVo2SisKV1NrcEt0TWNRdDBwVHppQnROV3FBdWdpbUNNTVNBTzFJMG9qbFFJREFRQUJBb0lCQUJSZXpFTW54SDRiOUJ2aAo3WERYUmpOeTA2TkNtV0dNeXUxNVVUeVBiSlZsQ0Z2dUdwdWJFTDhBZUFqdUhZeW1ZaytOUS9sREhTczhyUGx2CnZmN2F4RmVDQWJLY3FzNTE5T2VqNzhSbWZDRjMzNUhKUERrYU5RSGRTeTdya3grT20xckFXeG1WNWZGU2JSOXcKSStJZ3h1dFJjNG56TFprVU5JbjhQWGRqOFVyQ1ZVMWdRdVdmVWpRWjJLT3QwY1Qwb05xMlBDOTh3RjlGWUdhNAp5ak9KaGFtRWg0QzlCQ3ZGd3YvckkycVNXeHFwdFF6czRtaFlCcFRaMXZLWXZueWF6NnREVWMzenFOc2JjMndPCmhEaVhaaTJKeHJ3THVyenpCbDZZdmZHNkhEOGNCNmhsTC93SzBaUmlGYlU3bENFQ3Zyd2VMdjgvQTc5eTdzQXgKS2VncU9ORUNnWUVBeWQweTFnK1p6eTRhY2xTOWVWRzlFRE5YTzU3Y2ZtY3JwaEd2N0NTODQ0Q20rZy9LY3VNVwpnYmt4dVJhODJ4NFdQMklleUROMmo2djBTZU82L2VULzhFeHBvcnZ3Z1ljd3lXUWZ6bE5vZm1ud1Iwa09MQzQ1Cms0K3dKSWpMUXJwQ2pMdmQ0T2s2VzhYVlN6UStvUE0rVlhVUXVBclNDQUNJMjhNSDV2VUdTeVVDZ1lFQXR1cXUKdjVzakphWVJnYkMyZ2grWkQ5Mmt1VlppSDRCTkN4UlJFSmFBMlJRdDBPelFVb0g3bm0zWDYxZDhRTllBTVVCRQpDcTJIL0xyWXZPelk5MlJlRnUrK253dU5yQWdCdFZMeis4UjVRRWoyeGErNFNZVkQ3Sm5zS1YzTVFqcUx6bW1RCmw3dTFhK0xIRjRCYldxRmp3bHpGZ0lsanpicnpwdnYxZlZiM3c3RUNnWUVBdUpNOUxHWFBhWlRxTWFneUo0QUoKczRwK05OR3BJeHNLMmlwS0JVNENPTE1sK25mOTBOYTdlWm53VVNEdFJoMVlrbFFSZVZVMUQyRlhXVWlWYmhtNQp1K3JpbkIza1owdEozSnRrU2JBU1Y2UmVRNUFWR1dpYTFNWUpkUjV2WEhBYThidkZ3U1VBYTNHVStkS25nVnRvCm41TU8ybmxxV2s3QzFNNmJweDVieHRFQ2dZRUFvaXUvY3JFZ29DaDBMUDkzVURhamhhV0VmYTFRb1kwbXdVUHAKKzBMMFNZSFNmUUQ0VWE1Y1gwSVR4TnR6bGlnbFU0VWV6amk3OEIzWU91ZmlGTFF2bHpaSFVzcnplQ3BCR1huSwpSdFVTaXlRbFpXODlmREZpMzBvNFR4U1NHOFc4WGV6Si9UeTJ4RWZ6SzZycFU1ankwVWRlODI3YnhYS1N3dUZ2CjdRaEY4b0VDZ1lBcFVORDVvWTN0T0tWV2VtV1U3MEtNUWlIUHZNM1R3czhLeUpXbkcyaUZwZlNTWGw1MHFRN28KcGR0SVNmZzJjNlhoYk8rRTFEUnFDK1I0NnUrZStNZWIvZXNuTDhXbE02UDZ3cVR1R3VkeSs1dVJpS3RRSE9xRwpLQWU0N0packZHNlA5M2xLUDJxWk9IL1g0cm1raTNHSDRRa2VDSjVlZDFaTHByUlhRTmRHcnc9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=',
      env: 'DOCUSIGN_KEY'
    }
  },
  complyAdvantage: {
    secret: {
      doc: 'comply advantage secret ',
      format: String,
      default: 'none',
      env: 'COMPLY_ADVANTAGE_SECRET'
    },
    baseUrl: {
      doc: 'comply advantage base url',
      format: String,
      default: 'https://api.complyadvantage.com',
      env: 'COMPLY_ADVANTAGE_BASE_URL'
    }
  },
  cronInterval: {
    doc: 'The cron interval configuration in minutes',
    format: Number,
    default: 60,
    env: 'CRON_INTERVAL'
  },
  sentry: {
    dsn: {
      doc: 'Sentry DSN',
      format: String,
      default: 'https://132138ec31fe4e4bba07fb16c2317857@o435102.ingest.sentry.io/5493281',
      env: 'SENTRY_DSN'
    }
  },
  creditBureau: {
    username: {
      doc: 'username',
      format: String,
      default: 'company_01RFVNSWlmU3QwS1hnL2FoMnRGSS9hdz09w35b',
      env: 'CREDITBUREAU_USERNAME'
    },
    password: {
      doc: 'password',
      format: String,
      default: 'cde3f753c194c89ce8db391f3a12e5e42507ad611e2fdd',
      env: 'CREDITBUREAU_PASSWORD'
    },
    groupCode: {
      doc: 'groupCode',
      format: String,
      default: 'V3Sa6VyVJVFdGC9V',
      env: 'CREDITBUREAU_GROUPCODE'
    },
    baseUrl: {
      doc: 'credit bureau base url',
      format: String,
      default: 'https://secure.prequalsolutions.com/api.php',
      env: 'CREDITBUREAU_BASE_URL'
    },
    lenderId: {
      doc: 'lenderId of the user doing the requests',
      format: String,
      default: '1426',
      env: 'CREDITBUREAU_LENDERID'
    }
  },
  lambda: {
    pdfTransformARN: {
      doc: 'Lambda ARN for html to pdf service',
      format: String,
      default: 'dev-nimble-htmltopdf-lambda',
      env: 'LAMBDA_HTMLTOPDF_ARN'
    }
  },
  twilio: {
    accountSid: {
      doc: 'Twilio account SID',
      format: String,
      default: '',
      env: 'TWILIO_ACCOUNT_SID'
    },
    serviceSid: {
      doc: 'Twilio MFA service SID',
      format: String,
      default: '',
      env: 'TWILIO_SERVICE_SID'
    },
    messagingSvcSid: {
      doc: 'Twilio messaging service SID',
      format: String,
      default: '',
      env: 'TWILIO_MESSAGING_SERVICE_SID'
    },
    authToken: {
      doc: 'Twilio authentication token',
      format: String,
      default: '',
      env: 'TWILIO_AUTH_TOKEN'
    }
  }
}

module.exports = schema
