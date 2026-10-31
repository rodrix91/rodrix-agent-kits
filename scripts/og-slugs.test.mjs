import test from 'node:test';
import assert from 'node:assert/strict';
import { validatedOgKits } from './og-slugs.mjs';

test('ordinary generated catalog slugs remain valid and records are unchanged', () => {
  const kits = [
    { slug: 'claude-md-python-data', title: 'Python' },
    { slug: 'agents-md-typescript-monorepo', title: 'TypeScript' },
    { slug: 'kit3', title: 'Third kit' },
    { slug: '0-a', title: 'Numeric slug' },
  ];
  assert.strictEqual(validatedOgKits(kits), kits);
  assert.deepEqual(validatedOgKits([]), []);
});

test('paths and malformed filename segments are rejected before OG writes', () => {
  const bad = [
    '../package', '../../package', 'dir/kit', 'dir\\kit', '/tmp/kit',
    '.', '..', 'a..b', 'a.b', 'a--b', '-a', 'a-', '', 'A-B',
    '%2e%2e%2fescape', 'caf%C3%A9', 'café', 'a b', 'a\nb', 'a\u202e',
    null, undefined, 42, true, {}, [],
  ];
  for (const slug of bad) {
    assert.throws(
      () => validatedOgKits([{ slug }]),
      /OG image slug must be a lowercase URL-safe filename/,
      'bad slug: ' + String(slug),
    );
  }
});

test('default OG image is reserved and duplicate slugs are rejected', () => {
  assert.throws(() => validatedOgKits([{ slug: 'default' }]), /Duplicate or reserved OG image slug: default/);
  assert.throws(
    () => validatedOgKits([{ slug: 'first-kit' }, { slug: 'second-kit' }, { slug: 'first-kit' }]),
    /Duplicate or reserved OG image slug: first-kit/,
  );
});

test('non-array catalog and missing records fail closed', () => {
  for (const kits of [null, undefined, {}, { slug: 'ok' }, 'ok']) {
    assert.throws(() => validatedOgKits(kits), /OG image catalog must be an array/);
  }
  for (const kit of [null, undefined, {}, { slug: null }]) {
    assert.throws(() => validatedOgKits([{ slug: 'safe' }, kit]), /OG image slug must be/);
  }
});
