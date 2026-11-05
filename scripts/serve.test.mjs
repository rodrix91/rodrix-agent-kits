import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { copyFile, mkdtemp, open, rm, symlink, unlink } from 'node:fs/promises';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { serve } from './serve.mjs';

test('static preview serves only valid paths inside the configured base', async () => {
  const server = await serve(0);
  assert.equal(server.address().address, '127.0.0.1',
    'the static preview must bind only to loopback, never a LAN interface');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = '/rodrix-agent-kits';
  try {
    const home = await fetch(origin + base + '/');
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type') ?? '', /text\/html/);

    const directFile = await fetch(origin + base + '/index.html');
    assert.equal(directFile.status, 200);

    // A static preview must serve reads without accepting data-changing
    // requests to either a page or a generated asset.
    const head = await fetch(origin + base + '/index.html', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-type'), directFile.headers.get('content-type'));
    assert.equal(head.headers.get('content-length'), directFile.headers.get('content-length'));
    assert.equal(await head.text(), '', 'HEAD must never return a response body');

    for (const [method, pathname] of [
      ['POST', '/index.html'],
      ['PUT', '/search-en.json'],
      ['PATCH', '/index.html'],
      ['DELETE', '/index.html'],
    ]) {
      const denied = await fetch(origin + base + pathname, { method });
      assert.equal(denied.status, 405, method);
      assert.equal(denied.headers.get('allow'), 'GET, HEAD', method);
      assert.match(await denied.text(), /Method not allowed/, method);
    }

    const redirect = await fetch(origin + '/', { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get('location'), base + '/');

    const withoutSlash = await fetch(origin + base, { redirect: 'manual' });
    assert.equal(withoutSlash.status, 302);
    assert.equal(withoutSlash.headers.get('location'), base + '/');

    const wrongBase = await fetch(origin + base + '-other/index.html');
    assert.equal(wrongBase.status, 404);

    const missing = await fetch(origin + base + '/not-a-real-file');
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get('content-type') ?? '', /text\/html/);
    const missingHead = await fetch(origin + base + '/not-a-real-file', { method: 'HEAD' });
    assert.equal(missingHead.status, 404);
    assert.equal(missingHead.headers.get('content-type'), missing.headers.get('content-type'));
    assert.equal(await missingHead.text(), '');

    const traversal = await fetch(origin + base + '/%2F..%2Fpackage.json');
    assert.equal(traversal.status, 400);

    const backslash = await fetch(origin + base + '/%5Cpackage.json');
    assert.equal(backslash.status, 400);

    const nul = await fetch(origin + base + '/%00package.json');
    assert.equal(nul.status, 400);

    const invalidEncoding = await fetch(origin + base + '/%ZZ');
    assert.equal(invalidEncoding.status, 400);

    // Lexical path checks are insufficient: readFile follows file and
    // directory symlinks, potentially exposing private source files.
    const escapedFile = `.preview-escaped-file-${process.pid}.txt`;
    const escapedDir = `.preview-escaped-dir-${process.pid}`;
    const createdLinks = [];
    try {
      const fileLink = resolve('dist', escapedFile);
      await symlink(resolve('package.json'), fileLink, 'file');
      createdLinks.push(fileLink);

      const dirLink = resolve('dist', escapedDir);
      await symlink(resolve('src'), dirLink, 'dir');
      createdLinks.push(dirLink);

      const fileAttempt = await fetch(origin + base + '/' + escapedFile);
      assert.equal(fileAttempt.status, 403, 'symlinked file outside dist must be denied');
      assert.ok(!(await fileAttempt.text()).includes('"name": "rodrix-agent-kits"'));
      assert.equal(
        (await fetch(origin + base + '/' + escapedFile, { method: 'HEAD' })).status,
        403, 'HEAD must not bypass symlink containment',
      );

      const dirAttempt = await fetch(origin + base + '/' + escapedDir + '/config.ts');
      assert.equal(dirAttempt.status, 403, 'symlinked parent directory must be denied');
    } finally {
      for (const path of createdLinks) await unlink(path);
    }

    // A rejected path must not crash the server or block a later good request.
    assert.equal((await fetch(origin + base + '/')).status, 200);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('HEAD on a large sparse asset returns metadata without downloading a body', async () => {
  const filename = `.preview-large-${process.pid}.bin`;
  const file = resolve('dist', filename);
  const size = 64 * 1024 * 1024;
  const handle = await open(file, 'w');
  try {
    await handle.truncate(size);
  } finally {
    await handle.close();
  }
  let server;
  try {
    server = await serve(0);
    const origin = `http://127.0.0.1:${server.address().port}/rodrix-agent-kits/`;
    const response = await fetch(origin + filename, {
      method: 'HEAD', signal: AbortSignal.timeout(4000),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-length'), String(size));
    assert.equal(response.headers.get('content-type'), 'application/octet-stream');
    assert.equal(await response.text(), '');
    assert.equal((await fetch(origin + 'index.html')).status, 200);
  } finally {
    if (server) {
      await new Promise((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve()));
    }
    await unlink(file);
  }
});

test('a FIFO inside dist cannot hang a preview GET or HEAD request', async (t) => {
  if (process.platform === 'win32') {
    t.skip('mkfifo is not available on Windows');
    return;
  }
  const name = `.preview-fifo-${process.pid}`;
  const pipe = resolve('dist', name);
  try {
    execFileSync('mkfifo', [pipe]);
  } catch {
    t.skip('This runner does not support creating named pipes');
    return;
  }

  let server;
  try {
    server = await serve(0);
    const origin = `http://127.0.0.1:${server.address().port}/rodrix-agent-kits/`;
    for (const method of ['GET', 'HEAD']) {
      const response = await fetch(origin + name, {
        method, signal: AbortSignal.timeout(4000),
      });
      assert.equal(response.status, 403, `${method}: nonregular files must be denied`);
    }
    // A denied FIFO must not prevent subsequent regular static files.
    assert.equal((await fetch(origin + 'index.html')).status, 200);
  } finally {
    if (server) {
      await new Promise((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve()));
    }
    await unlink(pipe);
  }
});

test('an occupied preview port rejects cleanly without disrupting the existing server', async () => {
  const first = await serve(0);
  const port = first.address().port;
  try {
    await assert.rejects(
      serve(port),
      { code: 'EADDRINUSE' },
      'a second preview must reject rather than cause an unhandled server error',
    );
    const stillServing = await fetch(`http://127.0.0.1:${port}/rodrix-agent-kits/`);
    assert.equal(stillServing.status, 200);
  } finally {
    await new Promise((resolve, reject) =>
      first.close((error) => error ? reject(error) : resolve()));
  }
});


test('direct CLI starts from a folder with spaces and URL metacharacters', async () => {
  // Previously the module URL comparison used file:// + an unescaped raw
  // pathname, so Node never entered the CLI branch when the path contained
  // whitespace, # or %. pathToFileURL also handles Windows drive paths.
  const temporary = await mkdtemp(join(tmpdir(), 'preview # percent-'));
  const entrypoint = join(temporary, 'serve preview.mjs');
  let child;
  try {
    await copyFile(new URL('./serve.mjs', import.meta.url), entrypoint);
    // Let the OS choose a free loopback port, then release it for the CLI.
    const probe = await serve(0);
    const port = probe.address().port;
    await new Promise((resolve, reject) =>
      probe.close((error) => error ? reject(error) : resolve()));

    child = spawn(process.execPath, [entrypoint], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(() => {
        reject(new Error('Preview CLI did not report a listening server: ' + stderr));
      }, 8000);
      const finish = (error) => {
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve();
      };
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
        if (stdout.includes('Serving dist at http://127.0.0.1:' + port + '/')) finish();
      });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      child.once('error', finish);
      child.once('exit', (code) =>
        finish(new Error('Preview CLI exited before listening (' + code + '): ' + stderr)));
    });
    const page = await fetch('http://127.0.0.1:' + port + '/rodrix-agent-kits/', {
      signal: AbortSignal.timeout(4000),
    });
    assert.equal(page.status, 200);
    assert.ok((page.headers.get('content-type') ?? '').startsWith('text/html'));
  } finally {
    if (child && child.exitCode === null) {
      const closed = once(child, 'close');
      child.kill();
      await closed;
    }
    await rm(temporary, { recursive: true, force: true });
  }
});
