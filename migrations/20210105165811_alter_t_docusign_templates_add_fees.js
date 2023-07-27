const config = require('../config')

function getServiceFeeTemplateId (api_environment) {
  // as of right now, demo and dev are the same
  if (api_environment === 'prod' || api_environment === 'demo') {
    return '37758a29-aaeb-43b7-a1dc-d230fa0bab79'
  } else {
    return 'c2b862c6-7827-46a1-bdcd-fea345785daa'
  }
};

exports.up = async function (knex) {
  const docusignTemplateID = getServiceFeeTemplateId(config.get('api_environment'))
  // get all institutions
  const result = await knex.raw("select id from institutions;")

  let sql = []
  result.rows.map((row) => {
    const insertSQL = `INSERT INTO docusign_templates (institution_id, name, template_id, version) VALUES ('${row.id}', 'Fees', '${docusignTemplateID}', 1);`
    sql.push(insertSQL)
  })

  // run all inserts
  return await knex.schema.raw(sql.join('\n')).toSQL()
};

exports.down = function (knex) {
  const sql = `DELETE FROM docusign_templates t WHERE t.name = 'Fees'`
  return knex.schema.raw(sql);
};
