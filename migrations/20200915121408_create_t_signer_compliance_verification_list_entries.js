exports.up = function (knex, Promise) {
  return knex.schema.createTableIfNotExists('signer_compliance_verification_list_entries', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary()

    table.string('name').notNullable()
    table.string('value').notNullable()
    table.string('source')
    table.date('date')
    table.string('url')
    table.enu('type', ['ADVERSE-MEDIA', 'WARNING', 'SANCTION', 'POLITICAL'], {useNative:false, enumName:'item_type'})
      .defaultTo('ADVERSE-MEDIA').notNullable()

    table.string('country_codes')

    table
      .uuid('signer_compliance_verification_item_id')
      .references('signer_compliance_verification_items.id')
      .notNullable()
      .onDelete('CASCADE')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('signer_compliance_verification_list_entries')
}
