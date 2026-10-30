import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'node:fs';
import { serve } from './serve.mjs';
const PORT = 4397, B = '/rodrix-agent-kits';
const srv = await serve(PORT);
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', chromeFlags: ['--headless=new', '--no-sandbox'] });
const pages = ['/', '/kits/', '/kits/nextjs-supabase-cursor-rules/', '/pricing/', '/es/'];
const rows = [];
for (const formFactor of ['mobile', 'desktop']) for (const p of pages) {
  const cfg = formFactor === 'desktop' ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttlingMethod: 'simulate', throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } } : undefined;
  const r = await lighthouse(`http://localhost:${PORT}${B}${p}`, { port: chrome.port, output: 'json', logLevel: 'error' }, cfg);
  const c = r.lhr.categories; const s = (k) => Math.round(c[k].score * 100);
  rows.push({ formFactor, page: p, performance: s('performance'), accessibility: s('accessibility'), bestPractices: s('best-practices'), seo: s('seo') });
  console.log(formFactor.padEnd(8), p.padEnd(42), s('performance'), s('accessibility'), s('best-practices'), s('seo'));
}
writeFileSync('lighthouse/scores.json', JSON.stringify({ date: new Date().toISOString(), note: 'Local static server, simulated throttling (Lighthouse defaults). SEO measured on localhost.', rows }, null, 2));
await chrome.kill(); srv.close();
