export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['en', 'es'];
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Build a base-aware, localized URL. path like '/kits/' */
export function url(path: string, lang: Lang = 'en') {
  const p = path.startsWith('/') ? path : '/' + path;
  return BASE + (lang === 'es' ? '/es' : '') + p;
}
/** Base-aware asset URL (no language prefix). */
export const asset = (p: string) => BASE + (p.startsWith('/') ? p : '/' + p);

export const t = {
  en: {
    nav: { kits: 'Kits', pricing: 'Pricing', sponsors: 'Sponsors', about: 'About', changelog: 'Changelog' },
    skip: 'Skip to content', switchLang: 'Español', switchLangCode: 'es', theme: 'Toggle color theme', menu: 'Menu',
    cta: { browse: 'Browse free kits', club: 'Join Kit Club', soon: 'Coming soon · get notified', buy: 'Buy bundle', copy: 'Copy file', copied: 'Copied', download: 'Download', view: 'View kit' },
    hero: {
      eyebrow: 'Open library · EN / ES',
      title: ['Agent kits that', 'actually ship.'],
      sub: 'Tested rules, CLAUDE.md / AGENTS.md files, agent skills and n8n flows. Copy one in 10 seconds and stop re-explaining your stack to your AI.',
    },
    finder: { title: 'Kit finder', label: 'Describe what you are building', placeholder: 'e.g. a SaaS with Next.js and Supabase auth', go: 'Find kits', note: 'Runs in your browser with local keyword + synonym matching. No AI API, nothing is sent anywhere.', none: 'No close match yet. Try naming your tools (Next.js, Python, Godot, n8n…).', results: 'Best matches' },
    how: { title: 'How it works', steps: [
      ['Pick a kit', 'Search by tool, stack or language. Every kit says exactly what it covers and how it was checked.'],
      ['Drop it in your repo', 'Copy the file to the path shown (e.g. .cursor/rules/ or AGENTS.md). No installs, no lock-in.'],
      ['Your agent levels up', 'Fewer deprecated APIs, fewer leaked keys, fewer "please use pnpm" reminders.'],
    ]},
    featured: 'Featured kits', allKits: 'See all kits',
    proof: { title: 'Built in public, honestly', items: [
      ['Every kit is real', 'Open the file and read it before you use it. Free kits are complete, not teasers.'],
      ['Checked, not hyped', 'Each kit lists how it was verified: which docs, which versions.'],
      ['Bilingual from day one', 'English and Spanish, written by a data science manager who uses these daily.'],
    ], note: 'We just launched, so there are no testimonials yet. We will not invent any.' },
    library: { title: 'Kit library', sub: 'Search every kit. Filter by tool, category and language.', search: 'Search kits', all: 'All', tool: 'Tool', category: 'Category', language: 'Language', tier: 'Access', free: 'Free', paid: 'Bundle', count: (n: number) => `${n} kit${n === 1 ? '' : 's'}`, empty: 'No kits match. Clear a filter or request a kit via the newsletter.' },
    kit: { inside: "What's inside", file: 'File preview', install: 'Install path', tested: 'How it was checked', updated: 'Added', related: 'Related kits', freeLabel: 'Free · MIT', paidLabel: 'Bundle preview', paidNote: 'This preview is usable on its own. The full bundle adds the files listed above.', back: 'All kits' },
    news: { title: 'One useful kit, every week.', sub: 'New kits, changelog and agent-workflow notes. No spam, unsubscribe anytime.', email: 'Email address', submit: 'Subscribe', soon: 'Newsletter opens soon. Follow on X for launch.', ok: 'Check your inbox to confirm.', err: 'Something went wrong. Try again later.' },
    footer: { tagline: 'Tested AI agent kits for builders.', product: 'Product', company: 'Company', legal: 'Legal', privacy: 'Privacy', terms: 'Terms', rss: 'RSS', made: 'Static site · no tracking cookies' },
  },
  es: {
    nav: { kits: 'Kits', pricing: 'Precios', sponsors: 'Patrocinio', about: 'Nosotros', changelog: 'Novedades' },
    skip: 'Saltar al contenido', switchLang: 'English', switchLangCode: 'en', theme: 'Cambiar tema de color', menu: 'Menú',
    cta: { browse: 'Ver kits gratis', club: 'Unirme al Kit Club', soon: 'Muy pronto · avísame', buy: 'Comprar bundle', copy: 'Copiar archivo', copied: 'Copiado', download: 'Descargar', view: 'Ver kit' },
    hero: {
      eyebrow: 'Biblioteca abierta · EN / ES',
      title: ['Kits para agentes', 'que sí funcionan.'],
      sub: 'Reglas probadas, archivos CLAUDE.md / AGENTS.md, skills para agentes y flujos n8n. Cópialos en 10 segundos y deja de explicarle tu stack a tu IA.',
    },
    finder: { title: 'Buscador de kits', label: 'Describe lo que estás construyendo', placeholder: 'ej. un SaaS con Next.js y auth de Supabase', go: 'Buscar kits', note: 'Funciona en tu navegador con coincidencia local de palabras y sinónimos. Sin API de IA, no se envía nada.', none: 'Aún no hay coincidencias. Prueba nombrando tus herramientas (Next.js, Python, Godot, n8n…).', results: 'Mejores coincidencias' },
    how: { title: 'Cómo funciona', steps: [
      ['Elige un kit', 'Busca por herramienta, stack o idioma. Cada kit dice qué cubre y cómo se verificó.'],
      ['Ponlo en tu repo', 'Copia el archivo a la ruta indicada (ej. .cursor/rules/ o AGENTS.md). Sin instalar nada.'],
      ['Tu agente mejora', 'Menos APIs obsoletas, menos claves filtradas, menos "usa pnpm, por favor".'],
    ]},
    featured: 'Kits destacados', allKits: 'Ver todos los kits',
    proof: { title: 'Construido en público, con honestidad', items: [
      ['Cada kit es real', 'Abre el archivo y léelo antes de usarlo. Los kits gratis están completos.'],
      ['Verificado, no inflado', 'Cada kit indica cómo se comprobó: qué docs y qué versiones.'],
      ['Bilingüe desde el día uno', 'Inglés y español, escrito por un gerente de ciencia de datos que los usa a diario.'],
    ], note: 'Acabamos de lanzar, así que aún no hay testimonios. No vamos a inventarlos.' },
    library: { title: 'Biblioteca de kits', sub: 'Busca entre todos los kits. Filtra por herramienta, categoría e idioma.', search: 'Buscar kits', all: 'Todos', tool: 'Herramienta', category: 'Categoría', language: 'Idioma', tier: 'Acceso', free: 'Gratis', paid: 'Bundle', count: (n: number) => `${n} kit${n === 1 ? '' : 's'}`, empty: 'Ningún kit coincide. Quita un filtro o pide un kit en el newsletter.' },
    kit: { inside: 'Qué incluye', file: 'Vista previa del archivo', install: 'Ruta de instalación', tested: 'Cómo se verificó', updated: 'Agregado', related: 'Kits relacionados', freeLabel: 'Gratis · MIT', paidLabel: 'Vista previa del bundle', paidNote: 'Esta vista previa ya sirve por sí sola. El bundle completo agrega los archivos de arriba.', back: 'Todos los kits' },
    news: { title: 'Un kit útil, cada semana.', sub: 'Kits nuevos, novedades y notas sobre flujos con agentes. Sin spam, date de baja cuando quieras.', email: 'Correo electrónico', submit: 'Suscribirme', soon: 'El newsletter abre pronto. Síguenos en X para el lanzamiento.', ok: 'Revisa tu correo para confirmar.', err: 'Algo salió mal. Inténtalo más tarde.' },
    footer: { tagline: 'Kits probados para agentes de IA.', product: 'Producto', company: 'Empresa', legal: 'Legal', privacy: 'Privacidad', terms: 'Términos', rss: 'RSS', made: 'Sitio estático · sin cookies de rastreo' },
  },
} as const;
