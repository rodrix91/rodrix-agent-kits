/** Escape RSS text as XML 1.0 while retaining valid Unicode.
 *
 * Escaping markup alone is insufficient: XML 1.0 rejects most C0 controls,
 * U+FFFE/U+FFFF and isolated UTF-16 surrogates. Content collection schemas
 * admit arbitrary strings, so an accidental control in a translated title
 * or summary must not invalidate the entire bilingual feed.
 */
const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeXmlText(value: string): string {
  let result = '';
  // for...of walks Unicode code points, preserving valid emoji surrogate
  // pairs while exposing lone surrogates as invalid scalars.
  for (const scalar of value) {
    const codePoint = scalar.codePointAt(0)!;
    const permitted = codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d
      || (codePoint >= 0x20 && codePoint <= 0xd7ff)
      || (codePoint >= 0xe000 && codePoint <= 0xfffd)
      || (codePoint >= 0x10000 && codePoint <= 0x10ffff);
    result += permitted ? (XML_ENTITIES[scalar] ?? scalar) : '\uFFFD';
  }
  return result;
}
