// Tiny static server that mimics GitHub Pages under the configured base path.
// This is a LOCAL development/test server, not an Internet-facing production host.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const BASE = (process.env.SITE_BASE ?? '/rodrix-agent-kits').replace(/\/$/, '');
const DIST = resolve('dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.mdc': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };

export function serve(port = Number(process.env.PORT) || 4321) {
  const srv = createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400); return res.end('Bad request');
    }
    // A malformed or encoded path must never escape dist or confuse the base path.
    if (pathname.includes('\0') || pathname.includes('\\')) {
      res.writeHead(400); return res.end('Bad request');
    }
    if (BASE && (pathname === '/' || pathname === BASE)) {
      res.writeHead(302, { Location: BASE + '/' }); return res.end();
    }
    if (BASE && !pathname.startsWith(BASE + '/')) {
      res.writeHead(404); return res.end();
    }
    const relativePath = pathname.slice(BASE.length) || '/';
    if (relativePath.split('/').some((part) => part === '..')) {
      res.writeHead(400); return res.end('Bad request');
    }
    let file = resolve(DIST, '.' + relativePath);
    if (file !== DIST && !file.startsWith(DIST + sep)) {
      res.writeHead(403); return res.end();
    }
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      return res.end(bytes);
    } catch {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      try { return res.end(await readFile(resolve(DIST, '404.html'))); }
      catch { return res.end('Not found'); }
    }
  });
  return new Promise((done) => srv.listen(port, () => done(srv)));
}
if (import.meta.url === `file://${process.argv[1]}`) serve().then(() => console.log(`Serving dist at http://localhost:${process.env.PORT || 4321}${BASE}/`));
