import test from 'node:test';
import assert from 'node:assert/strict';
import { foldSearchText, hasUnsearchableQuery, matchesSearch, searchTerms } from '../src/lib/library-search.ts';



test('short technical queries match whole tokens rather than unrelated fragments', () => {
  const productivity = 'Productivity and Google collaboration kit, paid plans';
  const review = 'PR review and AI-assisted code checks, written in Go';
  for (const query of ['PR', 'AI', 'Go', 'C']) {
    assert.equal(matchesSearch(productivity, searchTerms(query)), false, query);
  }
  for (const query of ['pr', 'AI', 'go', 'PR AI']) {
    assert.equal(matchesSearch(review, searchTerms(query)), true, query);
  }
  assert.equal(matchesSearch('C++ and C# integration', searchTerms('C')), false);
  assert.equal(matchesSearch('C++ and C# integration', searchTerms('C#')), true);
  assert.equal(matchesSearch('C++ and C# integration', searchTerms('C++')), true);
  assert.equal(matchesSearch('A PR review for React', searchTerms('PR react')), true);
  assert.equal(matchesSearch('Improved productivity for React', searchTerms('PR react')), false);
});

test('longer library queries retain useful partial and bilingual matches', () => {
  assert.equal(matchesSearch('Automatización de leads', searchTerms('automatiz')), true);
  assert.equal(matchesSearch('Productivity toolkit', searchTerms('product')), true);
  assert.equal(matchesSearch('A Go project on GitHub', searchTerms('go git')), true);
  assert.equal(matchesSearch('Googled productivity tools', searchTerms('go git')), false);
  assert.equal(matchesSearch('Revisión de código', searchTerms('revisión código')), true);
});

test('punctuation-only library queries do not display every kit', () => {
  const card = 'C++ and C# coding kits, CLAUDE.md, n8n workflow';
  for (const query of ['+++', '¿!?', '# / +', '...', '   !!!   ']) {
    const terms = searchTerms(query);
    assert.deepEqual(terms, [], query);
    assert.equal(hasUnsearchableQuery(query, terms), true, query);
    assert.equal(!hasUnsearchableQuery(query, terms) && matchesSearch(card, terms), false);
  }
  for (const query of ['', '  ', '\n\t']) {
    const terms = searchTerms(query);
    assert.equal(hasUnsearchableQuery(query, terms), false, JSON.stringify(query));
    assert.equal(matchesSearch(card, terms), true);
  }
  for (const query of ['C++', 'C#', 'n8n+workflow', 'CLAUDE.md']) {
    const terms = searchTerms(query);
    assert.ok(terms.length > 0, query);
    assert.equal(hasUnsearchableQuery(query, terms), false, query);
    assert.equal(matchesSearch(card, terms), true, query);
  }
});

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

test('adjacent plus signs separate terms without breaking C++ and C# names', () => {
  const card = 'n8n workflow for Next.js C# integration and automation';
  assert.deepEqual(searchTerms('n8n+workflow'), ['n8n', 'workflow']);
  assert.deepEqual(searchTerms('Next.js+C#'), ['next.js', 'c#']);
  assert.deepEqual(searchTerms('C+++Next.js'), ['c++', 'next.js']);
  assert.deepEqual(searchTerms('n8n+workflow'), searchTerms('n8n + workflow'));
  assert.equal(matchesSearch(card, searchTerms('n8n+workflow')), true);
  assert.equal(matchesSearch(card, searchTerms('Next.js+C#')), true);
  assert.equal(matchesSearch(card, searchTerms('n8n+godot')), false);
  assert.deepEqual(searchTerms('a+b'), ['a', 'b']);
  assert.deepEqual(searchTerms('+++###'), []);
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

test('short queries find dotted extensions without matching arbitrary fragments', () => {
  const next = 'Use Next.js with the CLAUDE.md instructions for C++ and C# projects';
  assert.equal(matchesSearch(next, searchTerms('JS')), true);
  assert.equal(matchesSearch(next, searchTerms('Next JS')), true);
  assert.equal(matchesSearch(next, searchTerms('.md')), true);
  assert.equal(matchesSearch(next, searchTerms('MD')), true);
  assert.equal(matchesSearch(next, searchTerms('C++')), true);
  assert.equal(matchesSearch(next, searchTerms('C#')), true);
  assert.equal(matchesSearch(next, searchTerms('C')), false);

  const unrelated = 'Google productivity kit';
  for (const query of ['Go', 'JS', 'MD']) {
    assert.equal(matchesSearch(unrelated, searchTerms(query)), false, query);
  }
  assert.equal(matchesSearch(next, searchTerms('JS runtime')), false);
});
