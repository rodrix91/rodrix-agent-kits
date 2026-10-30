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
  review: ['code', 'pr', 'diff'], revisión: ['review'], pr: ['review', 'pull'], automation: ['n8n', 'workflow'], automatizar: ['automation', 'n8n'], automatización: ['automation', 'n8n'],
  leads: ['lead', 'n8n', 'form'], lead: ['leads'], form: ['webhook', 'lead'], formulario: ['form', 'lead'], crm: ['lead', 'n8n'], sheets: ['google', 'n8n'],
  español: ['spanish', 'es'], spanish: ['español'], claude: ['claude.md'], cursor: ['rules'], codex: ['agents.md'], web: ['nextjs'], app: ['web'],
};
const STOP = new Set('a an and the for with of to in on my i is it un una el la los las de del con para mi y que en por with using build building want quiero hacer'.split(' '));
export const tokenize = (s: string) => s.toLowerCase().normalize('NFKC').split(/[^\p{L}\p{N}.]+/u).map((w) => w.replace(/^\.+|\.+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w));

export interface Doc { slug: string; title: string; tool: string; text: string; [k: string]: unknown }
export function rank(query: string, docs: Doc[]) {
  const q = tokenize(query);
  if (!q.length) return [];
  const weights = new Map<string, number>();
  for (const w of q) { weights.set(w, Math.max(weights.get(w) ?? 0, 1)); for (const s of SYN[w] ?? []) weights.set(s, Math.max(weights.get(s) ?? 0, 0.5)); }
  const toks = docs.map((d) => tokenize(d.text));
  const avg = toks.reduce((a, t) => a + t.length, 0) / Math.max(1, toks.length);
  const N = docs.length;
  const scored = docs.map((doc, i) => {
    const tf = new Map<string, number>(); toks[i].forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    let score = 0, max = 0;
    for (const [term, w] of weights) {
      const df = toks.filter((t) => t.includes(term)).length;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      max += w * idf * 2.2;
      const f = tf.get(term) ?? 0;
      if (f) score += w * idf * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (toks[i].length / avg))));
    }
    return { doc, score: max ? Math.min(1, score / (max * 0.45)) : 0 };
  });
  return scored.filter((s) => s.score > 0.08).sort((a, b) => b.score - a.score);
}
