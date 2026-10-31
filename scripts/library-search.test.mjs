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
