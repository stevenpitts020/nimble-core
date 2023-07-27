const savingsProductOptions = [
  {
    key: 'atm_only_card',
    category: 'product_feature',
    title: 'ATM Only Card',
    value: false,
    annotation: 'Free',
  },
  {
    key: 'e_statements',
    category: 'product_feature',
    title: 'E-Statements',
    value: true,
    lead: 'Get your bank statements directly on your email',
    annotation: 'Free',
  },
  {
    key: 'paper_statements',
    category: 'product_feature',
    title: 'Paper Statements',
    value: false,
    annotation: '$3/statement',
  }
]

const checkingProductOptions = [
  {
    key: 'debit_card',
    category: 'product_feature',
    title: 'Debit Card',
    value: true,
    lead: 'Shazam®Chek Card',
    annotation: 'Free',
  },
  {
    key: 'e_statements',
    category: 'product_feature',
    title: 'E-Statements',
    value: true,
    lead: 'Get your bank statements directly on your email',
    annotation: 'Free',
  },
  {
    key: 'paper_statements',
    category: 'product_feature',
    title: 'Paper Statements',
    value: false,
    annotation: '$3/statement',
  },
  {
    key: 'checks',
    category: 'product_feature',
    title: 'Checks',
    annotation: 'Can be ordered thru online banking',
  }
]

const mobileAndOnlineBanking = {
  key: 'mobile_and_online_banking',
  category: 'product_feature',
  title: 'Mobile & Online Banking',
  value: true,
  annotation: 'Free',
}
const mobileAndOnlineBankingChilds = [
  {
    key: 'bill_pay',
    category: 'product_feature',
    title: 'Bill Pay',
    value: true,
    annotation: 'Free',
  },
  {
    key: 'mobile_deposits',
    category: 'product_feature',
    title: 'Mobile Deposits',
    value: true,
    annotation: 'Free',
  }
]

exports.up = async (knex)  => {
  // Get all products
  const products = await knex('products').select()
  await Promise.all(products.map(async (product) => {
    if (product.category === 'SAVINGS') {
      // Insert savings options
      await Promise.all(savingsProductOptions.map(async (savingOption) => {
        savingOption.product_id = product.id,
        await knex('product_options').insert(Object.assign({}, savingOption))
      }))
    } else if (product.category === 'CHECKING') {
      // Insert checking product options
      await Promise.all(checkingProductOptions.map(async (checkingOption) => {
        checkingOption.product_id = product.id,
        await knex('product_options').insert(Object.assign({}, checkingOption))
      }))
    }
    // Insert parent product option mobile and online banking
    mobileAndOnlineBanking.product_id = product.id
    let poId =  await knex('product_options').insert(mobileAndOnlineBanking, 'id')
    // Insert mobile and online banking product option childs
    await Promise.all(mobileAndOnlineBankingChilds.map(async (child) => {
      child.product_id = product.id
      child.parent_id = poId.toString()
      await knex('product_options').insert(Object.assign({}, child))
    }))
  }))

  return
}

exports.down = function(knex) {
}
