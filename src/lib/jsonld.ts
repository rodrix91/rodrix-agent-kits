/** Serialize JSON-LD without exposing HTML script terminators.
 *
 * JSON.stringify alone is valid JSON but not safe inside a raw <script>:
 * a title containing "</script>" ends the element early. Escaping these
 * characters as JSON Unicode sequences preserves the parsed object exactly.
 */
const INLINE_JSON_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => INLINE_JSON_ESCAPES[char]);
}
