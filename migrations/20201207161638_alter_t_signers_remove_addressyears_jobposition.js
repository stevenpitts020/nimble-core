exports.up = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.dropColumn('address_years')
    table.dropColumn('job_position')
  })
};
exports.down = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.integer('address_years').default(null)
    table.string('job_position')
  })
};