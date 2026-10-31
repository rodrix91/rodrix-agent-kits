// Run local Lighthouse checks with cleanup on failures and invalid configuration.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'node:fs';
import { serve } from './serve.mjs';
import { runLighthouse } from './lighthouse-runner.mjs';

await runLighthouse({
  serve,
  launchChrome: chromeLauncher.launch,
  audit: lighthouse,
  save: (report) => writeFileSync('lighthouse/scores.json', JSON.stringify(report, null, 2)),
});
