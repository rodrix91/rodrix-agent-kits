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

test('C++ and C# are distinct searchable technical terms', () => {
  assert.deepEqual(tokenize('C++ / C#; Next.js + Python'), ['c++', 'c#', 'next.js', 'python']);
  assert.deepEqual(tokenize('Python+data'), ['python', 'data']);
  assert.deepEqual(tokenize('AGENTS.md / CLAUDE.md'), ['agents.md', 'claude.md']);
  const languageDocs = [
    { slug: 'cpp', title: 'C++', tool: 'Codex', text: 'C++ game engine build rules' },
    { slug: 'csharp', title: 'C#', tool: 'Cursor', text: 'C# dotnet application rules' },
    { slug: 'python', title: 'Python', tool: 'Codex', text: 'Python data automation rules' },
  ];
  assert.equal(rank('C++', languageDocs)[0]?.doc.slug, 'cpp');
  assert.equal(rank('C#', languageDocs)[0]?.doc.slug, 'csharp');
  assert.equal(rank('Python + data', languageDocs)[0]?.doc.slug, 'python');
  assert.deepEqual(rank('C', languageDocs), []);
  assert.deepEqual(rank('# + ...', languageDocs), []);
});


test('finder discovers dotted technical extensions without substring false positives', () => {
  const examples = [
    { slug: 'nextjs', title: 'Next.js kit', tool: 'Cursor', text: 'Next.js framework setup' },
    { slug: 'claude', title: 'Claude instructions', tool: 'Claude', text: 'CLAUDE.md agent policies' },
    { slug: 'productivity', title: 'Unrelated', tool: 'Productivity', text: 'Google productivity and documentation' },
    { slug: 'cpp', title: 'C++ setup', tool: 'Cursor', text: 'C++ build and C# integration' },
  ];
  assert.deepEqual(rank('JS', examples).map((item) => item.doc.slug), ['nextjs']);
  assert.deepEqual(rank('MD', examples).map((item) => item.doc.slug), ['claude']);
  assert.deepEqual(rank('Next.js', examples).map((item) => item.doc.slug), ['nextjs']);
  assert.deepEqual(rank('CLAUDE.md', examples).map((item) => item.doc.slug), ['claude']);
  assert.deepEqual(rank('Go', examples), []);
  assert.deepEqual(rank('C', examples), []);
  assert.deepEqual(rank('C++', examples).map((item) => item.doc.slug), ['cpp']);
  assert.deepEqual(rank('C#', examples).map((item) => item.doc.slug), ['cpp']);
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

test('long descriptions preserve exact hits when extra words are absent from every kit', () => {
  // These words intentionally do not appear in any test kit. A previous
  // normalization assigned them high IDF despite contributing zero matches,
  // diluting genuine results below the minimum confidence threshold.
  const unfamiliar = Array.from({ length: 60 }, (_, i) => `unlistedconcept${i}`).join(' ');
  for (const goal of ['Godot', 'Next.js', 'automatización de leads', 'revisión de código']) {
    const expected = rank(goal, docs);
    assert.ok(expected.length > 0, goal);
    const detailed = rank(`${goal} ${unfamiliar}`, docs);
    assert.deepEqual(detailed, expected, goal);
    assert.ok(detailed.every(({ score }) => score > 0.08), goal);
  }
  // An entirely unknown query still returns no fabricated recommendations.
  assert.deepEqual(rank(unfamiliar, docs), []);
  assert.deepEqual(rank('unlistedconcept0 unlistedconcept1', docs), []);
});

test('inherited object keys never crash synonym expansion or hide valid kits', () => {
  // A plain object exposes an inherited "constructor" function. This term
  // must be treated like any other query term, not as a synonym array.
  assert.deepEqual(rank('constructor', docs), []);
  assert.equal(rank('constructor Next.js', docs)[0]?.doc.slug, 'nextjs-supabase');
  const constructorKits = [
    { slug: 'javascript-classes', title: 'JavaScript classes', tool: 'Codex', text: 'JavaScript constructor patterns for web apps' },
    { slug: 'python-data', title: 'Python data', tool: 'Codex', text: 'Python pandas analytics' },
  ];
  assert.deepEqual(
    rank('constructor', constructorKits).map(({ doc }) => doc.slug),
    ['javascript-classes'],
  );
});

test('dotted names find their canonical aliases without unrelated matches', () => {
  // Users may search by a framework's printed name or its compact package
  // spelling, and by the name of an instructions file or its underlying tool.
  const compactNext = [
    { slug: 'nextjs-app', title: 'Framework', tool: 'Cursor', text: 'NextJS application routing' },
    { slug: 'unrelated', title: 'Other', tool: 'n8n', text: 'Workflow automation reports' },
  ];
  const dottedNext = [
    { slug: 'nextjs-guide', title: 'Framework', tool: 'Cursor', text: 'Next.js app configuration' },
    compactNext[1],
  ];
  const namedClaude = [
    { slug: 'claude-agent', title: 'Agent guide', tool: 'Claude', text: 'Claude coding instructions' },
    compactNext[1],
  ];
  assert.equal(rank('Next.js', compactNext)[0]?.doc.slug, 'nextjs-app');
  assert.equal(rank('nextjs', dottedNext)[0]?.doc.slug, 'nextjs-guide');
  assert.equal(rank('CLAUDE.md', namedClaude)[0]?.doc.slug, 'claude-agent');
  assert.deepEqual(rank('Next.js', [compactNext[1]]), []);
  assert.deepEqual(rank('CLAUDE.md', [compactNext[1]]), []);
});

test('empty queries, stop-word queries and empty catalogs produce no results', () => {
  assert.deepEqual(rank('', docs), []);
  assert.deepEqual(rank('the and in de con', docs), []);
  assert.deepEqual(rank('godot', []), []);
  assert.deepEqual(rank('godot', [{ slug: 'empty', title: '', tool: '', text: '' }]), []);
});

test('duplicate kit slugs cannot take multiple recommendation slots', () => {
  const duplicates = [
    { slug: 'repeated', title: 'First preview', tool: 'n8n', text: 'n8n workflow' },
    { slug: 'repeated', title: 'Second preview', tool: 'n8n', text: 'n8n workflow' },
    { slug: 'independent', title: 'Other workflow', tool: 'n8n', text: 'n8n workflow' },
  ];
  const results = rank('n8n', duplicates);
  assert.deepEqual(results.map(({ doc }) => doc.slug), ['repeated', 'independent']);
  // Identical scores retain source order: the first duplicate remains.
  assert.equal(results[0].doc.title, 'First preview');
});

test('duplicate slug retains its strongest match even when that appears later', () => {
  const duplicates = [
    { slug: 'repeated', title: 'Weak', tool: 'n8n', text: 'n8n general' },
    { slug: 'independent', title: 'Unique', tool: 'n8n', text: 'n8n workflow' },
    { slug: 'repeated', title: 'Strong', tool: 'n8n', text: 'n8n n8n python workflow' },
  ];
  // A second matched concept distinguishes genuine relevance from saturated
  // display scores. A single-term query can cap both candidates at 100%.
  const results = rank('n8n python', duplicates);
  assert.equal(results.find(({ doc }) => doc.slug === 'repeated')?.doc.title, 'Strong');
  assert.equal(results.filter(({ doc }) => doc.slug === 'repeated').length, 1);
  assert.ok(results.some(({ doc }) => doc.slug === 'independent'));
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
