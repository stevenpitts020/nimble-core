
exports.up = function(knex) {
  return knex.schema.alterTable('users', table => table.jsonb('roles').default('["employee"]'))
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => table.dropColumn('roles'))
};
