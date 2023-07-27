
exports.up = function (knex) {
  return knex.schema.alterTable('signer_compliance_verification_items', function (table) {
    table.dropColumn('name_aka')
    table.dropColumn('countries')
    table.dropColumn('associates')
    table.dropColumn('match_types')
  }).then(() => knex.schema.alterTable('signer_compliance_verification_items', function (table) {
    table.text('name_aka')
    table.text('countries')
    table.text('associates')
    table.text('match_types')
  }))
}

exports.down = function (knex) {
  return knex.schema.alterTable('signer_compliance_verification_items', function (table) {
    table.dropColumn('name_aka')
    table.dropColumn('countries')
    table.dropColumn('associates')
    table.dropColumn('match_types')
  }).then(() => knex.schema.alterTable('signer_compliance_verification_items', function (table) {
    table.string('name_aka')
    table.string('countries')
    table.string('associates')
    table.string('match_types')
  }))
};
