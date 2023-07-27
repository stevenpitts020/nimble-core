const nock = require('nock')
const _ = require('lodash')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const request = require('supertest')
const moment = require('moment')
const config = require('../config')

const helpers = require('./support/helpers')
const blueprints = require('./support/blueprints')
const seeds = require('./support/seeds')

const Bookshelf = require('../app/plugins/bookshelf')
const knex = Bookshelf.knex

chai.config.includeStack = true
chai.use(chaiAsPromised)
chai.use(sinonChai)

const axios = require('axios')
axios.defaults.adapter = require('axios/lib/adapters/http')

global.sinon = sinon
global.expect = chai.expect
global.should = chai.should()
global.request = request
global.helpers = helpers
global.blueprints = blueprints
global.seed = seeds
global.knex = knex
global.moment = moment
global._ = _
global.config = config

nock.enable = helpers.enableNock
global.nock = nock
