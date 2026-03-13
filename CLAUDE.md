# Social Studio — Claude Context

> This file is read automatically by Claude Code at the start of every session.
> Do not delete it. Keep it current.

---

## What This Project Is

Social Studio is an AI-powered social media content tool that researches trending topics and drafts posts in the user's voice across Twitter/X and LinkedIn.

**v1.0 (live):** Personal single-user tool. Matt's voice hardcoded into system prompts.  
**v1.0 iOS (in progress):** React Native port of the web app against the existing Flask backend.  
**v2.0 (planned):** Multi-user commercial platform with a full personalized voice system.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python + Flask |
| Web frontend | Vanilla HTML/CSS/JS (single `index.html`) |
| iOS frontend | React Native + Expo (in progress) |
| Navigation (iOS) | React Navigation |
| Auth storage (iOS) | Expo SecureStore |
| AI | Claude API (`claude-sonnet-4-6`) |
| Social data | X/Twitter API v2 |
| Auth (v1.0) | Password gate — `POST /check-password` |

### Backend Routes
- `GET /` — serves index.html
- `POST /check-password` — password validation
- `GET /2/tweets/search/recent` — X API proxy
- `POST /proxy/anthropic` — Claude API proxy

---

## Your Role in This Session

Confirm your agent role before starting any work:

- **Architect Agent** — technical planning and decisions. Does not write production code.
- **Product Agent** — specs, backlog, scope. Does not make technical decisions.
- **iOS Dev Agent** — owns the React Native + Expo codebase. Always works in a git branch.
- **Web Dev Agent** — owns the Flask + HTML codebase. Always works in a git branch.
- **QA Agent** — reviews all output before it reaches the Creative Director.

If your role isn't clear, ask before proceeding.

---

## Non-Negotiables

- Always work in a git branch. Never commit directly to main.
- No backend changes during the v1.0 iOS port. Client layer only.
- The web app stays healthy throughout the port. It is not a second-class citizen.
- No new dependencies without Architect sign-off.
- After completing any task, write a 3-line summary: what you did, what changed, what QA should check.

---

## The Most Important Thing to Preserve

**Matt's voice.** It is the core value of this product in v1.0.

It lives in the system prompts inside `index.html`. Every Claude API call is shaped by a carefully tuned persona — senior exec lens, sharp and direct, grounded in real industry experience across gaming, social, and brand strategy.

When porting to iOS, copy the system prompts exactly. Do not paraphrase, summarize, or simplify them. They are not boilerplate — they are the product.

In v2.0, these hardcoded prompts will be replaced by a dynamic voice system. Until then, preserve them verbatim.

---

## Roadmap Awareness

| Version | What | Status |
|---------|------|--------|
| v1.0 iOS | React Native port, full feature parity | In progress |
| v1.1 | In-app image generation | Backlogged |
| v2.0 | Commercial platform, multi-user, full voice system | Planned |

Do not build v1.1 or v2.0 features during the iOS port. If something feels like it belongs in a later version, flag it and log it — don't build it.

---

## Source of Truth

- `SPECS.md` — full product spec, all versions, acceptance criteria
- `STATUS.md` — current sprint, task status, full backlog
- `DECISIONS.md` — why things are built the way they are

When in doubt about scope or approach, check these before assuming.

---

## The Creative Director

Matt is a senior marketing and brand executive. He directs, approves, and makes judgment calls. He does not write code.

Be direct. No jargon without explanation. Flag anything that needs his input immediately — don't make product decisions without him.
