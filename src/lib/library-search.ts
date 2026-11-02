// Shared, network-free matching for the bilingual kit library.
// Apply the same Unicode normalization to visitor queries and card text.
export function foldSearchText(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
}

export function searchTerms(query: string): string[] {
  // Visitors also omit spaces around "+" in queries like
  // "n8n+workflow" and "Next.js+C#". Match terms instead of splitting so
  // single plus signs separate words while C++, C# and dotted filenames
  // retain their meaningful punctuation. Hyphens/underscores still split.
  return (foldSearchText(query).match(/[\p{L}\p{N}.]+(?:\+\+|#)?/gu) ?? [])
    .map((term) => term.replace(/^\.+|\.+$/gu, ''))
    .filter((term) => /[\p{L}\p{N}]/u.test(term));
}


/** A nonblank query with no searchable words must not match every card. */
export function hasUnsearchableQuery(query: string, terms: readonly string[]): boolean {
  return query.trim().length > 0 && terms.length === 0;
}

export function matchesSearch(text: string, terms: readonly string[]): boolean {
  const normalized = foldSearchText(text);
  return terms.every((term) => normalized.includes(term));
}
