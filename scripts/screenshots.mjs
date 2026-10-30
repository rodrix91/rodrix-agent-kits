import { serve } from './serve.mjs';
import { launch } from './browser.mjs';
import { mkdirSync } from 'node:fs';
const PORT = 4398, B = '/rodrix-agent-kits'; mkdirSync('screenshots', { recursive: true });
const srv = await serve(PORT); const browser = await launch();
const pages = { home: '/', library: '/kits/', kit: '/kits/nextjs-supabase-cursor-rules/', pricing: '/pricing/', 'es-home': '/es/' };
for (const w of [390, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : w === 768 ? 1024 : 900 }, deviceScaleFactor: w === 390 ? 2 : 1, colorScheme: 'dark', reducedMotion: 'reduce' });
  for (const [n, p] of Object.entries(pages)) {
    const page = await ctx.newPage(); await page.goto(`http://localhost:${PORT}${B}${p}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `screenshots/${n}-${w}.png`, fullPage: true }); if (n === 'home') await page.screenshot({ path: `screenshots/home-${w}-fold.png` }); await page.close();
  }
  await ctx.close();
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
const pg = await ctx.newPage(); await pg.goto(`http://localhost:${PORT}${B}/`, { waitUntil: 'networkidle' }); await pg.screenshot({ path: 'screenshots/home-1440-light.png', fullPage: true });
await browser.close(); srv.close(); console.log('screenshots saved');
