import path from 'path';
import fs from 'fs';
import https from 'https';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

function makeShopifyProxy(prefix: string, shop: string, token: string) {
  return {
    name: `shopify-proxy-${prefix}`,
    configureServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        if (!req.url?.startsWith(`/api/${prefix}/`)) return next();

        const parsedUrl = new URL(req.url, 'http://localhost');
        const apiPath = parsedUrl.pathname.replace(`/api/${prefix}/`, '');
        const targetPath = `/admin/api/2025-01/${apiPath}${parsedUrl.search}`;

        const options: https.RequestOptions = {
          hostname: shop,
          path: targetPath,
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': token,
            'Accept': 'application/json',
            'Connection': 'close',
          },
          timeout: 20000,
        };

        const shopifyReq = https.request(options, (shopifyRes) => {
          const chunks: Buffer[] = [];
          shopifyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
          shopifyRes.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            res.writeHead(shopifyRes.statusCode ?? 200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(body);
          });
        });

        shopifyReq.on('timeout', () => {
          shopifyReq.destroy();
          if (!res.headersSent) {
            res.writeHead(504, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Gateway timeout' }));
          }
        });

        shopifyReq.on('error', (err) => {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
        });

        shopifyReq.end();
      });
    },
  };
}

function shopifyOAuthPlugin(env: Record<string, string>) {
  const storeMap: Record<string, { clientId: string; clientSecret: string; tokenKey: string }> = {
    [env.SHOPIFY_SHOP]: {
      clientId: env.SHOPIFY_CLIENT_ID,
      clientSecret: env.SHOPIFY_CLIENT_SECRET,
      tokenKey: 'VITE_SHOPIFY_ACCESS_TOKEN',
    },
    [env.VCCHIC_SHOP]: {
      clientId: env.VCCHIC_CLIENT_ID,
      clientSecret: env.VCCHIC_CLIENT_SECRET,
      tokenKey: 'VITE_VCCHIC_ACCESS_TOKEN',
    },
    [env.SEZO_SHOP]: {
      clientId: env.SEZO_CLIENT_ID,
      clientSecret: env.SEZO_CLIENT_SECRET,
      tokenKey: 'VITE_SEZO_ACCESS_TOKEN',
    },
  };

  return {
    name: 'shopify-oauth',
    configureServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        const url = new URL(req.url || '', `http://localhost:3000`);
        if (url.pathname !== '/auth/callback') return next();

        const code = url.searchParams.get('code');
        const shop = url.searchParams.get('shop') || env.SHOPIFY_SHOP;

        if (!code || !shop) {
          res.writeHead(400);
          res.end('Missing code or shop');
          return;
        }

        const creds = storeMap[shop];
        if (!creds) {
          res.writeHead(400);
          res.end(`Loja desconhecida: ${shop}`);
          return;
        }

        try {
          const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: creds.clientId,
              client_secret: creds.clientSecret,
              code,
            }),
          });

          const data = await tokenRes.json() as { access_token?: string; error?: string };

          if (data.access_token) {
            const envPath = path.resolve('.env.local');
            let content = fs.readFileSync(envPath, 'utf-8');
            const regex = new RegExp(`${creds.tokenKey}=.*`);
            if (regex.test(content)) {
              content = content.replace(regex, `${creds.tokenKey}=${data.access_token}`);
            } else {
              content += `\n${creds.tokenKey}=${data.access_token}`;
            }
            fs.writeFileSync(envPath, content);

            res.writeHead(302, { Location: `/?shopify=connected&store=${shop}` });
            res.end();
          } else {
            res.writeHead(500);
            res.end(`Erro ao obter token: ${JSON.stringify(data)}`);
          }
        } catch (err) {
          res.writeHead(500);
          res.end(`Erro: ${err}`);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Connection': 'close',
      },
    },
    plugins: [
      react(),
      makeShopifyProxy('shopify', env.SHOPIFY_SHOP, env.VITE_SHOPIFY_ACCESS_TOKEN),
      makeShopifyProxy('vcchic',  env.VCCHIC_SHOP,  env.VITE_VCCHIC_ACCESS_TOKEN),
      makeShopifyProxy('sezo',    env.SEZO_SHOP,    env.VITE_SEZO_ACCESS_TOKEN),
      shopifyOAuthPlugin(env),
    ],
    define: {
      'process.env.VITE_SHOPIFY_ACCESS_TOKEN': JSON.stringify(env.VITE_SHOPIFY_ACCESS_TOKEN),
      'process.env.SHOPIFY_SHOP': JSON.stringify(env.SHOPIFY_SHOP),
      'process.env.VITE_VCCHIC_ACCESS_TOKEN': JSON.stringify(env.VITE_VCCHIC_ACCESS_TOKEN),
      'process.env.VCCHIC_SHOP': JSON.stringify(env.VCCHIC_SHOP),
      'process.env.VITE_SEZO_ACCESS_TOKEN': JSON.stringify(env.VITE_SEZO_ACCESS_TOKEN),
      'process.env.SEZO_SHOP': JSON.stringify(env.SEZO_SHOP),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion': ['framer-motion'],
            'supabase': ['@supabase/supabase-js'],
            'genai': ['@google/genai'],
            'icons': ['lucide-react'],
          }
        }
      }
    }
  };
});
