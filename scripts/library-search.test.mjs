import test from 'node:test';
import assert from 'node:assert/strict';
import { foldSearchText, matchesSearch, searchTerms } from '../src/lib/library-search.ts';

test('accented and unaccented Spanish queries match identically', () => {
  const card = 'CLAUDE.md para equipos: el agente explica en español y escribe código en inglés';
  for (const [accented, plain] of [
    ['ESPAÑOL', 'espanol'],
    ['código inglés', 'codigo ingles'],
    ['equipos español', 'equipos espanol'],
  ]) {
    assert.equal(matchesSearch(card, searchTerms(accented)), true);
    assert.equal(matchesSearch(card, searchTerms(plain)), true);
    assert.deepEqual(searchTerms(accented), searchTerms(plain));
  }
});

test('normalizes decomposed accents and whitespace without losing original text', () => {
  const source = 'Programación: revisión de código';
  assert.equal(foldSearchText(source), 'programacion: revision de codigo');
  assert.deepEqual(searchTerms(' \n  REVISIO\u0301N   CÓDIGO \t'), ['revision', 'codigo']);
  assert.equal(source, 'Programación: revisión de código');
});

test('natural punctuation separates bilingual searches without hiding valid kits', () => {
  const card = 'n8n workflow para automatización de leads y revisión de código en español';
  const canonical = searchTerms('n8n automatizacion');
  assert.deepEqual(canonical, ['n8n', 'automatizacion']);
  for (const query of [
    'n8n, automatización', '¿n8n automatización?', 'n8n / AUTOMATIZACIÓN!',
    '"n8n" (automatizacion)', 'n8n: automatización.', 'n8n + automatizacion',
  ]) {
    assert.deepEqual(searchTerms(query), canonical, query);
    assert.equal(matchesSearch(card, searchTerms(query)), true, query);
  }
  assert.deepEqual(searchTerms('¿revisión, código?'), ['revision', 'codigo']);
  assert.equal(matchesSearch(card, searchTerms('¿revisión, código?')), true);
  assert.equal(matchesSearch(card, searchTerms('n8n, godot')), false);
});

test('technical punctuation stays in file names, product names and programming terms', () => {
  const text = 'Use CLAUDE.md with Next.js, C++ and C#; rules also mention AGENTS.md';
  assert.deepEqual(
    searchTerms('CLAUDE.md / Next.js + C++ / C#'),
    ['claude.md', 'next.js', 'c++', 'c#'],
  );
  assert.equal(matchesSearch(text, searchTerms('CLAUDE.md, Next.js!')), true);
  assert.equal(matchesSearch(text, searchTerms('¿C++ / C#?')), true);
  assert.deepEqual(searchTerms('AGENTS.md.'), ['agents.md']);
  assert.deepEqual(searchTerms('¿!? / + # ...'), []);
});

test('hyphenated and underscored queries match whitespace-separated kit titles', () => {
  const card = 'Code review agent skill for AGENTS.md in a TypeScript monorepo';
  for (const query of ['code-review', 'code_review', 'code review']) {
    assert.deepEqual(searchTerms(query), ['code', 'review'], query);
    assert.equal(matchesSearch(card, searchTerms(query)), true, query);
  }
  assert.deepEqual(searchTerms('AGENTS.md-typescript'), ['agents.md', 'typescript']);
  assert.equal(matchesSearch(card, searchTerms('AGENTS.md-typescript')), true);
  assert.equal(matchesSearch(card, searchTerms('code-godot')), false);
});

test('punctuation-aware tokenization preserves non-Latin searches', () => {
  assert.deepEqual(searchTerms('Русский, язык!'), ['русскии', 'язык']);
  assert.equal(matchesSearch('Русский язык', searchTerms('Русский, язык!')), true);
  assert.deepEqual(searchTerms('日本語、東京'), ['日本語', '東京']);
  assert.equal(matchesSearch('日本語 東京', searchTerms('日本語、東京')), true);
});

test('maintains AND matching, nonmatches, and empty-search behavior', () => {
  const card = 'n8n workflow para automatización de leads';
  assert.equal(matchesSearch(card, searchTerms('n8n automatizacion')), true);
  assert.equal(matchesSearch(card, searchTerms('n8n godot')), false);
  assert.equal(matchesSearch(card, searchTerms('')), true);
  assert.equal(matchesSearch('', searchTerms('anything')), false);
  assert.deepEqual(searchTerms('   '), []);
});

test('preserves multilingual characters outside Latin accents', () => {
  assert.equal(matchesSearch('Русский язык', searchTerms('русский')), true);
  assert.equal(matchesSearch('naïve café', searchTerms('naive cafe')), true);
  assert.equal(matchesSearch('日本語', searchTerms('日本語')), true);
});
