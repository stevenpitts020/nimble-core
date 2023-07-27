
exports.up = function(knex) {
  return knex.schema.alterTable('institutions', table => table.jsonb('public_metadata').default('{}'))
};

exports.down = function(knex) {
  return knex.schema.alterTable('institutions', table => table.dropColumn('public_metadata'))
};
