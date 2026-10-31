// Shared, network-free matching for the bilingual kit library.
// Apply the same Unicode normalization to visitor queries and card text.
export function foldSearchText(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
}

export function searchTerms(query: string): string[] {
  return foldSearchText(query).trim().split(/\s+/u).filter(Boolean);
}

export function matchesSearch(text: string, terms: readonly string[]): boolean {
  const normalized = foldSearchText(text);
  return terms.every((term) => normalized.includes(term));
}
