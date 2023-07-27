const glob = require('glob')
const _ = require('lodash')

const config = require('../config')
const logger = require('./plugins/logger.js')
const bookshelf = require('./plugins/bookshelf')

const nimbleData = require('./plugins/nimble_data')
const validator = require('./plugins/validator')
const microblink = require('./plugins/microblink')
const shufti = require('./plugins/shufti')
const pagination = require('./plugins/pagination')
const jwt = require('./plugins/jwt')
const dateFilter = require('./plugins/date_filter')
const emailNormalizer = require('./plugins/email_normalizer')
const random = require('./plugins/random')
const email = require('./plugins/email')
const sms = require('./plugins/sms')
const docusign = require('./plugins/docusign')
const image = require('./plugins/image')
const aws = require('./plugins/aws')
const xml = require('./plugins/xml')
const { uuid } = require('uuidv4')
const hash = require('./plugins/hash')
const codec = require('./plugins/codec')
const mfaVerify = require('./plugins/mfa_verify')
const phoneNormalizer = require('./plugins/phone_normalizer')

// const http = require('http')
const express = require('express')

const ENVS = {
  dev: 'dev',
  development: 'dev',
  prod: 'prod',
  production: 'prod',
  staging: 'staging',
  stg: 'staging'
}

function env(env) {
  return !env ? ENVS.prod : ENVS[env] || ENVS.prod
}

// singleton class holding the app core
class AppCore {
  constructor() {
    this.controllers = {}
    this.models = {}
    this.repositories = {}
    this.middlewares = {}
    this.services = {}

    // normalize env
    config.set('env', env(config.get('env')))

    //config stuff
    this.config = config
    this.port = config.get('port')
    this.env = config.get('env')

    //server stuff
    this.db = bookshelf
    this.plugins = {
      nimbleData,
      validator,
      pagination,
      jwt,
      dateFilter,
      emailNormalizer,
      random,
      email,
      sms,
      microblink,
      shufti,
      docusign,
      image,
      aws,
      xml,
      uuid,
      hash,
      codec,
      mfaVerify,
      phoneNormalizer
    }
    this.logger = logger

    this.server = express()
    this.router = express.Router()
  }

  //lifts the server using express().listen
  start() {
    this.server.set('trust proxy', true)
    this.server.listen(config.get('port'))

    this.logger.getLogger('app.core').info(
      { port: this.port, env: this.env },
      `[start] started on port ${this.port}`
    )
    return this
  }

  // calls express.router.use() with the result of the middleware factory
  route(path, factory) {
    this.logger.getLogger('app.core').debug('[route] + adding route: ', path, '=>', factory.name || 'fn()')
    return this.router.use(path, factory())
  }

  // calls express.use() with the result of the middleware factory
  middleware(factory) {
    this.logger.getLogger('app.core').debug('[middleware] + adding middleware: ', factory.name || 'fn()')
    const fn = factory()

    if (_.isFunction(fn)) {
      return this.server.use(fn)
    }

    return this.server
  }

  async load() {
    this.logger.getLogger('app.core').info('[load] autoloading start')
    this.repositories = await this.loadObjFromPath('repositories', 1)
    this.serializers = await this.loadObjFromPath('serializers', 2)
    this.models = await this.loadObjFromPath('models', 1)
    this.services = await this.loadObjFromPath('services', 2)
    this.middlewares = await this.loadObjFromPath('middlewares', 1)
    this.controllers = await this.loadObjFromPath('controllers', 3)

    return this
  }

  loadRoutes() {
    return new Promise((accept, reject) => {
      //fetch route files for each version
      glob('app/controllers/*/routes.js', (err, files) => {
        if (err) return reject(err)
        files.forEach(file => {
          this.logger.getLogger('app.core').debug('[loadRoutes] + loading routes: ', file)
          require('../' + file)(this.router) // call the route decorator
        })
        accept(true)
      })
    }).then(() => {
      //mount routes
      this.server.use('/', this.router)
      return Promise.resolve(true)
    })
  }

  /**
   * converts a directory structure into a js object tree with *.js files as its leaves
   * note: will camelize snake_case names. (foo_bar.js will become fooBar in the tree)
   *
   * loading the folder:
   *    + controllers/
   *    |- + v1/
   *       |- + example/
   *          |- filea.js
   *          |- fileb.js
   *          |- foo_bar.js
   *
   * is the same as creating the following object:
   * {
   *  controllers: {
   *      v1: {
   *        example: {
   *            filea: require('controllers/v1/example/filea.js')
   *            fileb: require('controllers/v1/example/fileb.js')
   *            fooBar: require('controllers/v1/example/foo_bar.js')
   *         }
   *      }
   *    }
   * }
   *
   *
   * @param {string} folder folder inside ./app/
   * @param {int} depth how many folders deep are the files
   */
  loadObjFromPath(folder, depth) {
    const logger = this.logger.getLogger('app.core')
    return new Promise((accept, reject) => {
      // fetch .js files inside `folder/*/*/*.../*.js`.
      // depth:int is how many folders deep we want to look.
      let pattern = [...new Array(depth)].map(() => '*').join('/') + '.js'
      let base = `app/${folder}/`
      logger.debug('[loadObjFromPath] + searching:', base + pattern)
      glob(base + pattern, (err, files) => {
        if (err) return reject(err)
        const result = files.reduce((tree, path) => {
          // merges all files found in a stuct
          logger.debug('[loadObjFromPath] loading: ', path)
          const file = require('../' + path) // include the actual controller module
          const obj = path
            .split('/')
            .slice(2)
            .map(s => _.camelCase(s.replace('.js', '')))
            .join('.') // generate a string path for the controller based on its location
          return _.set(tree, obj, file) // appends each filename to the tree using `folder.folder.file` paths
        }, {})
        accept(result) //returns the complete object tree
      })
    })
  }
}

module.exports = new AppCore()
