#!/usr/bin/env node
// Diagnostic only: summarize npm's advisory JSON without modifying dependencies.
// Production advisories are blocked separately in CI; these diagnostics must be honest.
import { spawnSync } from 'node:child_process';
import { summarizeAuditReport } from './audit-report-core.mjs';

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
  let summary;
  try {
    summary = summarizeAuditReport(report);
  } catch (error) {
    hadAuditFailure = true;
    console.error(`Audit returned incomplete or inconsistent data (exit ${run.status}): ${error.message}`);
    continue;
  }
  const { totals, advisories } = summary;
  console.log(`Counts: critical=${totals.critical ?? 0}, high=${totals.high ?? 0}, moderate=${totals.moderate ?? 0}, low=${totals.low ?? 0}, total=${totals.total ?? '?'}`);
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
