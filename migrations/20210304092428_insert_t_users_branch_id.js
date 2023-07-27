const _ = require('lodash')

const productionInstitutionId = '30a12701-2879-4a3f-8aa5-ae2f08118b8d'

const external_42 = ['lkading@centralbankonline.com']
const external_53 = ['jevans@centralbankonline.com']
const external_73 = [
  'bryan.johnson@centralbankonline.com',
  'cbruening@centralbankonline.com',
  'mbrown@centralbankonline.com',
  'rasman@centralbankonline.com'
]
const external_78 = [
  'mklein@centralbankonline.com',
  'meskra@centralbankonline.com',
  'jploeger@centralbankonline.com',
  'amcnulty@centralbankonline.com',
  'jottoson@centralbankonline.com'
]
const external_1 = [
  'areinert@centralbankonline.com',
  'smeyer@centralbankonline.com',
  'jhamer@centralbankonline.com',
  'jhernandez@centralbankonline.com'
]

exports.up = async (knex)  => {
  const sql = `
   UPDATE users
   set branch_id=(select id from institution_branches where external_id='73' and institution_id=users.institution_id);
   UPDATE users
   set branch_id=(select id from institution_branches where external_id='42' and institution_id='${productionInstitutionId}')
   where institution_id='30a12701-2879-4a3f-8aa5-ae2f08118b8d' and email in ('${external_42}');
   UPDATE users
   set branch_id=(select id from institution_branches where external_id='53' and institution_id='${productionInstitutionId}')
   where institution_id='30a12701-2879-4a3f-8aa5-ae2f08118b8d' and email in ('${external_53}');
   UPDATE users
   set branch_id=(select id from institution_branches where external_id='73' and institution_id='${productionInstitutionId}')
   where institution_id='30a12701-2879-4a3f-8aa5-ae2f08118b8d' and email in ('${external_73}');
   UPDATE users
   set branch_id=(select id from institution_branches where external_id='78' and institution_id='${productionInstitutionId}')
   where institution_id='30a12701-2879-4a3f-8aa5-ae2f08118b8d' and email in ('${external_78}');
   UPDATE users
   set branch_id=(select id from institution_branches where external_id='1' and institution_id='${productionInstitutionId}')
   where institution_id='30a12701-2879-4a3f-8aa5-ae2f08118b8d' and email in ('${external_1}');`

  return knex.schema.raw(sql);
}

exports.down = function(knex) {
}
