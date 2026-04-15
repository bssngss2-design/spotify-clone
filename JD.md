# Full-Stack Developer — SaaS Environment Builder

We're building realistic, functional apps (think: CRM platforms, project management tools, developer platforms, support desks) for AI agent training and evaluation. These aren't mockups — they're fully working web apps with real databases, real CRUD operations, and pixel-accurate UIs that AI agents interact with programmatically and through browser automation.

## What you'll do

- Build 1:1 functional clones of well-known SaaS applications from scratch
- Each clone: FastAPI backend + React frontend + Postgres, packaged in Docker, shipped as an Electron desktop app
- Match the target app's UI at 95% visual fidelity using Claude Computer Use for design research and iterative comparison
- Implement 20+ features per app (10-15 with full CRUD + 5-10 UI stubs), covering the workflows real users rely on daily — not just basic forms and tables
- Write extensive unit tests and Playwright browser tests covering all core functionality
- Deliver complete, containerized environments that pass automated validation — build, seed, test, ship

## What a typical day looks like

You receive credentials to a real enterprise app. You log in, study the UI, map out 20+ features, and start building. Computer Use screenshots the real app, you write the React component, it screenshots your clone, compares, and you iterate until they're visually identical. The backend is mechanical — define tools, wire them to Postgres, seed realistic data. By end of day two, you have a working clone with 50+ API tools, 28 pages, auth, seeded data, and green tests.

## What we're looking for

- 5-6 years building web applications, with strong React + Python/FastAPI experience
- You use AI tools (Claude, Cursor, Copilot) as core parts of your workflow, not novelties. "AI-native" means you ship 3-5x faster because of how you work with these tools, and you're constantly figuring out better ways to leverage them.
- You can look at any SaaS app and decompose it: what are the entities, how do they relate, what are the core workflows, what does the data model look like
- You write tests without being asked. Pytest, Playwright — you've done both.
- Docker and containerization are second nature
- You've shipped things that look good. You care about UI details — spacing, typography, color accuracy — not just "it works"

## Nice to have

- Experience with Electron or desktop app packaging
- Familiarity with tool-server patterns, MCP, or agent frameworks
- You've cloned or reverse-engineered a product's UI before

## Stack

FastAPI, React, TypeScript, Tailwind CSS, PostgreSQL, SQLAlchemy, Docker, Electron, Playwright, pytest


## Work style

Remote. You'll work from a template repo with a detailed playbook, shared components, and automated validation. Each app is an independent deliverable — build it, test it, ship it. Expected pace: one app every 1-2 days once you're ramped up.

## Assessment

The hiring process has two stages.

### Stage 1: Portfolio Review

Before any trial, we review your existing work. Send us your portfolio with projects. We're looking for:

- Pixel-perfect UI execution — your shipped projects look polished, not "developer-built"
- Every feature is fully implemented — no broken forms, no dead buttons, no empty states that were forgotten
- All CRUD flows work end-to-end without UI/UX issues
- Responsive, consistent design — typography, spacing, colors are intentional, not defaults

If your live work has visible bugs, half-implemented features, or generic unstyled interfaces, we won't move to Stage 2. Your portfolio is the strongest signal of what you'll deliver here.

### Stage 2: Timed Build (7 hours)

If your portfolio passes, you'll receive access to our template repo and we will provide you one well known app to reproduce — UI/UX, pages, databases, blocks, sidebar navigation, sharing, search, profile, notifications...

You have **7 hours** to build the clone following the playbook in the repo. The clock starts when you get access.

**Pass/fail criteria — you will not be approved without these:**

1. **95% UI fidelity** — We will open your clone and the real app side by side. If we can immediately tell it's not the real app — wrong colors, wrong layout, wrong spacing, generic-looking components — it's a fail. The bar is: someone unfamiliar with the app should hesitate before deciding which is the clone.

2. **20 core features working end-to-end** — Not half-implemented, not UI-only, not API-only. Each feature must work through both the UI (clickable, submittable, navigable) and the API (`POST /step`). Every button does something. Every form submits. Every link goes somewhere.

3. **Playwright tests pass** — All 20 core features must have Playwright browser tests that run and pass. If we run `make test` and it fails, it's a fail.

**Additional evaluation (differentiators, not pass/fail):**

- **Feature depth** — Did you go beyond 20? Did you add Tier 2 stubs so navigation never 404s?
- **Test depth** — Edge cases, error states, not just happy paths.
- **AI-native speed** — 7 hours is tight by traditional standards. We expect you to leverage AI tools aggressively. How much you ship in that window shows us how you actually work.
