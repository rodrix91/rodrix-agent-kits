import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, link, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listBuildHtmlFiles, validatePostbuildDestinations, validatePostbuildInputs } from './safe-dist-html.mjs';

test('postbuild HTML inventory includes nested regular files, not assets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'og-postbuild-'));
  try {
    const dist = join(dir, 'dist');
    await mkdir(join(dist, 'nested'), { recursive: true });
    await writeFile(join(dist, 'index.html'), '<html>root</html>');
    await writeFile(join(dist, 'nested', 'page.html'), '<html>child</html>');
    await writeFile(join(dist, 'nested', 'asset.css'), 'a{}');
    assert.deepEqual(listBuildHtmlFiles(dist), [
      join(dist, 'index.html'), join(dist, 'nested', 'page.html'),
    ]);
    assert.throws(() => listBuildHtmlFiles(join(dist, 'index.html')), /real directory/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('postbuild rejects hardlinked HTML before it can rewrite external files', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'og-hardlink-'));
  try {
    const dist = join(dir, 'dist');
    await mkdir(dist);
    const outside = join(dir, 'outside.html');
    await writeFile(outside, '<html>do not change me</html>');
    try {
      await link(outside, join(dist, 'linked.html'));
    } catch (error) {
      if (['EPERM', 'EOPNOTSUPP', 'ENOSYS'].includes(error?.code)) {
        t.skip('Hard links unavailable on this runner');
        return;
      }
      throw error;
    }
    assert.throws(() => listBuildHtmlFiles(dist), /hardlinks/);
    assert.equal(await readFile(outside, 'utf8'), '<html>do not change me</html>');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('postbuild refuses linked files and parent directories outside dist', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'og-symlink-'));
  try {
    const dist = join(dir, 'dist');
    const externalDir = join(dir, 'external');
    await mkdir(dist);
    await mkdir(externalDir);
    const external = join(externalDir, 'private.html');
    await writeFile(external, '<html>private content</html>');
    let linked;
    try {
      await symlink(external, join(dist, 'private.html'), 'file');
      linked = 'file';
    } catch (error) {
      if (['EPERM', 'EOPNOTSUPP', 'ENOSYS'].includes(error?.code)) {
        t.skip('Symbolic links unavailable on this runner');
        return;
      }
      throw error;
    }
    assert.equal(linked, 'file');
    assert.throws(() => listBuildHtmlFiles(dist), /symbolic link/);
    await rm(join(dist, 'private.html'));
    await symlink(externalDir, join(dist, 'nested'), 'dir');
    assert.throws(() => listBuildHtmlFiles(dist), /symbolic link/);
    assert.equal(await readFile(external, 'utf8'), '<html>private content</html>');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('postbuild refuses hardlinked generated assets before rewriting external files', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'og-output-hardlink-'));
  try {
    const dist = join(dir, 'dist');
    await mkdir(join(dist, 'og'), { recursive: true });
    const outside = join(dir, 'important-data.txt');
    await writeFile(outside, 'must remain unchanged');
    for (const relative of ['og/default.png', 'og/sample-kit.png', '_headers', '.nojekyll', 'sitemap.xml']) {
      const target = join(dist, relative);
      try {
        await link(outside, target);
      } catch (error) {
        if (['EPERM', 'EOPNOTSUPP', 'ENOSYS'].includes(error?.code)) {
          t.skip('Hard links unavailable on this runner');
          return;
        }
        throw error;
      }
      assert.throws(
        () => validatePostbuildDestinations(dist, ['sample-kit']),
        /regular file without links/,
        relative,
      );
      assert.equal(await readFile(outside, 'utf8'), 'must remain unchanged');
      await rm(target);
    }
    // Existing ordinary generated files and absent output paths are safe.
    await writeFile(join(dist, 'og', 'default.png'), 'generated preview');
    assert.doesNotThrow(() => validatePostbuildDestinations(dist, ['sample-kit']));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('postbuild rejects a linked OG directory and malformed generated slugs', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'og-output-directory-'));
  try {
    const dist = join(dir, 'dist');
    const outside = join(dir, 'external');
    await mkdir(dist);
    await mkdir(outside);
    try { await symlink(outside, join(dist, 'og'), 'dir'); }
    catch (error) {
      if (['EPERM', 'EOPNOTSUPP', 'ENOSYS'].includes(error?.code)) {
        t.skip('Symbolic links unavailable on this runner');
        return;
      }
      throw error;
    }
    assert.throws(() => validatePostbuildDestinations(dist, []), /OG asset directory/);
    await rm(join(dist, 'og'));
    for (const bad of ['../escape', '/absolute', 'nested/path', '', 'A UPPER']) {
      assert.throws(() => validatePostbuildDestinations(dist, [bad]), /safe filename components/);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});


test('postbuild accepts single-link generated catalog and sitemap inputs', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'og-sources-normal-'));
  try {
    const dist = join(workspace, 'dist');
    await mkdir(dist);
    await writeFile(join(dist, 'search-en.json'), '[]\n');
    await writeFile(join(dist, 'sitemap-index.xml'), '<sitemapindex />\n');
    assert.doesNotThrow(() => validatePostbuildInputs(dist));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('postbuild rejects linked generated input sources before any publication', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'og-sources-links-'));
  try {
    const dist = join(workspace, 'dist');
    await mkdir(dist);
    const normal = { 'search-en.json': '[]\n', 'sitemap-index.xml': '<sitemapindex />\n' };
    for (const [name, content] of Object.entries(normal)) {
      await writeFile(join(dist, name), content);
    }
    for (const [name, content] of Object.entries(normal)) {
      const input = join(dist, name);
      const outside = join(workspace, 'external-' + name);
      const secret = 'private-source-content-not-for-publication';
      await writeFile(outside, secret);
      await rm(input);
      try {
        await symlink(outside, input, 'file');
      } catch (error) {
        if (['EPERM', 'EACCES', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS'].includes(error?.code)) {
          t.diagnostic('Symlink unavailable on this runner: ' + error.code);
        } else {
          throw error;
        }
      }
      const symlinkPresent = await readFile(input, 'utf8').then(() => true, () => false);
      if (symlinkPresent) {
        assert.throws(() => validatePostbuildInputs(dist), /Postbuild input must be a single-link regular file/);
        await rm(input);
      }
      try {
        await link(outside, input);
      } catch (error) {
        if (['EPERM', 'EACCES', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS', 'EXDEV'].includes(error?.code)) {
          t.diagnostic('Hardlink unavailable on this runner: ' + error.code);
        } else {
          throw error;
        }
      }
      const hardlinkPresent = await readFile(input, 'utf8').then(() => true, () => false);
      if (hardlinkPresent) {
        assert.throws(() => validatePostbuildInputs(dist), /Postbuild input must be a single-link regular file/);
        await rm(input);
      }
      assert.equal(await readFile(outside, 'utf8'), secret);
      await writeFile(input, content);
      assert.doesNotThrow(() => validatePostbuildInputs(dist));
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('postbuild rejects missing inputs and nonregular input directories', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'og-sources-missing-'));
  try {
    const dist = join(workspace, 'dist');
    await mkdir(dist);
    assert.throws(() => validatePostbuildInputs(dist), /Postbuild input file is missing: search-en.json/);
    await writeFile(join(dist, 'search-en.json'), '[]\n');
    assert.throws(() => validatePostbuildInputs(dist), /Postbuild input file is missing: sitemap-index.xml/);
    await mkdir(join(dist, 'sitemap-index.xml'));
    assert.throws(() => validatePostbuildInputs(dist), /Postbuild input must be a single-link regular file/);
    assert.throws(() => validatePostbuildInputs(join(dist, 'search-en.json')), /Build output root must be a real directory/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
