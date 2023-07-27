
exports.up = function(knex, Promise) {
  const updateRAWSQL = "UPDATE signers SET document_issued_state='IA' where document_issued_state IS NULL;"


  return knex.schema.alterTable('signers', function (table) {
    table.enu('document_issued_state', [ "AL", "AK", "AS", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FM", "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MH", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "MP", "OH", "OK", "OR", "PW", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VI", "VA", "WA", "WV", "WI", "WY" ], { useNative: false, enumName: 'signers_document_issued_state' })
  }).then(() => knex.raw(updateRAWSQL))
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('signers', function (table) {
    table.dropColumn('document_issued_state')
  })
};
