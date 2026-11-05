import test from 'node:test';
import assert from 'node:assert/strict';
import { validatedOgKits, wrapOgText } from './og-slugs.mjs';

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

test('OG text wrapping preserves normal phrases and never fabricates empty lines', () => {
  assert.deepEqual(wrapOgText('Agent kits that actually ship.', 30), [
    'Agent kits that actually ship.',
  ]);
  assert.deepEqual(wrapOgText('  Alpha   beta\tg a m m a  ', 10), [
    'Alpha beta', 'g a m m a',
  ]);
  assert.deepEqual(wrapOgText('', 30), []);
  assert.deepEqual(wrapOgText('   ', 30), []);
});

test('OG text wrapping splits long identifiers without overflowing text widths', () => {
  assert.deepEqual(wrapOgText('X'.repeat(65), 30), [
    'X'.repeat(30), 'X'.repeat(30), 'X'.repeat(5),
  ]);
  assert.deepEqual(wrapOgText('prefix ' + 'Y'.repeat(33) + ' end', 30), [
    'prefix', 'Y'.repeat(30), 'YYY end',
  ]);
  // An emoji is one Unicode code point even though it occupies two UTF-16 units.
  assert.deepEqual(wrapOgText('📚'.repeat(21), 20), [
    '📚'.repeat(20), '📚',
  ]);
  for (const line of wrapOgText('long' + '😀'.repeat(65), 30)) {
    assert.ok(Array.from(line).length <= 30);
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(line));
  }
});

test('OG text wrapping refuses invalid render inputs and widths', () => {
  for (const value of [null, undefined, 8, [], {}]) {
    assert.throws(() => wrapOgText(value, 30), /OG text must be a string/);
  }
  for (const width of [0, -1, 1.5, Infinity, NaN, '30']) {
    assert.throws(() => wrapOgText('title', width), /OG line width must be/);
  }
});

test('OG wrapping never splits combining accents or multi-code-point emoji', () => {
  // In these strings one visible grapheme uses two or more Unicode code
  // points. A code-point split would create broken image text.
  const family = '👨‍👩‍👧‍👦';
  const flag = '🇧🇴';
  const worker = '👩‍💻';
  const accented = 'e\u0301';
  const thumbs = '👍🏽';

  assert.deepEqual(wrapOgText(family.repeat(3), 2), [
    family.repeat(2), family,
  ]);
  assert.deepEqual(wrapOgText(flag.repeat(3), 2), [
    flag.repeat(2), flag,
  ]);
  assert.deepEqual(wrapOgText(worker.repeat(3), 2), [
    worker.repeat(2), worker,
  ]);
  assert.deepEqual(wrapOgText(accented.repeat(3), 2), [
    accented.repeat(2), accented,
  ]);
  assert.deepEqual(wrapOgText(thumbs.repeat(3), 2), [
    thumbs.repeat(2), thumbs,
  ]);
});

test('OG wrapping respects limits by displayed grapheme, including a single column', () => {
  const parts = ['e\u0301', '👩‍💻', '🇧🇴', '👍🏽', 'ñ'];
  assert.deepEqual(wrapOgText(parts.join(''), 1), parts);

  const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' });
  const rendered = wrapOgText(parts.join('') + ' simple', 3);
  assert.deepEqual(rendered.flatMap((line) =>
    Array.from(graphemes.segment(line), ({ segment }) => segment)
      .filter((part) => part !== ' ')), [...parts, ...'simple']);
  assert.ok(rendered.every((line) => Array.from(graphemes.segment(line)).length <= 3));
  assert.ok(rendered.every(Boolean));
});
