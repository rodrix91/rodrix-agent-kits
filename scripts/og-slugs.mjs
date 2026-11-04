// Keep long unbroken identifiers within the OG SVG text width.
// Iterate Unicode code points to avoid splitting emoji surrogate pairs.
export function wrapOgText(text, maxChars) {
  if (typeof text !== 'string') throw new TypeError('OG text must be a string');
  if (!Number.isSafeInteger(maxChars) || maxChars < 1) {
    throw new RangeError('OG line width must be a positive safe integer');
  }
  const lines = [];
  let line = '';
  let lineLength = 0;
  for (const word of text.trim().split(/\s+/u)) {
    if (!word) continue;
    const characters = Array.from(word);
    let position = 0;
    while (position < characters.length) {
      const space = line ? 1 : 0;
      const remaining = maxChars - lineLength - space;
      if (remaining <= 0 || (line && characters.length - position > remaining)) {
        lines.push(line);
        line = '';
        lineLength = 0;
        continue;
      }
      const length = Math.min(remaining, characters.length - position);
      const chunk = characters.slice(position, position + length).join('');
      if (line) { line += ' '; lineLength++; }
      line += chunk;
      lineLength += length;
      position += length;
      if (position < characters.length) {
        lines.push(line);
        line = '';
        lineLength = 0;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Validate IDs before using catalog records as local OG image filenames.
// Search JSON is generated from content, but build output is still untrusted data.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Windows reserves these device basenames even when followed by .png.
// Keep the complete ASCII filename (slug + '.png') within 255 bytes.
const WINDOWS_DEVICE = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/;
const MAX_SLUG_LENGTH = 255 - '.png'.length;

export function validatedOgKits(kits) {
  if (!Array.isArray(kits)) throw new TypeError('OG image catalog must be an array');
  const seen = new Set(['default']); // dist/og/default.png is reserved.
  for (const kit of kits) {
    const slug = kit?.slug;
    if (typeof slug !== 'string' || !SLUG.test(slug)
      || slug.length > MAX_SLUG_LENGTH || WINDOWS_DEVICE.test(slug)) {
      throw new Error('OG image slug must be a lowercase URL-safe filename');
    }
    if (seen.has(slug)) {
      throw new Error(`Duplicate or reserved OG image slug: ${slug}`);
    }
    seen.add(slug);
  }
  return kits;
}
