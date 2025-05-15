const axios = require('axios');
const cron = require('node-cron');
const dotenv = require('dotenv');

dotenv.config();

const BASE_ACCESS_TOKEN = process.env.BASE_ACCESS_TOKEN;
const BASE_SHOP_DOMAIN = process.env.BASE_SHOP_DOMAIN;

const MY_STORE_NAME = process.env.MY_STORE_NAME;

console.log('BASE_ACCESS_TOKEN', BASE_ACCESS_TOKEN);
console.log('BASE_SHOP_DOMAIN', BASE_SHOP_DOMAIN);
console.log('MY_STORE_NAME', MY_STORE_NAME);

const retrieveFromBaseStore = async () => {
  let hasNextPage = true;
  let endCursor = null;
  let productCount = 0;

  while (hasNextPage) {
    const after = endCursor ? `, after: \"${endCursor}\"` : '';
    const query = `
      {
        products(first: 10) {
          edges {
            cursor
            node {
              title
              description
              tags
              variants(first: 5) {
                edges {
                  node {
                    title
                    sku
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    console.log('query', query);

    try {
      const response = await axios.post(
        `https://${BASE_SHOP_DOMAIN}/admin/api/2024-01/graphql.json`,
        { query },
        {
          headers: {
            'X-Shopify-Access-Token': BASE_ACCESS_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      const products = response.data.data.products.edges;
      products.forEach((product, index) => {
        const p = product.node;
        productCount++;
        console.log(`\n#${productCount} Product: ${p.title}`);
        console.log(`Description: ${p.description}`);
        console.log(`Tags: ${Array.isArray(p.tags) ? p.tags.join(', ') : p.tags}`);

        p.variants.edges.forEach((variant, vIndex) => {
          const v = variant.node;
          console.log(`  - Variant #${vIndex + 1}: ${v.title}, SKU: ${v.sku}`);
        });
      });

      hasNextPage = response.data.data.products.pageInfo.hasNextPage;
      endCursor = response.data.data.products.pageInfo.endCursor;
    } catch (err) {
      console.error('Error fetching products:', err.response?.data || err.message);
      break;
    }
  }
}

const main = async () => {
  await retrieveFromBaseStore();
}

main();
// cron.schedule('0 0 * * *', async () => {
//   await main();
// });
