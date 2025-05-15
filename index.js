const axios = require('axios');
const cron = require('node-cron');
const dotenv = require('dotenv');

dotenv.config();

const BASE_ACCESS_TOKEN = process.env.BASE_ACCESS_TOKEN;
const BASE_SHOP_DOMAIN = process.env.BASE_SHOP_DOMAIN;

const MY_STORE_DOMAIN = process.env.MY_STORE_DOMAIN;
const MY_STORE_ACCESS_TOKEN = process.env.MY_STORE_ACCESS_TOKEN;

const LIMIT = process.env.LIMIT || 10;
const SCHEDULE = process.env.SCHEDULE || '0 0 * * *';

console.log('BASE_ACCESS_TOKEN', BASE_ACCESS_TOKEN);
console.log('BASE_SHOP_DOMAIN', BASE_SHOP_DOMAIN);
console.log('MY_STORE_DOMAIN', MY_STORE_DOMAIN);
console.log('MY_STORE_ACCESS_TOKEN', MY_STORE_ACCESS_TOKEN);

const main = async () => {
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const after = endCursor ? `, after: \"${endCursor}\"` : '';
    const query = `
      {
        products(first: ${LIMIT}${after}) {
          edges {
            cursor
            node {
              id
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
      const updatedProducts = products.map(p => syncProduct(p.node));
      await Promise.all(updatedProducts);

      hasNextPage = response.data.data.products.pageInfo.hasNextPage;
      endCursor = response.data.data.products.pageInfo.endCursor;
    } catch (err) {
      console.error('❌ Error fetching products:', err.response?.data || err.message);
      break;
    }
  }
}

const syncProduct = async (product) => {
  try {
    const existProduct = await checkExistProduct(product);
    if (existProduct) {
      await updateProduct(product, existProduct);
    } else {
      await createProduct(product);
    }
  } catch (error) {
    console.error('❌ Error syncing product:', error.response?.data || error.message);
  }
}

const createProduct = async (product) => {
  const payload = {
    product: {
      title: product.title,
      body_html: product.description,
      tags: product.tags,
      variants: product.variants.edges.map(v => ({
        title: v.node.title,
        sku: v.node.sku
      }))
    }
  };

  try {
    console.log("🚀 ~ createProduct ~ payload:", payload.product.title, payload.product.variants)

    const response = await axios.post(
      `https://${MY_STORE_DOMAIN}/admin/api/2024-01/products.json`,
      payload,
      {
        headers: {
          'X-Shopify-Access-Token': MY_STORE_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Created product:', response.data.product.title);
  } catch (error) {
    console.error('❌ Error creating product:', error.response?.data || error.message, payload.product.title, payload.product.variants);
  }
}

const updateProduct = async (product, existProduct) => {
  try {
    const payload = {
      product: {
        id: existProduct.id,
        title: product.title,
        body_html: product.description,
        tags: product.tags,
        variants: product.variants.edges.map(v => ({
          id: v.node.id,
          title: v.node.title,
          sku: v.node.sku
        }))
      }
    };

    const response = await axios.put(
      `https://${MY_STORE_DOMAIN}/admin/api/2024-01/products/${existProduct.id}.json`,
      payload,
      {
        headers: {
          'X-Shopify-Access-Token': MY_STORE_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Updated product:', response.data.product.title);
  } catch (error) {
    console.error('❌ Error updating product:', error.response?.data || error.message);
  }
}

const checkExistProduct = async (product) => {
  try {
    const response = await axios.get(
      `https://${MY_STORE_DOMAIN}/admin/api/2024-01/products/${product.id}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': MY_STORE_ACCESS_TOKEN,
        }
      }
    );
    return response.data.product;
  } catch (error) {
    console.error('❌ Error checking product:', error.response?.data || error.message);
    return null;
  }
}

cron.schedule(SCHEDULE, async () => {
  console.log('🔄 Running cron job at:', new Date().toISOString());
  await main();
});
