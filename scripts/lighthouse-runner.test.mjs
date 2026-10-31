import test from 'node:test';
import assert from 'node:assert/strict';
import { runLighthouse, selectLighthouseTargets } from './lighthouse-runner.mjs';

function harness() {
  const events = [];
  const audits = [];
  const saved = [];
  const deps = {
    env: { LH_PAGES: '/', LH_FORM_FACTORS: 'mobile' },
    log: () => {},
    serve: async () => {
      events.push('serve');
      return { close(callback) { events.push('close-server'); callback(); } };
    },
    launchChrome: async () => {
      events.push('launch-chrome');
      return { port: 12345, async kill() { events.push('kill-chrome'); } };
    },
    audit: async (...args) => {
      events.push('audit');
      audits.push(args);
      const categories = Object.fromEntries(
        ['performance', 'accessibility', 'best-practices', 'seo'].map((key) => [key, { score: 0.9 }]),
      );
      return { lhr: { categories } };
    },
    save: async (report) => { events.push('save'); saved.push(report); },
  };
  return { deps, events, audits, saved };
}

test('targets honor defaults and explicit mobile/desktop selections', () => {
  const defaultTargets = selectLighthouseTargets({});
  assert.deepEqual(defaultTargets.formFactors, ['mobile', 'desktop']);
  assert.equal(defaultTargets.pages.length, 5);
  assert.deepEqual(selectLighthouseTargets({
    LH_PAGES: '/,/pricing/', LH_FORM_FACTORS: 'desktop',
  }), { pages: ['/', '/pricing/'], formFactors: ['desktop'] });
});

test('invalid targets fail before any server or Chrome is started', async () => {
  const invalidEnvs = [
    { LH_PAGES: '', LH_FORM_FACTORS: 'mobile' },
    { LH_PAGES: 'https://example.com/', LH_FORM_FACTORS: 'mobile' },
    { LH_PAGES: '//example.com', LH_FORM_FACTORS: 'mobile' },
    { LH_PAGES: '/../secrets', LH_FORM_FACTORS: 'mobile' },
    { LH_PAGES: '/valid/,', LH_FORM_FACTORS: 'mobile' },
    { LH_PAGES: '/', LH_FORM_FACTORS: '' },
    { LH_PAGES: '/', LH_FORM_FACTORS: 'tablet' },
    { LH_PAGES: '/', LH_FORM_FACTORS: 'mobile,tablet' },
  ];
  for (const env of invalidEnvs) {
    const h = harness();
    await assert.rejects(runLighthouse({ ...h.deps, env }), /LH_PAGES|LH_FORM_FACTORS/);
    assert.deepEqual(h.events, [], JSON.stringify(env));
  }
});

test('a successful audit preserves scores and closes Chrome and server', async () => {
  const h = harness();
  const rows = await runLighthouse({
    ...h.deps, env: { LH_PAGES: '/,/pricing/', LH_FORM_FACTORS: 'mobile,desktop' },
  });
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map((row) => row.formFactor), ['mobile', 'mobile', 'desktop', 'desktop']);
  assert.equal(rows[0].performance, 90);
  assert.equal(h.audits.length, 4);
  assert.equal(h.audits[0][0], 'http://localhost:4397/rodrix-agent-kits/');
  assert.equal(h.audits[0][2], undefined);
  assert.equal(h.audits[2][2].settings.formFactor, 'desktop');
  assert.equal(h.saved.length, 1);
  assert.deepEqual(h.saved[0].rows, rows);
  assert.match(h.saved[0].date, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(h.events.slice(-3), ['save', 'kill-chrome', 'close-server']);
});

test('Chrome startup failure still closes the server', async () => {
  const h = harness();
  h.deps.launchChrome = async () => { h.events.push('launch-chrome'); throw Error('launch failed'); };
  await assert.rejects(runLighthouse(h.deps), /launch failed/);
  assert.deepEqual(h.events, ['serve', 'launch-chrome', 'close-server']);
  assert.equal(h.saved.length, 0);
});

test('audit failure kills Chrome and closes server without saving results', async () => {
  const h = harness();
  h.deps.audit = async () => { h.events.push('audit'); throw Error('audit failed'); };
  await assert.rejects(runLighthouse(h.deps), /audit failed/);
  assert.deepEqual(h.events, ['serve', 'launch-chrome', 'audit', 'kill-chrome', 'close-server']);
  assert.equal(h.saved.length, 0);
});

test('failed score output still closes both resources', async () => {
  const h = harness();
  h.deps.save = async () => { h.events.push('save'); throw Error('disk full'); };
  await assert.rejects(runLighthouse(h.deps), /disk full/);
  assert.deepEqual(h.events.slice(-3), ['save', 'kill-chrome', 'close-server']);
});

test('a synchronous Chrome cleanup error does not prevent server shutdown', async () => {
  const h = harness();
  h.deps.launchChrome = async () => ({
    port: 12345,
    kill() { h.events.push('kill-chrome'); throw Error('kill failed'); },
  });
  await assert.rejects(
    runLighthouse(h.deps),
    (error) => error instanceof AggregateError
      && error.errors.some((cause) => cause.message === 'kill failed'),
  );
  assert.ok(h.events.includes('close-server'));
});

test('invalid or missing Lighthouse category scores fail without saving partial reports', async () => {
  const valid = () => Object.fromEntries(
    ['performance', 'accessibility', 'best-practices', 'seo']
      .map((key) => [key, { score: 0.9 }]),
  );
  const badResults = [
    ['missing response', undefined],
    ['missing LHR', {}],
    ['missing categories', { lhr: {} }],
    ['missing one category', { lhr: { categories: { performance: { score: 0.9 } } } }],
    ['missing category score', { lhr: { categories: { ...valid(), seo: {} } } }],
    ['null category score', { lhr: { categories: { ...valid(), seo: { score: null } } } }],
    ['string category score', { lhr: { categories: { ...valid(), seo: { score: '0.9' } } } }],
    ['boolean category score', { lhr: { categories: { ...valid(), seo: { score: true } } } }],
    ['not a number', { lhr: { categories: { ...valid(), seo: { score: NaN } } } }],
    ['positive infinity', { lhr: { categories: { ...valid(), seo: { score: Infinity } } } }],
    ['negative infinity', { lhr: { categories: { ...valid(), seo: { score: -Infinity } } } }],
    ['negative score', { lhr: { categories: { ...valid(), seo: { score: -0.01 } } } }],
    ['score over one', { lhr: { categories: { ...valid(), seo: { score: 1.01 } } } }],
  ];
  for (const [name, result] of badResults) {
    const h = harness();
    h.deps.audit = async () => { h.events.push('audit'); return result; };
    await assert.rejects(
      runLighthouse(h.deps),
      /Invalid Lighthouse (?:performance|accessibility|best-practices|seo) score for mobile \/$/,
      name,
    );
    assert.deepEqual(h.saved, [], name);
    assert.deepEqual(h.events, ['serve', 'launch-chrome', 'audit', 'kill-chrome', 'close-server'], name);
  }
});

test('valid zero and perfect Lighthouse scores are preserved', async () => {
  const h = harness();
  h.deps.audit = async () => ({
    lhr: {
      categories: {
        performance: { score: 0 },
        accessibility: { score: 1 },
        'best-practices': { score: 0.999 },
        seo: { score: 0.005 },
      },
    },
  });
  const rows = await runLighthouse(h.deps);
  assert.deepEqual(rows, [{
    formFactor: 'mobile', page: '/',
    performance: 0, accessibility: 100, bestPractices: 100, seo: 1,
  }]);
  assert.deepEqual(h.saved[0].rows, rows);
  assert.deepEqual(h.events.slice(-3), ['save', 'kill-chrome', 'close-server']);
});

test('a late invalid score discards otherwise valid earlier audit rows', async () => {
  const h = harness();
  h.deps.env.LH_PAGES = '/,/pricing/';
  let count = 0;
  h.deps.audit = async () => {
    h.events.push('audit');
    count++;
    const categories = Object.fromEntries(
      ['performance', 'accessibility', 'best-practices', 'seo']
        .map((key) => [key, { score: count === 1 ? 0.9 : NaN }]),
    );
    return { lhr: { categories } };
  };
  await assert.rejects(runLighthouse(h.deps), /Invalid Lighthouse performance score for mobile \/pricing\//);
  assert.equal(count, 2);
  assert.equal(h.saved.length, 0);
  assert.deepEqual(h.events.slice(-2), ['kill-chrome', 'close-server']);
});
