
exports.up = knex => knex.schema.alterTable('institutions', table => table.jsonb('workbook').default('{}'))

exports.down = knex => knex.schema.alterTable('institutions', table => table.dropColumn('workbook'))
