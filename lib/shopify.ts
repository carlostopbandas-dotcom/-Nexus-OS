const SHOP = process.env.SHOPIFY_SHOP || 'usamoriel.myshopify.com';
const ACCESS_TOKEN = process.env.VITE_SHOPIFY_ACCESS_TOKEN || '';

async function shopifyFetch(endpoint: string) {
  const res = await fetch(`https://${SHOP}/admin/api/2025-01/${endpoint}`, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  return res.json();
}

export async function getOrders(limit = 50) {
  const data = await shopifyFetch(`orders.json?limit=${limit}&status=any`);
  return data.orders;
}

export async function getOrdersCount() {
  const data = await shopifyFetch('orders/count.json?status=any');
  return data.count;
}

export async function getProducts(limit = 50) {
  const data = await shopifyFetch(`products.json?limit=${limit}`);
  return data.products;
}

export function isShopifyConnected(): boolean {
  return !!ACCESS_TOKEN;
}

export function getShopifyAuthUrl(): string {
  const clientId = '03531a4d8b7166d5226173cadcbd6558';
  const scopes = 'read_orders,read_products,read_customers,read_analytics';
  const redirectUri = encodeURIComponent('http://localhost:3000/auth/callback');
  return `https://${SHOP}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=nexus`;
}
