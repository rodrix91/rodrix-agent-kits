// Validate npm audit's structured counts before reporting vulnerabilities.
// An incomplete audit response must never be presented as a clean result.
const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];

export function summarizeAuditReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report) || report.error) {
    throw new Error('npm audit did not return a valid report object');
  }
  const totals = report.metadata?.vulnerabilities;
  const vulnerabilities = report.vulnerabilities;
  if (!totals || typeof totals !== 'object' || Array.isArray(totals)
      || !vulnerabilities || typeof vulnerabilities !== 'object' || Array.isArray(vulnerabilities)) {
    throw new Error('npm audit is missing vulnerability metadata or advisory details');
  }

  const normalized = {};
  for (const severity of SEVERITIES) {
    // npm may omit an optional zero-valued informational category.
    const value = severity === 'info' && totals.info === undefined ? 0 : totals[severity];
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('npm audit returned an invalid ' + severity + ' count');
    }
    normalized[severity] = value;
  }
  if (!Number.isSafeInteger(totals.total) || totals.total < 0) {
    throw new Error('npm audit returned an invalid total count');
  }
  const sum = SEVERITIES.reduce((count, severity) => count + normalized[severity], 0);
  if (!Number.isSafeInteger(sum) || sum !== totals.total) {
    throw new Error('npm audit severity counts do not match its reported total');
  }

  const advisories = Object.entries(vulnerabilities).sort(([a], [b]) => a.localeCompare(b));
  // An audit containing advisories cannot be "clean", and a positive
  // vulnerability total without affected-package details is incomplete.
  if ((totals.total === 0) !== (advisories.length === 0)) {
    throw new Error('npm audit advisory details contradict the reported vulnerability total');
  }
  for (const [name, advisory] of advisories) {
    if (!advisory || typeof advisory !== 'object' || Array.isArray(advisory)) {
      throw new Error('npm audit returned malformed advisory details for ' + name);
    }
    if (!SEVERITIES.includes(advisory.severity) || normalized[advisory.severity] === 0) {
      throw new Error('npm audit advisory severity contradicts metadata for ' + name);
    }
  }
  return { totals: { ...normalized, total: totals.total }, advisories };
}
