const formatAlterTableEnumSql = (
  tableName,
  columnName,
  enums,
  oldConstraintName
) => {
  const constraintName = `${tableName}_${columnName}_check`;
  return [
    `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${oldConstraintName};`,
    `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraintName};`,
    `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} CHECK (${columnName} = ANY (ARRAY['${enums.join(
      "'::text, '"
    )}'::text]));`,
  ].join('\n');
};

// Note: enums are done with check constraints currently and .alter() doesn't have any special treatment for them...
// Only solution found was to manually remove and add constraint
exports.up = function (knex, Promise) {
  return knex.schema.raw(
    formatAlterTableEnumSql('account_requests', 'status', [
      'INCOMPLETE', 'PENDING', 'SIGNED', 'APPROVED', 'DECLINED',
    ], 'account_request_status_type')
  );
};

exports.down = function (knex, Promise) {
  return knex.schema.raw(
    formatAlterTableEnumSql('account_requests', 'status', [
      'PENDING', 'DECLINED', 'APPROVED'
    ], 'account_request_status_type')
  );
};
