---
title: "Where to put Cursor rules (.mdc files) and how to write them"
description: "Cursor project rules go in .cursor/rules/ as .mdc files with description, globs and alwaysApply frontmatter. Here is the layout and a working example."
answer: "Save project rules as .mdc files inside .cursor/rules/ in your repo, for example .cursor/rules/nextjs.mdc. Each file starts with YAML frontmatter: description (when the agent should use it), globs (which files it applies to) and alwaysApply (include it in every chat). Keep each rule short and focused on one area."
kits: [nextjs-supabase-cursor-rules, godot-4-gdscript-rules, one-source-of-truth]
updated: "2026-10-30"
sources:
  - https://cursor.com/docs/rules
faq:
  - q: "Can I use a plain .md file in .cursor/rules?"
    a: "No. Cursor ignores .md files there because they have no frontmatter. Use .mdc, or put plain Markdown in AGENTS.md."
  - q: "Can I organize rules in subfolders?"
    a: "Yes. Cursor's docs show subfolders such as .cursor/rules/frontend/components.mdc."
  - q: "How do I apply a rule only when I ask for it?"
    a: "Set alwaysApply: false and leave out description and globs. The rule is then included only when you @-mention it in chat."
---
## Folder layout

```
your-repo/
  .cursor/
    rules/
      general.mdc      # alwaysApply: true
      nextjs.mdc       # globs: app/**/*.tsx
      supabase.mdc     # globs: lib/supabase/**
  AGENTS.md            # optional plain-Markdown rules, also read by Cursor
```

## Example rule

```markdown
---
description: Next.js App Router conventions
globs: app/**/*.tsx
alwaysApply: false
---
- Use Server Components by default; add "use client" only when needed.
- Run `pnpm test` before saying a task is done.
```

## Choosing the frontmatter

- `alwaysApply: true`: included in every chat; `globs` and `description` are ignored.
- `globs` (with `alwaysApply: false`): auto-attached when a matching file is in context. Separate several patterns with commas.
- `description` only: the agent reads the description and pulls the rule in when relevant.
- None of them: included only when you @-mention the rule.

## Tips

- Exact commands beat general advice.
- One topic per file; Cursor's docs suggest keeping each rule under 500 lines.
- Mentioning a file like `@template.ts` in a rule does not paste its contents; the agent reads it when needed. Put must-have text in the rule body.
- Using Claude Code or Codex too? Keep shared rules in AGENTS.md ([guide](../one-agents-md-for-claude-code-cursor-codex/)).
