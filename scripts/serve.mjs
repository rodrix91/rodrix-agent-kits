// Tiny static server that mimics GitHub Pages under the configured base path.
// This is a LOCAL development/test server, not an Internet-facing production host.
import { createServer } from 'node:http';
import { open, readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = (process.env.SITE_BASE ?? '/rodrix-agent-kits').replace(/\/$/, '');
const DIST = resolve('dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.mdc': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };


// resolve() checks the lexical path; realpath() also follows symlinks.
// Never serve a file outside the canonical dist directory, even through
// a symlinked file or parent directory.
async function containedFile(file) {
  const [root, target] = await Promise.all([realpath(DIST), realpath(file)]);
  if (target !== root && !target.startsWith(root + sep)) {
    const error = new Error('Resolved path escapes dist');
    error.code = 'OUTSIDE_DIST';
    throw error;
  }
  // Both GET and HEAD must reject special files and escaped symlinks.
  // An in-tree FIFO can otherwise block a read indefinitely.
  const details = await stat(target);
  if (!details.isFile()) {
    const error = new Error('Preview target is not a regular file');
    error.code = 'INVALID_DIST_FILE';
    throw error;
  }
  return { target, details };
}

async function readContained(file) {
  const { target } = await containedFile(file);
  return readFile(target);
}

// Open and verify the same canonical regular file for both GET and HEAD.
// An entry under dist can be replaced between realpath()/stat() and open();
// never trust stale metadata or a swapped-in external file descriptor.
async function openContained(file) {
  const { target, details } = await containedFile(file);
  const handle = await open(target, 'r');
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== details.dev || opened.ino !== details.ino) {
      const error = new Error('Preview file changed while opening');
      error.code = 'INVALID_DIST_FILE';
      throw error;
    }
    return { handle, details: opened };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

export function serve(port = Number(process.env.PORT) || 4321) {
  const srv = createServer(async (req, res) => {
    // This is a static preview only. Reject mutating HTTP methods even if
    // the requested path resolves to a readable HTML or asset file.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {
        Allow: 'GET, HEAD',
        'Content-Type': 'text/plain; charset=utf-8',
      });
      return res.end('Method not allowed');
    }
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
      const contentType = TYPES[extname(file)] || 'application/octet-stream';
      if (req.method === 'HEAD') {
        // HEAD needs the same path and readability checks as GET, but must
        // never allocate the entire asset just to discard its response body.
        const { handle, details } = await openContained(file);
        await handle.close();
        res.writeHead(200, {
          'Content-Type': contentType, 'Content-Length': details.size,
        });
        return res.end();
      }
      // GET must not buffer the entire asset in RAM. The opened file
      // identity and containment are shared with HEAD and checked above.
      const { handle, details } = await openContained(file);
      const stream = handle.createReadStream();
      // A disconnected browser must not leave an asset stream running.
      res.once('close', () => stream.destroy());
      stream.once('error', () => res.destroy());
      res.writeHead(200, {
        'Content-Type': contentType, 'Content-Length': details.size,
      });
      stream.pipe(res);
      return;
    } catch (error) {
      if (error?.code === 'OUTSIDE_DIST' || error?.code === 'INVALID_DIST_FILE') {
        res.writeHead(403); return res.end('Forbidden');
      }
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      // HEAD must not read a fallback page either.
      if (req.method === 'HEAD') return res.end();
      // Apply the same containment check to the fallback response.
      try { return res.end(await readContained(resolve(DIST, '404.html'))); }
      catch { return res.end('Not found'); }
    }
  });
  // A local preview must never listen on public/LAN interfaces by default.
  // Bind explicitly to IPv4 loopback instead of Node's wildcard address.
  return new Promise((resolve, reject) => {
    // listen() reports an occupied port asynchronously through 'error'.
    // Reject the caller's promise rather than crashing on an unhandled event.
    srv.once('error', reject);
    srv.listen(port, '127.0.0.1', () => {
      srv.off('error', reject);
      resolve(srv);
    });
  });
}
// Module URLs percent-encode spaces, # and %, and use file:///C:/... on Windows.
// Construct the entrypoint URL with Node instead of concatenating a raw path.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  serve().then((server) => {
    console.log(`Serving dist at http://127.0.0.1:${server.address().port}${BASE}/`);
  }).catch((error) => {
    console.error(`Could not start local preview: ${error.message}`);
    process.exitCode = 1;
  });
}
