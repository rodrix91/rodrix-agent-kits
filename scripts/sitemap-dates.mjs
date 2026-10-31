// Derive sitemap modification dates from source kit metadata, never build time.
// This module is independent of Astro and can be tested without a network.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const KIT_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const DATE_FIELD = /^(added|updated):[ \t]*(?:"([^"]+)"|'([^']+)'|([^\s#]+))[ \t]*$/;

export function validUtcDate(value) {
  if (typeof value !== 'string' || !DAY.test(value)) return false;
  const timestamp = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function kitModificationDates(files) {
  if (!Array.isArray(files)) throw new TypeError('Kit source files must be an array');
  const dates = new Map();
  for (const file of files) {
    const { filename, content } = file ?? {};
    if (typeof filename !== 'string' || !KIT_FILE.test(filename)
      || typeof content !== 'string') {
      throw new TypeError('Invalid kit source file');
    }
    const slug = filename.slice(0, -3);
    if (dates.has(slug)) throw new Error('Duplicate kit slug: ' + slug);
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) throw new Error('Missing kit frontmatter: ' + filename);
    const fields = new Map();
    for (const line of frontmatter[1].split(/\r?\n/)) {
      const label = line.match(/^(added|updated):/);
      if (!label) continue;
      const match = line.match(DATE_FIELD);
      if (!match) throw new Error('Invalid kit date field: ' + filename);
      if (fields.has(match[1])) throw new Error('Duplicate kit date field: ' + filename);
      const value = match[2] ?? match[3] ?? match[4];
      if (!validUtcDate(value)) throw new Error('Invalid kit UTC date: ' + filename);
      fields.set(match[1], value);
    }
    const added = fields.get('added');
    const updated = fields.get('updated');
    if (!added) throw new Error('Missing kit added date: ' + filename);
    if (updated && updated < added) throw new Error('Kit update precedes publication: ' + filename);
    dates.set(slug, updated ?? added);
  }
  return dates;
}

// Guides carry a verified `updated` date (the day the guide was checked against the docs).
export function guideModificationDates(files) {
  if (!Array.isArray(files)) throw new TypeError('Guide source files must be an array');
  const dates = new Map();
  for (const file of files) {
    const { filename, content } = file ?? {};
    if (typeof filename !== 'string' || !KIT_FILE.test(filename) || typeof content !== 'string') {
      throw new TypeError('Invalid guide source file');
    }
    const slug = filename.slice(0, -3);
    if (dates.has(slug)) throw new Error('Duplicate guide slug: ' + slug);
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) throw new Error('Missing guide frontmatter: ' + filename);
    const lines = frontmatter[1].split(/\r?\n/).filter((line) => /^updated:/.test(line));
    if (lines.length !== 1) throw new Error('Guide needs exactly one updated date: ' + filename);
    const match = lines[0].match(DATE_FIELD);
    const value = match && (match[2] ?? match[3] ?? match[4]);
    if (!validUtcDate(value)) throw new Error('Invalid guide UTC date: ' + filename);
    dates.set(slug, value);
  }
  return dates;
}

export function sitemapLastmod(url, kitDates, guideDates) {
  if (!(kitDates instanceof Map)) throw new TypeError('Kit date index must be a Map');
  const pathname = new URL(String(url)).pathname;
  const guide = pathname.match(/\/(es\/)?guides\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/);
  if (guide) {
    const index = guide[1] ? guideDates?.es : guideDates?.en;
    if (!(index instanceof Map)) return undefined; // No verified guide index supplied.
    const lastmod = index.get(guide[2]);
    if (!lastmod) throw new Error('Sitemap guide has no verified source date: ' + guide[2]);
    return lastmod;
  }
  const match = pathname.match(/\/(?:es\/)?kits\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/);
  if (!match) return undefined; // Never fabricate dates for general pages.
  const lastmod = kitDates.get(match[1]);
  if (!lastmod) throw new Error('Sitemap kit has no verified source date: ' + match[1]);
  return lastmod;
}
