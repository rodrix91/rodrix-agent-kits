import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fencedKitContent } from '../src/lib/markdown-fences.ts';

test('ordinary Markdown and JSON retain their original three-backtick fences', () => {
  assert.equal(fencedKitContent('name: kit', 'markdown'), '```markdown\nname: kit\n```');
  assert.equal(fencedKitContent('{"nodes":[]}', 'json'), '```json\n{"nodes":[]}\n```');
});

test('real HANDOFF template stays inside one unbroken fenced source block', () => {
  const source = readFileSync(new URL('../src/kitfiles/HANDOFF.template.md', import.meta.url), 'utf8');
  assert.ok(source.includes('```sh'), 'fixture must have an inner shell block');
  const wrapped = fencedKitContent(source, 'markdown');
  assert.ok(wrapped.startsWith('````markdown\n'));
  assert.ok(wrapped.endsWith('\n````'));
  assert.equal(wrapped.slice('````markdown\n'.length, -'\n````'.length), source);
  assert.equal(wrapped.split('\n````').length, 2, 'only the final line closes the outer block');
});

test('four- and five-backtick snippets force a longer safe delimiter', () => {
  for (const [source, fence] of [['````\ninner\n````', '`````'], ['`````', '``````']]) {
    const output = fencedKitContent(source, 'markdown');
    assert.equal(output, `${fence}markdown\n${source}\n${fence}`);
  }
});
