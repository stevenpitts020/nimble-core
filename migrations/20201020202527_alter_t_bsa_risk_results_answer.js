
exports.up = function (knex) {
  return knex.schema.alterTable('bsa_risk_results', function (table) {
    table.dropColumn('answer')
  }).then(() => knex.schema.alterTable('bsa_risk_results', function (table) {
    table.string('answer')
  }))
}

exports.down = function (knex) {
  return knex.schema.alterTable('bsa_risk_results', function (table) {
    table.dropColumn('answer')
  }).then(() => knex.schema.alterTable('bsa_risk_results', function (table) {
    table.string('answer')
  }))
}
