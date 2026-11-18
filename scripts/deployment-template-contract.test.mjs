// Contract checks for the inactive, opt-in Pages deployment example.
// This intentionally NEVER enables or invokes the deployment workflow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../ci/github-actions-ci.yml', import.meta.url), 'utf8');
const quality = readFileSync(new URL('../.github/workflows/site-quality.yml', import.meta.url), 'utf8');
const deploy = source.slice(source.indexOf('\n  deploy:\n'));
const testJob = source.slice(source.indexOf('\n  test:\n'), source.indexOf('\n  deploy:\n'));

test('reference remains clearly inactive and never replaces live read-only quality', () => {
  assert.match(source, /INACTIVE REFERENCE TEMPLATE/);
  assert.match(source, /ci\/.*not \.github\/workflows/);
  assert.match(quality, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(quality, /deploy-pages@|upload-pages-artifact@/);
});

test('top-level and PR job have only read-only access', () => {
  const top = source.split('\nconcurrency:')[0];
  assert.match(top, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(top, /pages: write|id-token: write/);
  assert.doesNotMatch(testJob, /pages: write|id-token: write/);
  assert.match(testJob, /persist-credentials: false/);
});

test('deployment and artifact upload require an actual push to main', () => {
  const gate = "github.event_name == 'push' && github.ref == 'refs/heads/main'";
  assert.equal(source.split(gate).length - 1, 2);
  assert.match(deploy, /needs: test/);
  assert.match(deploy, /pages: write/);
  assert.match(deploy, /id-token: write/);
  assert.doesNotMatch(deploy, /workflow_dispatch|pull_request/);
});

test('critical official actions use immutable verified SHAs', () => {
  const expected = {
    checkout: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    setup: 'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1',
    upload: 'actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa',
    deploy: 'actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e',
  };
  for (const [name, pin] of Object.entries(expected)) {
    assert.ok(source.includes(pin), name + ' must use immutable official SHA');
  }
  assert.doesNotMatch(source, /uses:\s*[^\n]+@v[0-9]+(?:\s|$)/m);
});

test('template keeps security audit blocking and full offline/browser tests', () => {
  assert.match(testJob, /node-version: '24'/);
  assert.match(testJob, /run: npm ci/);
  assert.match(testJob, /run: npm audit --omit=dev --audit-level=moderate/);
  assert.match(testJob, /run: npm test/);
  assert.match(testJob, /playwright install --with-deps chromium/);
  assert.match(testJob, /LH_PAGES=\/ LH_FORM_FACTORS=mobile/);
  assert.match(testJob, /run: npm test[\s\S]*?upload-pages-artifact@/);
});
