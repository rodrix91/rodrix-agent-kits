import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeJsonLd } from '../src/lib/jsonld.ts';

test('JSON-LD never allows a data string to terminate the script element', () => {
  const dangerous = 'Kit </ScRiPt><img src=x onerror=alert(1)> & text\u2028next\u2029line';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: dangerous,
    offers: { description: '<script>untrusted</script>', price: 0 },
  };
  const serialized = serializeJsonLd(data);
  // The HTML parser treats script content as raw text. A raw "<" can end
  // the element, regardless of JavaScript string or JSON quoting.
  assert.equal(serialized.includes('<'), false);
  assert.equal(serialized.includes('>'), false);
  assert.equal(serialized.includes('&'), false);
  assert.equal(serialized.includes('\u2028'), false);
  assert.equal(serialized.includes('\u2029'), false);
  assert.ok(serialized.includes('\\u003c/ScRiPt\\u003e'));
  const html = '<script type="application/ld+json">' + serialized + '</script>';
  assert.equal((html.match(/<\/script>/gi) ?? []).length, 1);
  assert.deepEqual(JSON.parse(serialized), data);
});

test('ordinary multilingual metadata, URLs, and nested arrays round-trip unchanged', () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Guía español, Tarija 🇧🇴, 東京, <API>',
    url: 'https://example.org/kits/?q=a&lang=es',
    itemListElement: [{ name: 'CLAUDE.md & AGENTS.md' }, { name: 'n8n "automation"' }],
  };
  const serialized = serializeJsonLd(data);
  assert.deepEqual(JSON.parse(serialized), data);
  assert.ok(serialized.includes('Tarija 🇧🇴'));
  assert.ok(serialized.includes('\\u0026lang=es'));
  assert.ok(serialized.includes('\\u003cAPI\\u003e'));
});
