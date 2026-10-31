// Lifecycle and input validation for the local Lighthouse check.
// Dependencies are injected so failure paths can be tested without Chrome.
const DEFAULT_PAGES = '/,/kits/,/kits/nextjs-supabase-cursor-rules/,/pricing/,/es/';

export function selectLighthouseTargets(env = process.env) {
  const pages = (env.LH_PAGES ?? DEFAULT_PAGES).split(',');
  const formFactors = (env.LH_FORM_FACTORS ?? 'mobile,desktop').split(',');

  if (!pages.length || pages.some((page) => !/^\/(?!\/)[A-Za-z0-9/_-]*$/.test(page))) {
    throw new Error('LH_PAGES must contain comma-separated local absolute paths starting with /');
  }
  if (!formFactors.length || formFactors.some((mode) => !['mobile', 'desktop'].includes(mode))) {
    throw new Error('LH_FORM_FACTORS must contain mobile and/or desktop');
  }
  return { pages, formFactors };
}

function desktopConfig(formFactor) {
  if (formFactor !== 'desktop') return undefined;
  return {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false,
      },
      throttlingMethod: 'simulate',
      throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
    },
  };
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

export async function runLighthouse({
  serve, launchChrome, audit, save, env = process.env, log = console.log,
  port = 4397, base = '/rodrix-agent-kits',
}) {
  // Reject invalid configuration before opening a port or starting Chrome.
  const { pages, formFactors } = selectLighthouseTargets(env);
  let server;
  let chrome;
  let originalError;
  try {
    server = await serve(port);
    chrome = await launchChrome({
      chromePath: env.CHROME_PATH || '/usr/bin/google-chrome',
      chromeFlags: ['--headless=new', '--no-sandbox'],
    });

    const rows = [];
    for (const formFactor of formFactors) {
      for (const page of pages) {
        const result = await audit(
          'http://localhost:' + port + base + page,
          { port: chrome.port, output: 'json', logLevel: 'error' },
          desktopConfig(formFactor),
        );
        const categories = result?.lhr?.categories;
        // Missing or malformed Lighthouse results must never be published as
        // scores: JSON.stringify would silently convert NaN/Infinity to null.
        const score = (key) => {
          const value = categories?.[key]?.score;
          if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
            throw new Error(`Invalid Lighthouse ${key} score for ${formFactor} ${page}`);
          }
          return Math.round(value * 100);
        };
        const row = {
          formFactor, page,
          performance: score('performance'),
          accessibility: score('accessibility'),
          bestPractices: score('best-practices'),
          seo: score('seo'),
        };
        rows.push(row);
        log(
          formFactor.padEnd(8), page.padEnd(42),
          row.performance, row.accessibility, row.bestPractices, row.seo,
        );
      }
    }

    await save({
      date: new Date().toISOString(),
      note: 'Local static server, simulated throttling (Lighthouse defaults). SEO measured on localhost.',
      rows,
    });
    return rows;
  } catch (error) {
    originalError = error;
    throw error;
  } finally {
    // Both resources must be cleaned up even if an audit or cleanup fails.
    const cleanup = await Promise.allSettled([
      Promise.resolve().then(() => chrome?.kill()),
      Promise.resolve().then(() => server && closeServer(server)),
    ]);
    const errors = cleanup
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
    if (errors.length) {
      throw new AggregateError(
        originalError ? [originalError, ...errors] : errors,
        'Lighthouse run failed to release all resources',
      );
    }
  }
}
