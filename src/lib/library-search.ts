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
  // Short queries such as "PR", "AI", "Go" or "C" should match complete
  // technical tokens, not fragments of "productivity", "paid" or "Google".
  // Longer terms retain the existing forgiving substring search.
  // A dotted technical name stays searchable as a whole, but short queries
  // may also match complete dot-delimited components (JS in Next.js, MD in
  // CLAUDE.md). Never split C++ or C# into the ambiguous short token "c".
  const shortTokens = terms.some((term) => term.length <= 2)
    ? new Set(searchTerms(text).flatMap((token) => token.includes('.')
      ? [token, ...token.split('.').filter(Boolean)]
      : [token]))
    : null;
  return terms.every((term) => term.length <= 2
    ? shortTokens!.has(term)
    : normalized.includes(term));
}
