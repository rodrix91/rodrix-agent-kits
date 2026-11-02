import test from 'node:test';
import assert from 'node:assert/strict';
import { kitContentType } from '../src/lib/kit-content-type.ts';

test('n8n JSON workflow downloads use a JSON content type', () => {
  assert.equal(kitContentType('n8n-lead-capture.json'), 'application/json; charset=utf-8');
  assert.equal(kitContentType('OTHER.JSON'), 'application/json; charset=utf-8');
});

test('Markdown, rule files and filenames containing json stay plain text', () => {
  for (const filename of [
    'AGENTS.md', 'supabase-rls.mdc', 'code-review.SKILL.md',
    'n8n-lead-capture.json.md', 'json-config.txt',
  ]) {
    assert.equal(kitContentType(filename), 'text/plain; charset=utf-8', filename);
  }
});
