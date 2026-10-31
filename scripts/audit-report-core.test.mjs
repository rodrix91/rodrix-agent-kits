import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAuditReport } from './audit-report-core.mjs';

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
