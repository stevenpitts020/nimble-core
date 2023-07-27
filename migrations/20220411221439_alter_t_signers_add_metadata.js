exports.up = function(knex) {
  return knex.schema.alterTable('signers', table => table.jsonb('remote_metadata').default('{}'))
}

exports.down = function(knex) {
  return knex.schema.alterTable('signers', table => table.dropColumn('remote_metadata'))
}
