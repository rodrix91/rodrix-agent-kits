// Shared, network-free matching for the bilingual kit library.
// Apply the same Unicode normalization to visitor queries and card text.
export function foldSearchText(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
}

export function searchTerms(query: string): string[] {
  // Visitors write "n8n, workflow" and "¿código, español?" as naturally
  // as space-separated queries. Treat hyphens and underscores as word
  // separators while retaining meaningful symbols in CLAUDE.md, C++, C# and Next.js.
  return foldSearchText(query)
    .trim()
    .split(/[^\p{L}\p{N}.+#]+/u)
    .map((term) => term.replace(/^\.+|\.+$/gu, ''))
    .filter((term) => /[\p{L}\p{N}]/u.test(term));
}

export function matchesSearch(text: string, terms: readonly string[]): boolean {
  const normalized = foldSearchText(text);
  return terms.every((term) => normalized.includes(term));
}
