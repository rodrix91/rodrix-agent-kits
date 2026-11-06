import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, link, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listBuildHtmlFiles } from './safe-dist-html.mjs';

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
