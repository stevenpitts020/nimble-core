
const newProducts = [
  {
    name: 'Mortgage Loan',
    category: 'LOAN',
    summary: 'At <INSTITUTION NAME>, we have always tried to simplify your decision by providing experienced assistance, discussing your options and suggesting a mortgage loan that is suited to your needs.',
    content:
`**Mortgage Loans** gives you the tools to finance your home.

What loan option works for you? Well, we offer a variety of financing options – and we’ll be happy to walk you through
every one of them. Ultimately, it comes down to working with you to find the loan that suits your present
situation – and your future needs.

- Conventional Loans (nongovernment loans)
- Jumbo Loans (large-dollar-amount loans)
- Rural Housing Service (RHS) Loans
- Federal Housing Administration (FHA) Loans
- Kentucky Housing Corporation (KHC) Loans
- Veterans Affairs (VA) Loans
- Affordable Housing Loans`
  }
]
exports.up = async function(knex) {
  // Get all institutions
  const institutions = await knex('institutions').select()
  institutions.map(async (institution) => {
    if (institution.name === 'Central Bank' || institution.name === 'Nimble Bank') {
      // Insert new products
      return newProducts.map(async (newProduct) => {
        newProduct.institution_id = institution.id
        newProduct.summary = newProduct.summary.replace(/<INSTITUTION NAME>/g, institution.name)
        return await knex('products').insert(Object.assign({}, newProduct))
      })
    }
  })

  return
};

exports.down = function(knex, Promise) {
};
