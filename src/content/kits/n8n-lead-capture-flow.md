---
en:
  title: "n8n lead-capture flow (Automation Pack)"
  summary: "Webhook → validate + honeypot → Google Sheets → JSON response. Import, add a credential, done."
  inside:
    - "Importable workflow JSON"
    - "Email validation + spam honeypot in a Code node"
    - "Correct 200/422 responses for your form"
    - "Pack: enrichment, Slack/Telegram alerts, follow-up emails"
es:
  title: "Flujo n8n de captura de leads (Automation Pack)"
  summary: "Webhook → validación + honeypot → Google Sheets → respuesta JSON. Importa, agrega credencial y listo."
  inside:
    - "JSON de workflow importable"
    - "Validación de email + honeypot anti-spam en un nodo Code"
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
tested: "Valid n8n workflow JSON (Webhook v2, Code v2, IF v2, Google Sheets v4.5). Connect your own Google credential before activating."
keywords: ["n8n", "automation", "lead", "leads", "webhook", "google sheets", "form", "crm", "no-code", "workflow", "marketing"]
---
POST `{ email, name, source }` to the webhook from any form. Invalid or bot submissions (filled `website` honeypot) get a 422; valid leads are appended to your `Leads` sheet.
