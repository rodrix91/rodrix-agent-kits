#!/usr/bin/env node
// Diagnostic only: summarize npm's advisory JSON without modifying dependencies.
// Vulnerabilities do not block site quality CI; audit transport/parser failures are shown.
import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const checks = [
  { name: 'Production dependency tree', args: ['audit', '--json', '--omit=dev'] },
  { name: 'Full dependency tree (includes development tooling)', args: ['audit', '--json'] },
];
let hadAuditFailure = false;

for (const check of checks) {
  console.log(`\n## ${check.name}`);
  const run = spawnSync(npm, check.args, {
    encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024,
  });
  if (run.error) {
    hadAuditFailure = true;
    console.error(`Audit could not run: ${run.error.message}`);
    continue;
  }
  let report;
  try {
    report = JSON.parse(run.stdout);
  } catch {
    hadAuditFailure = true;
    console.error(`Audit returned non-JSON output (exit ${run.status}).`);
    continue;
  }
  if (!report || typeof report !== 'object' || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
    hadAuditFailure = true;
    console.error(`Audit returned an incomplete result (exit ${run.status}): ${JSON.stringify(report.error ?? 'missing vulnerability metadata')}`);
    continue;
  }
  const totals = report.metadata.vulnerabilities;
  console.log(`Counts: critical=${totals.critical ?? 0}, high=${totals.high ?? 0}, moderate=${totals.moderate ?? 0}, low=${totals.low ?? 0}, total=${totals.total ?? '?'}`);
  const advisories = Object.entries(report.vulnerabilities).sort(([a], [b]) => a.localeCompare(b));
  for (const [name, advisory] of advisories) {
    const fix = advisory.fixAvailable === false ? 'no suggested fix' : advisory.fixAvailable === true ? 'fix suggested' :
      advisory.fixAvailable && typeof advisory.fixAvailable === 'object' ? `fix: ${advisory.fixAvailable.name}@${advisory.fixAvailable.version}${advisory.fixAvailable.isSemVerMajor ? ' (major)' : ''}` : 'fix status unknown';
    console.log(`  ${name}: ${advisory.severity ?? 'unknown'}, ${advisory.isDirect ? 'direct' : 'transitive'}, ${fix}`);
  }
  if (![0, 1].includes(run.status)) {
    hadAuditFailure = true;
    console.error(`npm audit exited ${run.status}; findings may be incomplete.`);
  }
}

console.log('\nAdvisory-only report. Findings are NOT resolved by this workflow. Verify exposure and remediation before upgrading.');
if (hadAuditFailure) {
  console.error('At least one audit could not be verified. Re-run when npm registry access is restored.');
  process.exitCode = 1;
}
