export default async function handler(req: any, res: any) {
  const shop = process.env.VCCHIC_SHOP;
  const token = process.env.VITE_VCCHIC_ACCESS_TOKEN;

  if (!shop || !token) {
    res.status(503).json({ error: 'Shopify VcChic não configurado — verifique VCCHIC_SHOP e VITE_VCCHIC_ACCESS_TOKEN no Vercel' });
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const apiPath = url.pathname.replace(/^\/api\/vcchic/, '');
  const targetUrl = `https://${shop}/admin/api/2025-01${apiPath}${url.search}`;

  try {
    const shopifyRes = await fetch(targetUrl, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Accept': 'application/json',
      },
    });
    const data = await shopifyRes.json();
    res.status(shopifyRes.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
