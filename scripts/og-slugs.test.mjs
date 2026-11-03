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

test('OG filenames are portable across Windows, macOS and Linux', () => {
  // Windows interprets reserved device basenames even with a .png extension.
  for (const slug of [
    'con', 'prn', 'aux', 'nul', 'com1', 'com9', 'lpt1', 'lpt9',
  ]) {
    assert.throws(
      () => validatedOgKits([{ slug }]),
      /OG image slug must be a lowercase URL-safe filename/,
      slug,
    );
  }

  // Filename bytes are bounded to 255 including the .png extension.
  const safeMaximum = 'a'.repeat(251);
  const tooLong = 'a'.repeat(252);
  assert.deepEqual(validatedOgKits([{ slug: safeMaximum }]), [{ slug: safeMaximum }]);
  assert.throws(
    () => validatedOgKits([{ slug: tooLong }]),
    /OG image slug must be a lowercase URL-safe filename/,
  );

  // Prefixes containing device names are ordinary valid filenames.
  for (const slug of ['console', 'con-kit', 'com0', 'com10', 'lpt0']) {
    assert.deepEqual(validatedOgKits([{ slug }]), [{ slug }]);
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
