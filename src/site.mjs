// Deployment target. Change SITE/BASE when a custom domain is added (then BASE = '/').
export const SITE = process.env.SITE_URL || 'https://rodrix91.github.io';
export const BASE = process.env.SITE_BASE ?? '/rodrix-agent-kits';
