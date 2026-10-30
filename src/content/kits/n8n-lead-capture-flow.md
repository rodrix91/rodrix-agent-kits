---
en:
  title: "n8n lead-capture flow (Automation Pack)"
  summary: "Webhook → validation, honeypot and safer spreadsheet cells → Google Sheets. Review privacy and abuse controls before use."
  inside:
    - "Importable workflow JSON"
    - "Email validation, honeypot and formula-prefix handling in a Code node"
    - "Correct 200/422 responses for your form"
    - "Pack: enrichment, Slack/Telegram alerts, follow-up emails"
es:
  title: "Flujo n8n de captura de leads (Automation Pack)"
  summary: "Webhook → validación, honeypot y celdas protegidas → Google Sheets. Revisa privacidad y controles antiabuso antes de usar."
  inside:
    - "JSON de workflow importable"
    - "Validación de email, honeypot y protección de prefijos de fórmula"
    - "Respuestas 200/422 correctas para tu formulario"
    - "Pack: enriquecimiento, alertas Slack/Telegram, emails de seguimiento"
tool: "n8n"
category: "Automation"
languages: ["en"]
file: "n8n-lead-capture.json"
installPath: "n8n → Import from file"
tier: "paid"
product: "n8n-automation-pack"
price: 15
previewLines: 40
featured: false
added: "2026-10-30"
tested: "JSON structure and Code-node normalization tested with synthetic inputs; not tested end-to-end in a live n8n instance or Google Sheet. Verify node compatibility and credentials before activation."
keywords: ["n8n", "automation", "lead", "leads", "webhook", "google sheets", "form", "crm", "no-code", "workflow", "marketing"]
---
POST `{ email, name, source }` to the webhook from a form. Invalid-email and honeypot submissions (nonempty `website`) receive HTTP 422. Valid leads flow to the configured `Leads` sheet; leading spreadsheet formula characters in the `name` and `source` fields are prefixed with an apostrophe. Before handling real contacts, configure consent, rate limiting, access controls and retention; inspect the workflow and test the Google Sheets integration with synthetic submissions.
