
exports.up = function(knex) {
  return knex.schema.alterTable('users', table => table.string('status').notNullable().default("ACTIVE"))
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('users', table => table.dropColumn('status'))
};
