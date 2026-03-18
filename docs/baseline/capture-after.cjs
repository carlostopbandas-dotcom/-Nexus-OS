/**
 * Captura screenshots pós-Sprint 3 — Story 1.3.9
 * Salva em docs/baseline/sprint3-after/
 *
 * Uso:
 *   SCREENSHOT_EMAIL=email SCREENSHOT_PASSWORD=senha node docs/baseline/capture-after.cjs
 *   node docs/baseline/capture-after.cjs  (abre browser para login manual)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL   = process.env.SCREENSHOT_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'sprint3-after');

const EMAIL    = process.env.SCREENSHOT_EMAIL;
const PASSWORD = process.env.SCREENSHOT_PASSWORD;

const PAGES = [
  { url: '/',          file: '01-dashboard.png',  name: 'Dashboard'  },
  { url: '/okrs',      file: '02-okrs.png',        name: 'OKRs'       },
  { url: '/pipeline',  file: '03-pipeline.png',    name: 'Pipeline'   },
  { url: '/content',   file: '04-content.png',     name: 'Content'    },
  { url: '/knowledge', file: '05-knowledge.png',   name: 'Knowledge'  },
  { url: '/calls',     file: '06-calls.png',       name: 'Calls'      },
  { url: '/routine',   file: '07-routine.png',     name: 'Routine'    },
  { url: '/tasks',     file: '08-tasks.png',       name: 'Tasks'      },
  { url: '/ai',        file: '09-ai.png',          name: 'AI Advisor' },
];

async function captureScreenshots() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const headless = !!(EMAIL && PASSWORD);
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('🌐 Navegando para o app...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Detectar login por presença do formulário na página (SPA não faz redirect de URL)
  const hasLoginForm = await page.$('input[type="email"]').then(el => !!el).catch(() => false);

  if (hasLoginForm) {
    if (EMAIL && PASSWORD) {
      console.log('🔐 Fazendo login automático...');
      await page.fill('input[type="email"]', EMAIL);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      console.log('✅ Login realizado');
    } else {
      console.log('⚠️  Login necessário. Faça login no browser aberto e pressione ENTER aqui...');
      await new Promise(resolve => process.stdin.once('data', resolve));
    }
  }

  console.log('\n📸 Capturando screenshots pós-Sprint 3 (1440x900)...\n');

  const results = [];
  for (const p of PAGES) {
    process.stdout.write(`  → ${p.name.padEnd(12)} (${p.url.padEnd(10)}) ... `);
    await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    const filePath = path.join(OUTPUT_DIR, p.file);
    await page.screenshot({ path: filePath, fullPage: false });
    const size = Math.round(fs.statSync(filePath).size / 1024);
    console.log(`✅ ${p.file} (${size}KB)`);
    results.push({ file: p.file, size });
  }

  await browser.close();

  console.log(`\n✅ ${PAGES.length}/9 screenshots salvos em: docs/baseline/sprint3-after/`);
  console.log('\nArquivos:');
  results.forEach(r => console.log(`  ${r.file} — ${r.size}KB`));
}

captureScreenshots().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
