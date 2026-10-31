import test from 'node:test';
import assert from 'node:assert/strict';
import { rank, tokenize } from '../src/lib/match.ts';

const docs = [
  { slug: 'nextjs-supabase', title: 'Web app', tool: 'Cursor', text: 'Next.js Supabase auth React web SaaS login rules' },
  { slug: 'n8n-flow', title: 'Automate leads', tool: 'n8n', text: 'n8n workflow automation form lead capture CRM' },
  { slug: 'code-review', title: 'Review', tool: 'Agent Skills', text: 'Review pull request code diff security checks' },
  { slug: 'godot-rules', title: 'Games', tool: 'Cursor', text: 'Godot GDScript game development videojuego' },
  { slug: 'spanish-guide', title: 'Spanish', tool: 'Codex', text: 'Guía en español de automatización y revisión' },
];

test('tokenization handles accented and unaccented Spanish consistently', () => {
  assert.deepEqual(tokenize('Revisión, AUTOMATIZACIÓN y Español'), [
    'revision', 'automatizacion', 'espanol',
  ]);
  assert.deepEqual(tokenize('revision, automatizacion y espanol'), [
    'revision', 'automatizacion', 'espanol',
  ]);
  assert.deepEqual(tokenize('Café / NIÑO!'), ['cafe', 'nino']);
  assert.deepEqual(tokenize('a de and 123'), ['123']);
});

test('Spanish queries rank identically with and without accent marks', () => {
  for (const [accented, plain] of [
    ['revisión de código', 'revision de codigo'],
    ['automatización de leads', 'automatizacion de leads'],
    ['guía español', 'guia espanol'],
  ]) {
    const lhs = rank(accented, docs);
    const rhs = rank(plain, docs);
    assert.deepEqual(lhs, rhs, accented);
    assert.ok(lhs.length > 0, 'must return relevant results for ' + accented);
  }
  assert.equal(rank('automatizacion de leads', docs)[0].doc.slug, 'n8n-flow');
  assert.equal(rank('revisión pull request', docs)[0].doc.slug, 'code-review');
});

test('existing English and Spanish finder intents retain relevant top kits', () => {
  assert.equal(rank('I am building a SaaS with Next.js and Supabase login', docs)[0].doc.slug, 'nextjs-supabase');
  assert.equal(rank('quiero automatizar formularios de leads', docs)[0].doc.slug, 'n8n-flow');
  assert.equal(rank('I want Godot game rules', docs)[0].doc.slug, 'godot-rules');
});

test('empty queries, stop-word queries and empty catalogs produce no results', () => {
  assert.deepEqual(rank('', docs), []);
  assert.deepEqual(rank('the and in de con', docs), []);
  assert.deepEqual(rank('godot', []), []);
  assert.deepEqual(rank('godot', [{ slug: 'empty', title: '', tool: '', text: '' }]), []);
});

test('larger catalogs preserve finite, deterministic scores and stable ranking', () => {
  const catalog = Array.from({ length: 600 }, (_, i) => ({
    slug: 'kit-' + i,
    title: 'Kit ' + i,
    tool: 'Codex',
    text: i % 3 === 0 ? 'workflow n8n automation lead capture' :
      i % 3 === 1 ? 'Godot game development rules' : 'Python data analytics notebook',
  }));
  const first = rank('automatización lead', catalog);
  const second = rank('automatizacion lead', catalog);
  assert.deepEqual(first, second);
  assert.ok(first.length > 0);
  assert.equal(first[0].doc.slug, 'kit-0');
  assert.ok(first.every(({ score }) => Number.isFinite(score) && score > 0 && score <= 1));
  assert.ok(first.every(({ doc }) => Number(doc.slug.slice(4)) % 3 === 0));
});
