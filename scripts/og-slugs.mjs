// Validate IDs before using catalog records as local OG image filenames.
// Search JSON is generated from content, but build output is still untrusted data.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validatedOgKits(kits) {
  if (!Array.isArray(kits)) throw new TypeError('OG image catalog must be an array');
  const seen = new Set(['default']); // dist/og/default.png is reserved.
  for (const kit of kits) {
    const slug = kit?.slug;
    if (typeof slug !== 'string' || !SLUG.test(slug)) {
      throw new Error('OG image slug must be a lowercase URL-safe filename');
    }
    if (seen.has(slug)) {
      throw new Error(`Duplicate or reserved OG image slug: ${slug}`);
    }
    seen.add(slug);
  }
  return kits;
}
