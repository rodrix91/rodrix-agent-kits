import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeXmlText } from '../src/lib/xml-text.ts';

test('RSS text escapes XML markup while preserving ordinary titles', () => {
  assert.equal(
    escapeXmlText(`A&B <kit> "quoted" 'single'`),
    'A&amp;B &lt;kit&gt; &quot;quoted&quot; &apos;single&apos;',
  );
  assert.equal(
    escapeXmlText('Tarija, 日本語, español, 🇧🇴, 👩‍💻'),
    'Tarija, 日本語, español, 🇧🇴, 👩‍💻',
  );
  assert.equal(escapeXmlText('tabs\tand\nline breaks\rkept'), 'tabs\tand\nline breaks\rkept');
});

test('RSS text replaces forbidden XML 1.0 code points instead of serializing them', () => {
  const prohibitedC0 = Array.from({ length: 32 }, (_, code) => code)
    .filter((code) => ![9, 10, 13].includes(code));
  for (const code of [...prohibitedC0, 0xfffe, 0xffff, 0xd800, 0xdbff, 0xdc00, 0xdfff]) {
    const forbidden = String.fromCharCode(code);
    assert.equal(escapeXmlText(`before${forbidden}after`), 'before\uFFFDafter',
      `unexpected XML character U+${code.toString(16)}`);
  }
  assert.equal(escapeXmlText('\uD800emoji\uDC00'), '\uFFFDemoji\uFFFD');
  // A legal supplementary scalar must not be split into two replacements.
  const supplementary = String.fromCodePoint(0x1f600, 0x10ffff);
  assert.equal(escapeXmlText(supplementary), supplementary);
});

test('escaping never double-interprets entities or loses valid whitespace', () => {
  assert.equal(escapeXmlText('already &amp; encoded'), 'already &amp;amp; encoded');
  assert.equal(escapeXmlText('A\u0001&B\u0002<C>'), 'A\uFFFD&amp;B\uFFFD&lt;C&gt;');
  assert.equal(escapeXmlText(''), '');
});
