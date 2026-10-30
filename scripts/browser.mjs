import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
// Use Playwright's browser if installed, otherwise system Chrome.
export const launch = () => chromium.launch({ executablePath: process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined) });
