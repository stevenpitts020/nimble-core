exports.up = function (knex) {
  const sql = `
    ALTER TABLE signers RENAME COLUMN front_drivers_license_uri TO front_id_proof_document_uri;
    ALTER TABLE signers RENAME COLUMN back_drivers_license_uri TO back_id_proof_document_uri;
    ALTER TABLE signers RENAME COLUMN front_drivers_license_document_id TO front_id_proof_document_id;
    ALTER TABLE signers RENAME COLUMN back_drivers_license_document_id TO back_id_proof_document_id;
    ALTER TABLE signers RENAME COLUMN document_issued_state TO document_issuer;
  `
  return knex.schema.raw(sql);
}

exports.down = function (knex) {
}
