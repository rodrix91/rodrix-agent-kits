---
name: code-review
description: Review a diff or pull request for correctness, security, and maintainability, and return prioritized, actionable findings. Use when asked to review code, a PR, a diff, or "check my changes".
---

# Code review skill

## Inputs
- The diff (`git diff origin/main...HEAD` if not provided) and, when needed, the surrounding files.

## Process
1. **Understand intent.** Summarize in one sentence what the change is trying to do. If you can't, ask.
2. **Read the whole diff once** before commenting. Note files touched and public API changes.
3. **Check, in this order:**
   1. Correctness — logic errors, off-by-one, null/undefined, async races, unhandled errors, wrong edge cases.
   2. Security — injection (SQL/shell/HTML), authz checks missing, secrets in code, unsafe deserialization, SSRF, overly broad CORS.
   3. Data — migrations reversible? backwards compatible? N+1 queries? missing indexes?
   4. Tests — does new behaviour have tests? do tests assert the right thing?
   5. Maintainability — naming, duplication, dead code, function size, comments that lie.
4. **Verify before claiming.** If you say something is a bug, cite the exact line and explain the failing input. If unsure, label it a question.

## Output format
```
## Summary
<1-2 sentences: what changed, overall risk: low | medium | high>

## Must fix
- `path/file.ts:42` — <problem>. <why it breaks>. Suggested fix: <code or approach>

## Should fix
- ...

## Nits (optional)
- ...

## Questions
- ...
```
- Max ~10 findings; merge duplicates. Empty sections are omitted.
- Never rewrite the whole file. Suggest the smallest change.
- Praise one thing that is genuinely good, briefly.

<!-- Agent Skills Pack also includes: test-writer, refactor-planner, bug-triage, release-notes, and security-audit skills. -->
