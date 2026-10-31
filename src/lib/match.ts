/**
 * Lightweight local "kit finder": tokenization + synonym expansion + BM25-style scoring.
 * Runs fully client-side; no network calls, no AI API.
 */
const SYN: Record<string, string[]> = {
  next: ['nextjs', 'next.js', 'react'], nextjs: ['next', 'react', 'web'], react: ['nextjs', 'web'], supabase: ['postgres', 'rls', 'auth'],
  saas: ['nextjs', 'supabase', 'auth', 'web'], auth: ['supabase', 'login', 'security'], login: ['auth'], db: ['database', 'postgres', 'sql'],
  database: ['postgres', 'sql', 'supabase'], postgres: ['sql', 'supabase', 'database'], security: ['rls', 'auth', 'review'],
  python: ['data', 'pandas'], pandas: ['python', 'data'], data: ['python', 'analytics', 'ml'], ml: ['python', 'machine', 'learning', 'data'],
  datos: ['data', 'python'], notebook: ['jupyter', 'python', 'data'], game: ['godot', 'gamedev'], juego: ['game', 'godot'], videojuego: ['game', 'godot'], godot: ['game', 'gdscript'], unity: ['game'],
  monorepo: ['pnpm', 'turborepo', 'typescript'], typescript: ['monorepo', 'ts', 'node'], ts: ['typescript'], pnpm: ['monorepo'],
  review: ['code', 'pr', 'diff'], revision: ['review'], pr: ['review', 'pull'], automation: ['n8n', 'workflow'], automatizar: ['automation', 'n8n'], automatizacion: ['automation', 'n8n'],
  leads: ['lead', 'n8n', 'form'], lead: ['leads'], form: ['webhook', 'lead'], formulario: ['form', 'lead'], crm: ['lead', 'n8n'], sheets: ['google', 'n8n'],
  espanol: ['spanish', 'es'], spanish: ['espanol'], claude: ['claude.md'], cursor: ['rules'], codex: ['agents.md'], web: ['nextjs'], app: ['web'],
};
const STOP = new Set('a an and the for with of to in on my i is it un una el la los las de del con para mi y que en por with using build building want quiero hacer'.split(' '));
export const tokenize = (s: string) => s.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').split(/[^\p{L}\p{N}.]+/u).map((w) => w.replace(/^\.+|\.+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w));

export interface Doc { slug: string; title: string; tool: string; text: string; [k: string]: unknown }
export function rank(query: string, docs: Doc[]) {
  const q = tokenize(query);
  if (!q.length || !docs.length) return [];
  const weights = new Map<string, number>();
  for (const w of q) {
    weights.set(w, Math.max(weights.get(w) ?? 0, 1));
    for (const synonym of SYN[w] ?? []) {
      weights.set(synonym, Math.max(weights.get(synonym) ?? 0, 0.5));
    }
  }

  // Compute token frequencies and document frequencies once per corpus.
  // The previous implementation scanned every document for every term of
  // every result (quadratic in the size of the catalog).
  const tokenLists = docs.map((doc) => tokenize(doc.text));
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
  const max = weightedIdf.reduce((sum, { weight, idf }) => sum + weight * idf * 2.2, 0);
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
  return scored.filter((item) => item.score > 0.08).sort((a, b) => b.score - a.score);
}
