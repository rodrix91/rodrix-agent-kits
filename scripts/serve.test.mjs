import test from 'node:test';
import assert from 'node:assert/strict';
import { symlink, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serve } from './serve.mjs';

test('static preview serves only valid paths inside the configured base', async () => {
  const server = await serve(0);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = '/rodrix-agent-kits';
  try {
    const home = await fetch(origin + base + '/');
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type') ?? '', /text\/html/);

    const directFile = await fetch(origin + base + '/index.html');
    assert.equal(directFile.status, 200);

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
