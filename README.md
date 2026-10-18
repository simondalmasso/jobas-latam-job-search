# JOBAS — Computer Job Assistant

Public job radar and personal job-search workspace for Argentina/LatAm.

**Live app:** https://jobas.web.app  
**Primary runtime:** https://jobas.simondalmasso44.workers.dev  
**Public MCP:** https://jobas.simondalmasso44.workers.dev/mcp

[![CI](https://github.com/simondalmasso/jobas-latam-job-search/actions/workflows/ci.yml/badge.svg)](https://github.com/simondalmasso/jobas-latam-job-search/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![M8ven Score](https://m8ven.ai/badge/mcp/simondalmasso-jobas-17b8z9?v=07bfd6c708387e86bfdce7b7402cd8aa)](https://m8ven.ai/mcp/simondalmasso-jobas-17b8z9?s=readme)

## Release and verification

Latest published release: **[JOBAS v1.1.2](https://github.com/simondalmasso/jobas-latam-job-search/releases/tag/v1.1.2)** (2026-10-09), pinned to [source commit](https://github.com/simondalmasso/jobas-latam-job-search/commit/a7dedb672674f0513621fef247e561deda00b354). Penny now defaults to user-owned OpenRouter and the explicit free-model router; authenticated provider inference requires the user's key.

The release passed [GitHub Actions CI](https://github.com/simondalmasso/jobas-latam-job-search/actions/runs/37961659852) and real Chromium checks against production at 1440px desktop and 390px/360px mobile. Public feed/health counts, LOCAL radar, browser-local saved state, and read-only MCP were verified. A [reproducible 46-link sample](docs/openai-codex-oss/FEED_SAMPLE_2026-10-09.json) records both reachable listings and inaccessible sources rather than implying that every vacancy is still open.

**Scope:** early-stage OSS without established adoption metrics. Some job dates and Argentina eligibility remain uncertain; AI is optional and requires user-owned provider credentials. The local curated dataset currently has no live entries: its records expired on 2026-10-15 and remain excluded until source links are reverified. See the [current OSS readiness](docs/openai-codex-oss/READINESS.md) and the [dated product audit](docs/openai-codex-oss/PRODUCT_ACCEPTANCE_2026-10-09.md). Post-release source-data or documentation maintenance on `main` does not move historical release tags.

## What JOBAS does

JOBAS combines a public opportunity radar with a browser-local workspace for managing a job search.

- **Remote + local radar** for Argentina/LatAm.
- **Profile-driven search** without requiring an account.
- **Application tracking**, favorites, saved searches and custom folders.
- **Application workflow** that distinguishes traditional CV-based jobs from direct-contact opportunities.
- **Application kit (unreleased candidate):** offline requirement/evidence matching and optional user-owned AI drafts for CV positioning and a short cover message, explicitly human-reviewed and never auto-submitted.
- **AI interview Coach** with text and optional browser voice. **Penny** shares the user's OpenRouter connection and defaults to the free-model router; Hugging Face remains optional.
- **Freelance / contract / microjob filter** with explicit-vs-inferred type labels and a read-only MCP discovery tool.
- **Public read-only MCP** for agents and external tools.

The product keeps infrastructure deliberately small: Cloudflare Workers + Static Assets + KV, source-backed curated data files and native browser storage for personal workspace state.

## Freelance and contract discovery

The development candidate adds a public, no-auth **Remote Landers contract feed** to the existing adapters. JOBAS preserves each Remote Landers listing URL and displays its required attribution. The browser can filter jobs identified as freelance, contract or task-based; inferred labels are marked as estimates. MCP clients can call the read-only tool **list_freelance_opportunities**.

The Radar adicional also links to freelance marketplaces, AI-task programs and selected regional recruiters for manual discovery. Those links are **not imported feeds**: JOBAS does not claim to verify their individual listings. The product does not install browser crawlers, run research agents, use a paid search API, or add provider credentials to Cloudflare. See [Freelance discovery and integration audit](docs/FREELANCE-DISCOVERY.md).

These are development-branch changes pending review; they are not part of the published v1.1.2 release.

## Product principles

1. **Public first.** Browsing the radar does not require login.
2. **Human in the loop.** JOBAS organizes and assists; it does not silently apply on behalf of the user.
3. **User-owned AI.** The interview Coach connects directly to the user's OpenRouter account.
4. **Low-cost runtime.** No hidden AI proxy, no hourly browser agents and no background inference in the Worker.
5. **Traceable opportunities.** Source links, geography, compensation and freshness stay visible.
6. **Small canonical surface.** GitHub `main` is authoritative.

## Per-vacancy application kit (development branch)

From any CV-based listing, select **PREPARAR CV** to open the Coach's application kit.
Copy the offer's actual requirements, one per line, and (optionally) add accomplishments you can verify. **Analizar sin IA** compares those requirements to the explicitly declared skills/languages in the browser. Unmatched terms mean *no recorded evidence*, not proof the candidate lacks the skill.

**Crear borrador gratis** sends only the displayed profile fields, pasted requirements and optional user-confirmed experience directly to the user's OpenRouter account using `openrouter/free`. It returns an **editable proposal** for CV bullet positioning and a brief cover message. It does not edit or export an actual PDF, confirm vacancies, send applications or certify ATS compatibility. The user must verify and send everything manually. Borradores are not persisted in JOBAS. The provider may rate-limit free use.

This section describes **branch functionality pending review**, not a feature already present in published v1.1.2.

## AI Coach: cost boundary

JOBAS does **not** pay for or proxy AI inference.

```text
user browser ───────────────> OpenRouter
       │
       └── profile / CV / interview context
```

Not:

```text
browser -> JOBAS Worker -> AI provider
```

The provider credential belongs to the user, is browser-side, and defaults to session-only storage.

See [Privacy and data flow](docs/PRIVACY.md).

## Architecture

```text
GitHub main
   │
   ├── data/gpt-local.json
   ├── data/gpt-remoto.json
   └── data/curated-local.json
            │
            ▼
     Cloudflare Worker
      feed + MCP + app
            │
            ▼
         Browser
   ┌────────┴─────────┐
   │                  │
local workspace   optional AI Coach
                      │
                      ▼
                 OpenRouter
              (user-owned account)
```

Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository layout

```text
.
├── public/                  # Browser application
│   ├── app.js               # Main UI + feed interaction
│   ├── coach.js             # User-owned AI provider boundary
│   ├── profile.js           # Browser-local profile
│   ├── user-memory.js       # Favorites, searches, folders
│   ├── workflow.js          # Apply/contact workflow
│   ├── index.html
│   └── styles.css
├── src/                     # Cloudflare Worker
│   ├── index.js             # Routes, feed, scheduled refresh
│   ├── sources.js           # Automatic opportunity sources
│   ├── judge.js             # Normalization + generic public quality
│   └── mcp.js               # Public read-only MCP
├── data/
│   ├── gpt-local.json
│   ├── gpt-remoto.json
│   └── curated-local.json
├── test/                    # Node test suite
├── docs/                    # Architecture, privacy, research
├── firebase-public/         # Redirect-only Firebase alias
├── wrangler.jsonc
└── package.json
```

## Local development

Requirements:

- Node.js 22+
- npm

```bash
git clone https://github.com/simondalmasso/jobas-latam-job-search.git
cd jobas-latam-job-search
npm ci
npm run dev
```

Verification:

```bash
npm run verify
```

That runs Node contracts, Wrangler dry-run and the lean browser acceptance gate:

```bash
npm test
npm run dry-run
npm run test:browser
```

## Deployment

Primary deployment:

```bash
npm run deploy
```

Firebase is only a public alias/redirect layer:

```bash
npm run firebase:deploy:redirect
```

It does not host a second backend.

## Radar data

JOBAS keeps source-backed curated inputs under `data/`. Named/manual opportunities live there rather than inside Worker source code. Server ordering uses generic public quality signals only; candidate fit is computed in the browser from the user's local profile.

Automated sources are normalized and merged into the public feed by the Worker.

Research notes for opportunity sources live under [docs/research/](docs/research/).

## Public MCP

Endpoint:

```text
POST https://jobas.simondalmasso44.workers.dev/mcp
```

The MCP is public, stateless and read-only. Recommended first tool for agents: `agent_bootstrap`. Full contract: [docs/MCP.md](docs/MCP.md).

It does not create applications, store provider secrets or start background browsers.

## Security and privacy

- [Security policy](SECURITY.md)
- [Privacy and data flow](docs/PRIVACY.md)
- [Contributing](CONTRIBUTING.md)
- [Canonical repository rules](docs/CANONICAL-REPOSITORY.md)

Never commit API keys, CVs, browser sessions or personal candidate data.

## License

JOBAS is released under the [MIT License](LICENSE).

Copyright © 2026 Simón Dalmasso.

---

**Built on GitHub + Cloudflare Workers. Optional AI uses the user's own OpenRouter account.**
