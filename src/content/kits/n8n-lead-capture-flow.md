---
en:
  title: "n8n lead-capture flow (Automation Pack)"
  summary: "Webhook → validation, honeypot and safer spreadsheet cells → Google Sheets. Review privacy and abuse controls before use."
  inside:
    - "Importable workflow JSON"
    - "Typed email validation (max 254 characters), honeypot and formula-prefix handling"
    - "Correct 200/422 responses for your form"
    - "Pack: enrichment, Slack/Telegram alerts, follow-up emails"
es:
  title: "Flujo n8n de captura de leads (Automation Pack)"
  summary: "Webhook → validación, honeypot y celdas protegidas → Google Sheets. Revisa privacidad y controles antiabuso antes de usar."
  inside:
    - "JSON de workflow importable"
    - "Validación de email como texto (máx. 254 caracteres), honeypot y protección de fórmulas"
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
POST `{ email, name, source }` to the webhook from a form. Emails must be strings, no longer than 254 characters, and pass basic syntax checks. Non-string emails, malformed emails, structured request bodies, and submissions with a populated `website` honeypot receive HTTP 422. Valid leads flow to the configured `Leads` sheet; non-string `name` and `source` values are not coerced into spreadsheet cells, and leading formula characters in supported text fields are prefixed with an apostrophe. Before handling real contacts, configure consent, rate limiting, access controls and retention; inspect the workflow and test the Google Sheets integration with synthetic submissions.
