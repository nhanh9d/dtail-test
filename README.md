# dtail-test
This is a test from interview process with dtail

## ✅ 1. Prerequisites

- Node.js ≥ 14 (in my work, I use node 22)
- Installed dependencies: `axios`
- Your account has permission to add Develop Apps

## 🔐 2. Access Tokens

Create **Admin API Access Tokens** for your store at:

> Shopify Admin → Apps → Develop Apps → Configure Admin API scopes

Required scopes:

- `read_products`
- `write_products`

Set tokens in your env:

```
BASE_ACCESS_TOKEN=shpat_xxx (given in ticket)
BASE_SHOP_DOMAIN=source.domain (given in ticket)
MY_STORE_DOMAIN=your-store.domain (your domain)
MY_STORE_ACCESS_TOKEN=shpat_yyy (your created access token)
```

## 🔄 3. Sync Logic Overview
- Fetch products from source shop using GraphQL
    - For each product:

    - Search product in your shop

        - If it exists → update the product

        - If it doesn't exist → create a new one

## 📦 4. Product Structure Being Synced
Product:
- title (Product Name)
- body_html (Description)
- tags
- handle
- Variants:
  - title (Variant Name)
  - sku
  - price

## 🚀 5. Run the Script
```bash
npm run start
```
Or
```bash
node index.js
```

## ⚠️ 6. Shopify Notes & Constraints
- Shopify only allows updating one product per request
- Bulk API cannot be used for real-time updates