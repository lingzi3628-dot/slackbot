# SPYRO Upgrade Roadmap

## Current baseline (2026-09-26)

The repository is a broad AI workspace: streaming chat, authentication, admin, agents, studio tools, integrations, billing, PWA, and a React Native client. The first upgrade objective is reliability and product coherence, not adding more disconnected screens.

### Baseline findings

- Dependencies were not installed in the execution environment; npm installation required legacy peer-dependency resolution because `next-auth` and `nodemailer` declare incompatible peer ranges.
- `npx tsc --noEmit` currently includes unrelated `mini-services` projects and reports missing service dependencies. It also reports a typed admin tickets issue and cannot fully validate Prisma until the client is generated.
- `npm run build` is currently blocked when Prisma cannot download its engine over the network. This must be made reproducible in CI/deployment.
- ESLint reports 40 errors, primarily the new React compiler rules around state updates in effects, plus hook declaration-order warnings in `use-spyro-chat`.
- The repository contains a `.stage-spyro` copy that is currently included by the root lint command and should be explicitly treated as a fixture or excluded from production checks.

## Milestones

### M0 — Green baseline

- Make dependency installation reproducible.
- Generate Prisma client in CI and document the required network/cache behavior.
- Scope TypeScript checks to the root application and separately check optional mini-services.
- Resolve the current root TypeScript errors.
- Reduce lint to zero errors without weakening rules globally.
- Add `/api/health` dependency checks and a production smoke-test script.

### M1 — Secure application core

- Standardize API errors and validation with Zod.
- Make workspace ownership explicit on conversations, files, agents, projects, and usage.
- Centralize authorization helpers for user, workspace, and admin permissions.
- Add audit events for tool execution, integrations, billing, and destructive actions.
- Add confirmation/approval boundaries for code execution and outbound messages.

### M2 — AI platform

- Introduce an AI orchestration service behind the chat route.
- Add model/provider fallback, timeouts, retries, usage accounting, and trace IDs.
- Add agent resolution, context assembly, file context, conversation summarization, and tool permissions.
- Persist message feedback and reported-content events.

### M3 — Product coherence

- Organize navigation around Home, Chat, Studio, and Automations.
- Add projects, pinned conversations, search, attachments, and share/export flows.
- Make web, PWA, and mobile use the same API contracts and auth semantics.

### M4 — Production operations

- Add error tracking, latency/cost metrics, provider health, webhook observability, and deployment smoke tests.
- Add database migration checks and backup/restore documentation.
- Add security and authorization integration tests.

## Working agreement

Every milestone should leave the repository in a runnable state. Each change must include:

1. A focused implementation.
2. A validation command or test.
3. Documentation when behavior or environment requirements change.
4. No secrets or generated dependency directories committed.

## First implementation slice

The first code slice is **M0**: fix the current type/lint blockers, define clean validation commands, and then add a health/smoke-test path before changing product behavior.
