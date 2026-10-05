import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await page.setContent('<style>html,body{margin:0;padding:0;width:1024px;height:1024px}</style>' + await readFile('assets/icon.svg', 'utf8'));
  await page.screenshot({ path: 'assets/icon.png' });
} finally { await browser.close(); }
