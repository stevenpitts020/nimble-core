const fs = require('fs')
const YAML = require('yamljs')
const _ = require('lodash')
_.mixin(require('lodash-inflection'))

const Bookshelf = require('../../app/plugins/bookshelf')
const knex = Bookshelf.knex

const seedsDirectory = `${__dirname}/data`

function insert(table, data, pk = 'id') {
  return knex(table)
    .returning(pk)
    .insert(data)
    .then(ids => _.first(ids))
    .catch(() => {
      // ignore insert errors and rely on tests beforeEach for consistency
      // use `console.debug(err.detail)` to figure out missing seed data
      return Promise.resolve()
    })
}

function getEntity(data, pk, id) {
  const entity = data.find(e => _.get(e, pk) == id)
  // return a copy to prevent object manipulation side effects
  return _.cloneDeep(entity)
}

function create(data, table, pk, entities) {
  // if is not defined create all collection
  if (!entities) {
    entities = data
  }

  // if is not a object means is called with id
  if (!_.isObject(entities)) {
    entities = getEntity(data, pk, entities)
  }

  if (!_.isArray(entities)) {
    entities = new Array(entities)
  }

  return insertAll(table, pk, entities)
}

function updateSequence(table, pk) {
  const sequenceName = `${table}_${pk}_seq`
  const sql = 'SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema=? AND sequence_name=?'
  return knex
    .raw(sql, ['public', sequenceName])
    .then(r => parseInt(_.first(r.rows).count, 10) || 0)
    .then(count => {
      if (count == 0) {
        return Promise.resolve()
      }

      // reset sequences
      const sql = `SELECT setval('${sequenceName}', max(${pk})) FROM ${table};`
      return knex.raw(sql)
    })
}

async function insertAll(table, pk, data) {
  for (const row of data) {
    await insert(table, row, pk)
  }
  return await updateSequence(table, pk)
}

/**
 * This function will dynamicly load all seeds place in the data seeds folder
 * and expose functions to provision them in the test system when executed.
 */
function loadSeedFiles() {
  // the following tables are silenced from returning knex errors due to lack of a field named `id`
  const primaryKeys = {
    product_account_numbers: null,
    account_request_products: 'account_request_id',
    account_request_product_options: 'account_request_id',
    docusign_templates: null
  }

  return fs.readdirSync(seedsDirectory).reduce((memo, filename) => {
    if (filename === '.keep') {
      return memo
    }
    const data = YAML.load(`${seedsDirectory}/${filename}`)
    const table = filename.replace('.yaml', '').replace('.yml', '')
    const pk = _.get(primaryKeys, table, 'id')

    const entityName = _.singularize(_.camelCase(`${table}`))
    memo[entityName] = {
      get: _.partial(getEntity, data, pk),
      create: _.partial(create, data, table, pk)
    }
    memo[table] = _.partial(insertAll, table, pk, data)
    return memo
  }, {})
}

const seeds = loadSeedFiles()

seeds.flush = async function flush() {
  return await knex.raw(`
    DELETE FROM account_recoveries CASCADE;
    DELETE FROM signers CASCADE;

    DELETE FROM signer_credit_reports CASCADE;
    DELETE FROM signer_compliance_verification_list_entries CASCADE;
    DELETE FROM signer_compliance_verification_items CASCADE;
    DELETE FROM signer_compliance_verifications CASCADE;
    DELETE FROM signers_identity_verifications CASCADE;
    DELETE FROM signer_email_verifications CASCADE;
    DELETE FROM bsa_risk_results;
    DELETE FROM account_requests CASCADE;
    DELETE FROM account_request_products CASCADE;
    DELETE FROM account_request_product_options CASCADE;
    DELETE FROM accounts CASCADE;
    DELETE FROM users CASCADE;
    DELETE FROM institution_branches CASCADE;
    DELETE FROM institutions CASCADE;
    DELETE FROM documents CASCADE;
    DELETE FROM products CASCADE;
    DELETE FROM product_options  CASCADE;
    DELETE FROM product_account_numbers;
    DELETE FROM docusign_templates;
  `)
}

module.exports = seeds
