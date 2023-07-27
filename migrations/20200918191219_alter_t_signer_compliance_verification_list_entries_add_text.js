
exports.up = function (knex) {
  return knex.schema.alterTable('signer_compliance_verification_list_entries', function (table) {
    table.dropColumn('name')
    table.dropColumn('value')
    table.dropColumn('source')
    table.dropColumn('url')
  }).then(() => knex.schema.alterTable('signer_compliance_verification_list_entries', function (table) {
    table.text('name').notNullable()
    table.text('value').notNullable()
    table.text('source')
    table.text('url')
  }))
};

exports.down = function (knex) {
  return knex.schema.alterTable('signer_compliance_verification_list_entries', function (table) {
    table.dropColumn('name')
    table.dropColumn('value')
    table.dropColumn('source')
    table.dropColumn('url')
  }).then(() => knex.schema.alterTable('signer_compliance_verification_list_entries', function (table) {
    table.string('name').notNullable()
    table.string('value').notNullable()
    table.string('source')
    table.string('url')
  }))
};
