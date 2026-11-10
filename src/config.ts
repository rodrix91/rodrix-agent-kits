/**
 * ONE place for every money / signup link.
 * TODO(Rodrigo): create each product in Gumroad, then paste its URL here.
 * While a value is empty the site shows an honest "Coming soon — get notified" button instead of a broken buy link.
 */
export const BRAND = {
  name: 'Rodrix Agent Kits',
  short: 'Rodrix',
  x: 'https://x.com/RODRX_NOVA',
  github: 'https://github.com/rodrix91/rodrix-agent-kits',
  email: 'rodrixlabs@mail.grokbot.com', // public support/contact email (Rodrix Labs)
};

/**
 * Agent handoff kit (F-SCO-7): true once its files are uploaded to the Gumroad Full-stack Pro
 * and Kit Club products. While false the site says "Coming to Full-stack Pro & Kit Club" and
 * never claims buyers get it today. Flip to true (one change) after the upload.
 */
export const HANDOFF_IN_BUNDLE: boolean = typeof process !== 'undefined' && process.env?.HANDOFF_IN_BUNDLE_TEST ? process.env.HANDOFF_IN_BUNDLE_TEST === 'true' : true; // the flag; env var is only for the both-states test
/** Paid kits whose bundle files are not on Gumroad yet (derived from the flags above). */
export const BUNDLE_PENDING_KITS: string[] = HANDOFF_IN_BUNDLE ? [] : ['agent-handoff-kit'];

export const GUMROAD = {
  /** Kit Club membership, $7/month recurring. TODO: e.g. 'https://rodrix.gumroad.com/l/kit-club' */
  kitClub: 'https://rodrix91.gumroad.com/l/kit-club',
  /** Paid bundles keyed by kit `product` field. TODO: fill after creating products. */
  products: {
    'fullstack-pro-bundle': 'https://rodrix91.gumroad.com/l/full-stack-pro',
    'agent-skills-pack': 'https://rodrix91.gumroad.com/l/agent-skills-pack',
    'n8n-automation-pack': 'https://rodrix91.gumroad.com/l/n8n-automation-pack',
  } as Record<string, string>,
  /** Use Gumroad's free overlay checkout (gumroad.js) when links exist. */
  overlay: true,
};

/**
 * Whop: secondary Kit Club checkout (F-WHOP-1, Steve 2026-11-09). Plan plan_wl0RBfMmENiah = $7/month,
 * same price as PRICES.kitClubMonthly (checked read-only on whop.com 2026-11-09). Gumroad stays primary.
 * Empty = no Whop link rendered.
 */
export const WHOP = { kitClub: 'https://whop.com/checkout/plan_wl0RBfMmENiah' };

/**
 * Free kits delivered after a newsletter signup (F-W45-3). The kit page shows the Buttondown form
 * instead of the file; submitting opens Buttondown (confirm there) and sends this tab to the
 * noindex thanks page, which has the download. Empty list = every free kit is downloadable directly.
 */
export const SIGNUP_GATED_KITS: string[] = ['agent-secrets-safety-pack'];
export const thanksPath = (kitId: string) => `/kits/${kitId}/thanks/`;

export const PAYHIP = {
  /** Optional mirror store. TODO: e.g. 'https://payhip.com/rodrix' */
  store: '',
};

/** Search engine verification tokens (HTML-tag method). Empty = no tag emitted. */
export const GOOGLE_SITE_VERIFICATION = 'ZtPoEPg8NinMyCsJ78acEyxd46AO3bJxT2z6dfDGVHA';
export const BING_SITE_VERIFICATION = '';

/**
 * GoatCounter page-view counting (F-W45-2, approved by Steve 2026-11-02; site code 2026-11-06).
 * No-JS image pixel only: no script, no cookies, no CSP change (img-src already allows https:).
 * Empty code = no pixel emitted.
 */
export const GOATCOUNTER = { code: 'launchlatam' };
export const goatcounterPixel = (path: string) =>
  GOATCOUNTER.code ? `https://${GOATCOUNTER.code}.goatcounter.com/count?p=${encodeURIComponent(path)}` : '';

export const NEWSLETTER = {
  /**
   * Buttondown free account `rodrixlabs` (Steve, 2026-11-02). Plain POST form, field `email`.
   * Empty action = 'opens soon' fallback (RSS + X) renders instead of a live form.
   */
  action: 'https://buttondown.com/api/emails/embed-subscribe/rodrixlabs',
  publicPage: 'https://buttondown.com/rodrixlabs',
  emailField: 'email',
};

export const PRICES = { kitClubMonthly: 7, bundleMin: 9, bundleMax: 29 };
