// Tiny static server that mimics GitHub Pages under the configured base path.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
const BASE = (process.env.SITE_BASE ?? '/rodrix-agent-kits').replace(/\/$/, '');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.mdc': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
export function serve(port = Number(process.env.PORT) || 4321) {
  const srv = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/' && BASE) { res.writeHead(302, { Location: BASE + '/' }); return res.end(); }
    if (BASE && !p.startsWith(BASE)) { res.writeHead(404); return res.end(); }
    p = normalize(p.slice(BASE.length) || '/').replace(/^(\.\.[/\\])+/, '');
    let f = join('dist', p);
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch {}
    try { const b = await readFile(f); res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(b); }
    catch { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); res.end(await readFile('dist/404.html')); }
  });
  return new Promise((r) => srv.listen(port, () => r(srv)));
}
if (import.meta.url === `file://${process.argv[1]}`) serve().then(() => console.log(`Serving dist at http://localhost:${process.env.PORT || 4321}${BASE}/`));
