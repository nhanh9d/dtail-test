const axios = require('axios');

const BASE_ACCESS_TOKEN = process.env.BASE_ACCESS_TOKEN;
const BASE_SHOP_DOMAIN = process.env.BASE_SHOP_DOMAIN;

const MY_STORE_NAME = process.env.MY_STORE_NAME;

const retrieveFromBaseStore = async () => {
  const query = `
    {
      products(first: 10) {
        edges {
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
      }
  }
  `;

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
      console.log(`\n#${index + 1} Product: ${p.title}`);
      console.log(`Description: ${p.description}`);
      console.log(`Tags: ${p.tags.join(', ')}`);

      p.variants.edges.forEach((variant, vIndex) => {
        const v = variant.node;
        console.log(`  - Variant #${vIndex + 1}: ${v.title}, SKU: ${v.sku}`);
      });
    });

  } catch (err) {
    console.error('Error fetching products:', err.response?.data || err.message);
  }
}

const main = async () => {
  await retrieveFromBaseStore();
}

main();
