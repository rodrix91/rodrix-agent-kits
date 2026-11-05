import test from 'node:test';
import assert from 'node:assert/strict';
import { auditLogLabel, summarizeAuditReport } from './audit-report-core.mjs';

const counts = { info: 0, low: 1, moderate: 1, high: 0, critical: 0, total: 2 };
const report = () => ({
  metadata: { vulnerabilities: { ...counts } },
  vulnerabilities: {
    zeta: { severity: 'low', isDirect: false, fixAvailable: false },
    alpha: { severity: 'moderate', isDirect: true, fixAvailable: true },
  },
});

test('accepts valid totals and sorts advisory names consistently', () => {
  const result = summarizeAuditReport(report());
  assert.deepEqual(result.totals, counts);
  assert.deepEqual(result.advisories.map(([name]) => name), ['alpha', 'zeta']);
});

test('rejects any npm audit error envelope, including falsy error payloads', () => {
  // npm may include partial counts alongside an error; even a falsy error
  // value means the response is not a verified audit report.
  const zeroFindings = {
    metadata: {
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
    },
    vulnerabilities: {},
  };
  for (const error of [null, false, 0, '', {}, { code: 'EAUDITNOLOCK' }]) {
    assert.throws(
      () => summarizeAuditReport({ ...zeroFindings, error }),
      /valid report object/,
      String(error),
    );
    assert.throws(
      () => summarizeAuditReport({ ...report(), error }),
      /valid report object/,
      String(error),
    );
  }
  assert.deepEqual(summarizeAuditReport(zeroFindings).totals.total, 0);
});

test('accepts an absent optional zero-valued info count', () => {
  const input = report();
  delete input.metadata.vulnerabilities.info;
  assert.equal(summarizeAuditReport(input).totals.info, 0);
});

test('rejects missing, negative, non-integer and contradictory counts', () => {
  const badReports = [
    null, undefined, [], {},
    { ...report(), error: { code: 'EAUDITNOLOCK' } },
    { ...report(), metadata: undefined },
    { ...report(), vulnerabilities: [] },
    { ...report(), vulnerabilities: null },
    { ...report(), metadata: { vulnerabilities: [] } },
    { ...report(), metadata: { vulnerabilities: { ...counts, total: 1 } } },
    { ...report(), metadata: { vulnerabilities: { ...counts, high: -1 } } },
    { ...report(), metadata: { vulnerabilities: { ...counts, moderate: 1.5 } } },
    { ...report(), metadata: { vulnerabilities: { ...counts, low: '1' } } },
    { ...report(), metadata: { vulnerabilities: { ...counts, critical: undefined } } },
    { ...report(), metadata: { vulnerabilities: { ...counts, total: Number.MAX_SAFE_INTEGER + 1 } } },
    { ...report(), metadata: { vulnerabilities: { ...counts, info: null } } },
  ];
  for (const input of badReports) {
    assert.throws(() => summarizeAuditReport(input), Error, JSON.stringify(input));
  }
});

test('rejects invalid advisory records instead of printing unverified details', () => {
  for (const value of [null, [], 'bad advisory', 0]) {
    const input = report();
    input.vulnerabilities.alpha = value;
    assert.throws(() => summarizeAuditReport(input), /malformed advisory details/);
  }
});

test('rejects false-clean audit totals with actual advisory entries', () => {
  const input = report();
  input.metadata.vulnerabilities = {
    info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0,
  };
  assert.throws(() => summarizeAuditReport(input), /advisory details contradict.*total/);
});

test('rejects positive totals when the audit contains no affected package details', () => {
  const input = report();
  input.vulnerabilities = {};
  assert.throws(() => summarizeAuditReport(input), /advisory details contradict.*total/);
});

test('rejects listed severities that contradict npm audit totals', () => {
  for (const severity of ['high', 'critical', 'info', 'unknown', undefined, null, 3]) {
    const input = report();
    input.vulnerabilities.alpha.severity = severity;
    assert.throws(
      () => summarizeAuditReport(input),
      /advisory severity contradicts metadata/,
      String(severity),
    );
  }
});

test('rejects truncated and inflated advisory lists even with positive totals', () => {
  const missing = report();
  delete missing.vulnerabilities.alpha;
  assert.throws(() => summarizeAuditReport(missing), /advisory count does not match/);

  const extra = report();
  extra.vulnerabilities.beta = { severity: 'low', fixAvailable: false };
  assert.throws(() => summarizeAuditReport(extra), /advisory count does not match/);
});

test('rejects shifted advisory severities with an otherwise matching total', () => {
  const input = report();
  // Both package details now claim low severity, while npm's metadata
  // claims one low and one moderate affected package.
  input.vulnerabilities.alpha.severity = 'low';
  assert.equal(Object.keys(input.vulnerabilities).length, input.metadata.vulnerabilities.total);
  assert.throws(
    () => summarizeAuditReport(input),
    /advisory severity counts do not match metadata/,
  );
});

test('keeps valid same-severity findings and optional info category supported', () => {
  const input = report();
  delete input.metadata.vulnerabilities.info;
  input.vulnerabilities.zeta.severity = 'moderate';
  input.metadata.vulnerabilities = {
    ...input.metadata.vulnerabilities, low: 0, moderate: 2,
  };
  assert.equal(summarizeAuditReport(input).advisories.length, 2);
});

test('accepts a genuine report with zero findings', () => {
  const result = summarizeAuditReport({
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
    vulnerabilities: {},
  });
  assert.equal(result.totals.total, 0);
  assert.deepEqual(result.advisories, []);
});

test('audit log labels remain one line, bounded, and resistant to fake annotations', () => {
  const unsafe = 'package\n::error::forged\u001b[31m\u202e' + 'x'.repeat(30_000);
  const label = auditLogLabel(unsafe);
  assert.ok(label.length < 240);
  assert.ok(!/[\u0000-\u001f\u007f-\u009f\u202e]/u.test(label));
  assert.ok(label.includes('\\n'));
  assert.ok(label.includes('\\u001b'));
  assert.ok(label.includes('\\u202e'));
  assert.ok(label.includes('[truncated]'));
  assert.equal(auditLogLabel('@scope/normal-pkg'), '"@scope/normal-pkg"');
  assert.equal(auditLogLabel('\u2028\u2029'), '"\\u2028\\u2029"');
});

test('invalid npm audit package names are escaped even in failure messages', () => {
  const unsafe = 'package\n::error::forged\u001b[31m';
  const input = report();
  input.vulnerabilities = {
    [unsafe]: null,
    ...input.vulnerabilities,
  };
  assert.throws(
    () => summarizeAuditReport(input),
    (error) => error instanceof Error
      && /malformed advisory details/.test(error.message)
      && !error.message.includes('\n')
      && !error.message.includes('\u001b')
      && !error.message.includes('::error::forged\n'),
  );
});
