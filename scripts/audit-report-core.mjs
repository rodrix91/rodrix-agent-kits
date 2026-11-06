// Validate npm audit's structured counts before reporting vulnerabilities.
// An incomplete audit response must never be presented as a clean result.
const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];

// Avoid forged workflow annotations and excessive output from npm JSON.
export function auditLogLabel(value) {
  const raw = String(value);
  const clipped = raw.length > 160 ? raw.slice(0, 160) + '…[truncated]' : raw;
  return JSON.stringify(clipped).replace(
    /[\u007f-\u009f\u2028\u2029\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu,
    (char) => '\\u' + char.codePointAt(0).toString(16).padStart(4, '0'),
  );
}




 // npm's advisory scope is a boolean, not a truthiness test. Missing or
// malformed fields must not be advertised as transitive dependencies.
export function describeAuditScope(value) {
  if (value === true) return 'direct';
  if (value === false) return 'transitive';
  return 'scope unknown';
}

// Fix data can be a boolean or a package/version record. Unknown or malformed
// objects must not be presented as an actionable upgrade recommendation.
export function describeAuditFix(value) {
  if (value === false) return 'no suggested fix';
  if (value === true) return 'fix suggested';
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || typeof value.name !== 'string' || !value.name.trim()
      || typeof value.version !== 'string' || !value.version.trim()
      || typeof value.isSemVerMajor !== 'boolean') {
    return 'fix status unknown';
  }
  return `fix: ${auditLogLabel(value.name)}@${auditLogLabel(value.version)}${value.isSemVerMajor ? ' (major)' : ''}`;
}

export function summarizeAuditReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)
      || Object.hasOwn(report, 'error')) {
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
  const detailCounts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
  for (const [name, advisory] of advisories) {
    if (!advisory || typeof advisory !== 'object' || Array.isArray(advisory)) {
      throw new Error('npm audit returned malformed advisory details for ' + auditLogLabel(name));
    }
    if (!SEVERITIES.includes(advisory.severity) || normalized[advisory.severity] === 0) {
      throw new Error('npm audit advisory severity contradicts metadata for ' + auditLogLabel(name));
    }
    detailCounts[advisory.severity] += 1;
  }
  // npm audit reports affected-package counts per severity. A truncated or
  // severity-shifted list can have plausible totals while hiding the actual
  // affected packages; never print such an inconsistent diagnostic.
  if (advisories.length !== totals.total) {
    throw new Error('npm audit advisory count does not match the reported total');
  }
  for (const severity of SEVERITIES) {
    if (detailCounts[severity] !== normalized[severity]) {
      throw new Error('npm audit advisory severity counts do not match metadata for ' + severity);
    }
  }
  return { totals: { ...normalized, total: totals.total }, advisories };
}
