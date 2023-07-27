
exports.up = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    const enumValues = ['VALID', 'INVALID', 'PENDING'];
    const enumMatchValues = ['MATCH', 'NOMATCH', 'PENDING'];
    const enumOps = { useNative: false, enumName: 'signers_verification_status_type' };

    table.enu('verification_status_face', enumValues, enumOps)
      .defaultTo('PENDING')
      .notNullable()
    table.timestamp('verification_status_face_updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())

    table.enu('verification_status_document', enumValues, enumOps)
      .defaultTo('PENDING')
      .notNullable()
    table.timestamp('verification_status_document_updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())

    table.enu('verification_status_address', enumValues, enumOps)
      .defaultTo('PENDING')
      .notNullable()
    table.timestamp('verification_status_address_updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())

    table.enu('verification_status_sanctions', enumMatchValues, enumOps)
      .defaultTo('PENDING')
      .notNullable()
    table.timestamp('verification_status_sanctions_updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())

    table.enu('verification_status_media', enumMatchValues, enumOps)
      .defaultTo('PENDING')
      .notNullable()
    table.timestamp('verification_status_media_updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())

    table.enu('verification_status_political_exposure', enumMatchValues, enumOps)
      .defaultTo('PENDING')
      .notNullable()
    table.timestamp('verification_status_political_exposure_updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())
  })
};
exports.down = function (knex) {
  return knex.schema.alterTable('signers', function (table) {
    table.dropColumn('verification_status_face')
    table.dropColumn('verification_status_face_updated_at')
    table.dropColumn('verification_status_document')
    table.dropColumn('verification_status_document_updated_at')
    table.dropColumn('verification_status_address')
    table.dropColumn('verification_status_address_updated_at')
    table.dropColumn('verification_status_sanctions')
    table.dropColumn('verification_status_sanctions_updated_at')
    table.dropColumn('verification_status_media')
    table.dropColumn('verification_status_media_updated_at')
    table.dropColumn('verification_status_political_exposure')
    table.dropColumn('verification_status_political_exposure_updated_at')
  })
};