exports.up = knex => knex.schema.alterTable('institutions', table => table.jsonb('questions').default('{}'))

exports.down = knex => knex.schema.alterTable('institutions', table => table.dropColumn('questions'))
