
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('users', table => table.index('status', 'idx_status'))
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', table => table.dropIndex('idx_status'))
};
