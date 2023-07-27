
exports.up = knex => knex.schema.alterTable('institutions', table => table.jsonb('agreements').default('{}'))

exports.down = knex => knex.schema.alterTable('institutions', table => table.dropColumn('agreements'))
