import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { kitModificationDates, sitemapLastmod, validUtcDate } from './sitemap-dates.mjs';

const kit = (filename, extra = '', added = '2026-10-30') => ({
  filename,
  content: '---\nadded: "' + added + '"\n' + extra + '---\n## Readme\n',
});

test('date validation rejects invalid and silently normalized UTC days', () => {
  for (const date of ['2024-02-29', '2026-10-30', '2026-01-01']) {
    assert.equal(validUtcDate(date), true, date);
  }
  for (const date of [
    '2026-02-29', '2026-13-01', '2026-00-31', '2026-04-31',
    '2026-1-01', '2026-01-1', '2026-10-30T00:00:00Z',
    '2026-10-30junk', '2026-10-30\nupdated: 2027-01-01',
    '', null, 42,
  ]) {
    assert.equal(validUtcDate(date), false, String(date));
  }
});

test('kit sitemap dates reflect actual added or later updated metadata', () => {
  const dated = kitModificationDates([
    kit('first-kit.md'),
    kit('second-kit.md', 'updated: "2026-10-31"\n'),
    kit('third-kit.md', "updated: '2026-10-30'\n"),
  ]);
  assert.deepEqual([...dated], [
    ['first-kit', '2026-10-30'],
    ['second-kit', '2026-10-31'],
    ['third-kit', '2026-10-30'],
  ]);
  assert.equal(sitemapLastmod('https://example.test/project/kits/first-kit/', dated), '2026-10-30');
  assert.equal(sitemapLastmod('https://example.test/project/es/kits/second-kit/', dated), '2026-10-31');
  assert.equal(sitemapLastmod('https://example.test/kits/third-kit/', dated), '2026-10-30');
});

test('undocumented general pages never receive artificial build-day lastmod', () => {
  const dates = kitModificationDates([kit('first-kit.md')]);
  for (const url of [
    'https://example.test/', 'https://example.test/project/',
    'https://example.test/project/kits/', 'https://example.test/project/es/',
    'https://example.test/project/pricing/', 'https://example.test/project/guides/readme/',
    'https://example.test/project/es/kits/', 'https://example.test/project/changelog/',
  ]) {
    assert.equal(sitemapLastmod(url, dates), undefined, url);
  }
  assert.throws(
    () => sitemapLastmod('https://example.test/project/kits/unknown-kit/', dates),
    /no verified source date/,
  );
});

test('invalid, duplicate and contradictory metadata fails the build', () => {
  const invalid = [
    kit('foo.md', 'updated: "2026-10-29"\n'),
    kit('foo.md', 'updated: "2026-02-30"\n'),
    kit('foo.md', 'updated: NaN\n'),
    kit('foo.md', 'updated: "2026-10-31" # comment\n'),
    kit('foo.md', 'added: "2026-10-30"\n'),
    kit('foo.md', 'added: "2026-10-31"\n'),
    kit('foo.md', '', '2026-02-30'),
    { filename: 'foo.md', content: '---\ntool: cursor\n---\nbody' },
    { filename: 'foo.md', content: 'no frontmatter' },
    { filename: '../foo.md', content: kit('foo.md').content },
    { filename: 'FOO.md', content: kit('foo.md').content },
    { filename: 'foo.md', content: null },
    null,
  ];
  for (const item of invalid) {
    assert.throws(() => kitModificationDates([item]), undefined, JSON.stringify(item));
  }
  assert.throws(() => kitModificationDates([kit('foo.md'), kit('foo.md')]), /Duplicate kit slug/);
  assert.throws(() => kitModificationDates(null), /must be an array/);
});

test('only top-level frontmatter metadata controls sitemap modification dates', () => {
  const data = kitModificationDates([{
    filename: 'hello-world.md',
    content: '---\nadded: 2026-10-30\nen:\n  description: "updated: 2030-10-31"\n---\n'
      + '# Header\nupdated: 2099-01-01\n',
  }]);
  assert.equal(data.get('hello-world'), '2026-10-30');
});

test('all real kit sources have explicit parseable sitemap dates', () => {
  const files = readdirSync('src/content/kits').filter((name) => name.endsWith('.md'));
  const dates = kitModificationDates(files.map((filename) => ({
    filename,
    content: readFileSync('src/content/kits/' + filename, 'utf8'),
  })));
  assert.equal(dates.size, files.length);
  assert.ok(dates.size >= 6);
  for (const [slug, date] of dates) {
    assert.equal(validUtcDate(date), true, slug);
    assert.equal(sitemapLastmod('https://example.test/site/es/kits/' + slug + '/', dates), date);
  }
});
