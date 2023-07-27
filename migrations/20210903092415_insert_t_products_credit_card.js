
const newProducts = [
  {
    name: 'Visa® Classic Credit Card',
    category: 'CARD',
    summary: 'When you have a Visa® Classic Card, <INSTITUTION NAME> goes where you go.',
    content:
      `**Card features**

- Add convenience, control and security to your financial life:
- No fees for ATM cash advances
- Zero liability for unauthorized purchases
- Local service in person or by phone
- Emergency cash and card replacement
- Up to $5 late fee
- 1% foreign transaction fee
- No balance transfer fee

**There’s more**

The <INSTITUTION NAME> CardManager allows you anytime access to easily manage your Central Bank credit card.

- View and download statements
- Make payments
- Add travel notes
- Activate your card
- Select or change your PIN
- Change the address associated with your card
- View and redeem rewards points
- Contact the bank via a secure email portal

Credit Card Options
We give you options for credit cards that line up perfectly with the way you live. <INSTITUTION NAME> Visa can provide you with cash advances from your credit line at all banks and ATMs that recognize these cards worldwide.`
  },
  {
    name: 'Platinum Rewards Visa® Credit Card',
    category: 'CARD',
    summary: 'With the Platinum Rewards Visa, you’ll be rewarded for purchases made, wherever those may be.',
    content:
      `**Card features**

- Add convenience, control and security to your financial life:
- No fees for ATM cash advances
- Zero liability for unauthorized purchases
- Local service in person or by phone
- Emergency cash and card replacement
- Up to $5 late fee
- 1% foreign transaction fee
- No balance transfer fee

**There’s more**

The <INSTITUTION NAME> CardManager allows you anytime access to easily manage your Central Bank credit card.

- View and download statements
- Make payments
- Add travel notes
- Activate your card
- Select or change your PIN
- Change the address associated with your card
- View and redeem rewards points
- Contact the bank via a secure email portal

Credit Card Options
We give you options for credit cards that line up perfectly with the way you live. <INSTITUTION NAME> Visa can provide you with cash advances from your credit line at all banks and ATMs that recognize these cards worldwide.`
  }
]
exports.up = async function(knex) {
  // Get all institutions
  const institutions = await knex('institutions').select()
  institutions.map(async (institution) => {
    if (institution.name === 'Central Bank' || institution.name === 'Nimble Bank') {
      // Insert new products
      return await newProducts.map(async (newProduct) => {
        newProduct.institution_id = institution.id
        newProduct.summary = newProduct.summary.replace(/<INSTITUTION NAME>/g, institution.name)
        newProduct.content = newProduct.content.replace(/<INSTITUTION NAME>/g, institution.name)
        return await knex('products').insert(Object.assign({}, newProduct))
      })
    }
  })

  return
};

exports.down = function(knex, Promise) {
};
