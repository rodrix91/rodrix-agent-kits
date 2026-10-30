/**
 * ONE place for every money / signup link.
 * TODO(Rodrigo): create each product in Gumroad, then paste its URL here.
 * While a value is empty the site shows an honest "Coming soon — get notified" button instead of a broken buy link.
 */
export const BRAND = {
  name: 'Rodrix Agent Kits',
  short: 'Rodrix',
  x: 'https://x.com/rodrix91', // TODO(Rodrigo): confirm the X handle to show
  github: 'https://github.com/rodrix91/rodrix-agent-kits',
  email: '', // TODO(Rodrigo): public contact email (optional)
};

export const GUMROAD = {
  /** Kit Club membership, $7/month recurring. TODO: e.g. 'https://rodrix.gumroad.com/l/kit-club' */
  kitClub: '',
  /** Paid bundles keyed by kit `product` field. TODO: fill after creating products. */
  products: {
    'fullstack-pro-bundle': '',
    'agent-skills-pack': '',
    'n8n-automation-pack': '',
  } as Record<string, string>,
  /** Use Gumroad's free overlay checkout (gumroad.js) when links exist. */
  overlay: true,
};

export const PAYHIP = {
  /** Optional mirror store. TODO: e.g. 'https://payhip.com/rodrix' */
  store: '',
};

export const NEWSLETTER = {
  /**
   * Provider-agnostic: any endpoint that accepts a POST form with an `email` field.
   * Recommended free provider: Buttondown (free up to 100 subs) -> 'https://buttondown.com/api/emails/embed-subscribe/<username>'
   * Alternatives: MailerLite free, Kit (ConvertKit) free form action URL.
   * TODO(Rodrigo): pick a provider and paste the form action URL.
   */
  action: '',
  emailField: 'email',
};

export const PRICES = { kitClubMonthly: 7, bundleMin: 9, bundleMax: 29 };
