---
en:
  title: "Code review agent skill (Agent Skills Pack)"
  summary: "A reusable SKILL.md that makes any agent review diffs like a senior engineer: prioritized, cited, no rewrites."
  inside:
    - "Review order: correctness → security → data → tests"
    - "\"Verify before claiming\" rule"
    - "Strict output format with file:line findings"
    - "Pack: test-writer, bug-triage, security-audit + more"
es:
  title: "Skill de code review (Agent Skills Pack)"
  summary: "Un SKILL.md reutilizable para que cualquier agente revise diffs como un senior: priorizado, citado, sin reescribir."
  inside:
    - "Orden de revisión: corrección → seguridad → datos → tests"
    - "Regla de \"verificar antes de afirmar\""
    - "Formato de salida estricto con hallazgos archivo:línea"
    - "Pack: test-writer, bug-triage, security-audit y más"
tool: "Agent Skills"
category: "Code review"
languages: ["en"]
file: "code-review.SKILL.md"
installPath: ".claude/skills/code-review/SKILL.md"
tier: "paid"
product: "agent-skills-pack"
price: 12
previewLines: 45
featured: true
added: "2026-10-30"
tested: "Follows the Agent Skills SKILL.md format (name + description frontmatter)."
keywords: ["code review", "review", "pull request", "pr", "diff", "skill", "agent skills", "claude", "quality", "security", "bugs"]
---
Agent Skills are folders with a `SKILL.md` that agents load on demand. This skill is the preview of the Agent Skills Pack, which adds test-writer, refactor-planner, bug-triage, release-notes and security-audit skills.
