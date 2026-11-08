# Security Policy

Rodrix Agent Kits is a public, static reference library. The current `main` branch and the published site are the actively maintained targets for vulnerability reports. Older snapshots and third-party kit dependencies are not guaranteed to receive backported fixes.

## Privately report a vulnerability

Email **rodrixlabs@mail.grokbot.com** (the public project support address in `src/config.ts`) with the subject **Security report: Rodrix Agent Kits**. Do not publish exploit details, submit live credentials or personal data, or open a public issue containing sensitive reproduction steps.

Useful information includes:

- The affected URL, repository path, feature or kit example, and the observed impact.
- Clear reproduction steps using **synthetic or redacted data** and the relevant browser, operating system or dependency version.
- A minimal, non-destructive proof of concept, when appropriate, and a suggested mitigation if available.
- A safe way to follow up. Ordinary email may not be end-to-end encrypted; ask about an alternative secure exchange before transmitting anything sensitive.

If the issue belongs exclusively to a third-party platform, service or dependency, also follow that vendor's security reporting policy. Do not send third-party API keys or tokens to this project.

## Research and scope

Please limit testing to accounts, infrastructure, files and data you are authorized to use. Avoid disrupting availability, generating fraudulent transactions, activating external webhooks, probing real subscribers, scraping personal data or attempting to access other users' information. Local preview and synthetic fixtures are preferable to production experiments.

The repository contains example agent instructions and n8n workflows. They are **not certified or production-hardened integrations**. In particular, importing an example does not establish consent, data retention controls, rate limiting or access control. See [OPERATIONS.md](OPERATIONS.md) for deployment and privacy caveats.

## Handling and disclosure

The maintainer can review a report, ask clarifying questions, determine whether the affected code is maintained here, and prepare a fix and regression test where appropriate. Please allow time for coordination before publishing technical details that could put users at risk.

This document does not promise a specific response or remediation deadline, a bug bounty, confidentiality beyond the chosen communication channel, or that all reports will result in a fix. A passing CI pipeline is not an independent security audit.

For ordinary bug reports, documentation and feature proposals that do not expose an active vulnerability, use the repository's normal issue or pull-request process and [CONTRIBUTING.md](CONTRIBUTING.md).
