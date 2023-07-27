const institutionBranches = [
  { name: 'Storm Lake Main', external_id: '1' },
  { name: 'Storm Lake North', external_id: '2' },
  { name: 'Storm Lake 5th', external_id: '5' },
  { name: 'Storm Lake Plaza', external_id: '6' },
  { name: 'Cherokee', external_id: '30' },
  { name: 'Cherokee North', external_id: '31' },
  { name: 'Sioux Empire - 33rd & Minnesota', external_id: '40' },
  { name: 'Sioux Empire - W 12th', external_id: '41' },
  { name: 'Sioux Empire - Western', external_id: '42' },
  { name: 'Brookings', external_id: '47' },
  { name: 'Sioux City Downtown', external_id: '50' },
  { name: 'Sioux City Hamilton', external_id: '51' },
  { name: 'Sioux City Morningside', external_id: '52' },
  { name: 'Dakota Dunes', external_id: '53' },
  { name: 'Spirit Lake', external_id: '60' },
  { name: 'Westown', external_id: '70' },
  { name: 'Ankeny', external_id: '71' },
  { name: 'Mills Civic', external_id: '73' },
  { name: 'Urbandale - 100th', external_id: '74' },
  { name: 'Drake', external_id: '75' },
  { name: 'Waukee', external_id: '78' },
  { name: 'Urbandale - 86th', external_id: '80' },
  { name: 'Ingersoll', external_id: '81' },
  { name: 'Highland Park', external_id: '82' }
]

exports.up = async (knex)  => {
  // Get all institutions
  const institutions = await knex('institutions').select()
  await Promise.all(institutions.map(async (institution) => {
    // Insert institution branches
    await Promise.all(institutionBranches.map(async (institutionBranch) => {
      institutionBranch.institution_id = institution.id,
      await knex('institution_branches').insert(Object.assign({}, institutionBranch))
    }))
  }))

  return
}

exports.down = function(knex) {
  const sql = `DELETE FROM institution_branches WHERE true`
  return knex.schema.raw(sql);
}
