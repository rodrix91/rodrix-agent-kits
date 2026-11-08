/**
 * Lightweight local "kit finder": tokenization + synonym expansion + BM25-style scoring.
 * Runs fully client-side; no network calls, no AI API.
 */
// Preserve reciprocal aliases for dotted filenames and framework names.
// Exact token expansion avoids broad substring matches for unrelated kits.
const SYN: Record<string, string[]> = {
  next: ['nextjs', 'next.js', 'react'], nextjs: ['next', 'next.js', 'react', 'web'], 'next.js': ['nextjs'], react: ['nextjs', 'web'], supabase: ['postgres', 'rls', 'auth'],
  saas: ['nextjs', 'supabase', 'auth', 'web'], auth: ['supabase', 'login', 'security'], login: ['auth'], db: ['database', 'postgres', 'sql'],
  database: ['postgres', 'sql', 'supabase'], postgres: ['sql', 'supabase', 'database'], security: ['rls', 'auth', 'review'],
  python: ['data', 'pandas'], pandas: ['python', 'data'], data: ['python', 'analytics', 'ml'], ml: ['python', 'machine', 'learning', 'data'],
  datos: ['data', 'python'], notebook: ['jupyter', 'python', 'data'], game: ['godot', 'gamedev'], juego: ['game', 'godot'], videojuego: ['game', 'godot'], godot: ['game', 'gdscript'], unity: ['game'],
  monorepo: ['pnpm', 'turborepo', 'typescript'], typescript: ['monorepo', 'ts', 'node'], ts: ['typescript'], pnpm: ['monorepo'],
  review: ['code', 'pr', 'diff'], revision: ['review'], pr: ['review', 'pull'], automation: ['n8n', 'workflow'], automatizar: ['automation', 'n8n'], automatizacion: ['automation', 'n8n'],
  leads: ['lead', 'n8n', 'form'], lead: ['leads'], form: ['webhook', 'lead'], formulario: ['form', 'lead'], crm: ['lead', 'n8n'], sheets: ['google', 'n8n'],
  espanol: ['spanish', 'es'], spanish: ['espanol'], claude: ['claude.md'], 'claude.md': ['claude'], cursor: ['rules'], codex: ['agents.md'], web: ['nextjs'], app: ['web'],
};
const STOP = new Set('a an and the for with of to in on my i is it un una el la los las de del con para mi y que en por with using build building want quiero hacer'.split(' '));
// Keep C++ and C# as distinct searchable terms. Other plus signs remain
// separators, so "Python+data" is still two words, not a single query.
export const tokenize = (s: string) => (s.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').match(/[\p{L}\p{N}.]+(?:\+\+|#)?/gu) ?? [])
  .map((w) => w.replace(/^\.+|\.+$/g, ''))
  .filter((w) => w.length > 1 && !STOP.has(w));

export interface Doc { slug: string; title: string; tool: string; text: string; [k: string]: unknown }
export function rank(query: string, docs: Doc[]) {
  const q = tokenize(query);
  if (!q.length || !docs.length) return [];
  const weights = new Map<string, number>();
  for (const w of q) {
    weights.set(w, Math.max(weights.get(w) ?? 0, 1));
    // Only expand explicitly defined synonyms. A plain object's inherited
    // "constructor" property is a function, not an iterable synonym list.
    const synonyms = Object.hasOwn(SYN, w) ? SYN[w] : [];
    for (const synonym of synonyms) {
      weights.set(synonym, Math.max(weights.get(synonym) ?? 0, 0.5));
    }
  }

  // Compute token frequencies and document frequencies once per corpus.
  // The previous implementation scanned every document for every term of
  // every result (quadratic in the size of the catalog).
  // A filename such as Next.js or CLAUDE.md should match both its complete
  // technical name and an exact short extension query (JS or MD). The card
  // library already supports this; keep the kit finder consistent without
  // allowing broad substring hits (for example, GO in Google).
  // Preserve C++ / C# as distinct tokens and avoid indexing one-letter
  // fragments as separate matchable terms.
  const tokenLists = docs.map((doc) => tokenize(doc.text).flatMap((term) => (
    term.includes('.') ? [term, ...term.split('.').filter((part) => part.length > 1)] : [term]
  )));
  const avgLength = tokenLists.reduce((sum, terms) => sum + terms.length, 0) / docs.length;
  const termCounts = tokenLists.map((terms) => {
    const counts = new Map<string, number>();
    for (const term of terms) counts.set(term, (counts.get(term) ?? 0) + 1);
    return counts;
  });
  const frequencies = new Map<string, number>();
  for (const counts of termCounts) {
    for (const term of counts.keys()) {
      if (weights.has(term)) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
    }
  }

  const weightedIdf = [...weights].map(([term, weight]) => {
    const df = frequencies.get(term) ?? 0;
    const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
    return { term, weight, idf };
  });
  // Query terms absent from every kit contribute no evidence and must not
  // shrink every relevant score. Long natural-language prompts can contain
  // many unmatched words; including their high IDF in this denominator made
  // a genuine exact technology match fall below the 0.08 result threshold.
  const max = weightedIdf.reduce((sum, { term, weight, idf }) =>
    sum + ((frequencies.get(term) ?? 0) > 0 ? weight * idf * 2.2 : 0), 0);
  const scored = docs.map((doc, i) => {
    let score = 0;
    for (const { term, weight, idf } of weightedIdf) {
      const frequency = termCounts[i].get(term) ?? 0;
      if (frequency) {
        score += weight * idf * ((frequency * 2.2) /
          (frequency + 1.2 * (0.25 + 0.75 * (tokenLists[i].length / avgLength))));
      }
    }
    return { doc, score: max ? Math.min(1, score / (max * 0.45)) : 0 };
  });
  const ranked = scored.filter((item) => item.score > 0.08).sort((a, b) => b.score - a.score);
  // Defend the visible suggestions against a duplicated catalog slug. The
  // published catalog is validated separately, but malformed in-memory data
  // must not use multiple recommendation slots for the same kit. Keep the
  // highest-scoring entry because ranking happens before deduplication.
  const seen = new Set<string>();
  return ranked.filter(({ doc }) => {
    if (seen.has(doc.slug)) return false;
    seen.add(doc.slug);
    return true;
  });
}
