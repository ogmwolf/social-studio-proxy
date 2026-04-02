# Social Studio — Claude Context

> This file is read automatically by Claude Code at the start of every session.
> Do not delete it. Keep it current.

---

## What This Project Is

Social Studio is an AI-powered social media content tool that researches trending topics and drafts posts in Matt Wolf's voice across X (Twitter) and LinkedIn.

**v1.1 (live):** Personal single-user web tool. Matt's voice hardcoded into system prompts. Deployed on Vercel, connected to GitHub for auto-deploy on push to main.
**iOS (backlogged):** React Native port — paused, not in active development.
**v2.0 (planned):** Multi-user commercial platform with dynamic voice onboarding system.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS — single `index.html` |
| Backend | Node.js serverless functions on Vercel |
| AI | Claude API — `claude-sonnet-4-6` (generation), `claude-haiku-4-5-20251001` (research) |
| Social data | X/Twitter API v2 |
| Deployment | Vercel — auto-deploys on push to main |
| Auth | Password gate — `POST /check-password` |

### API Routes (Vercel serverless)
- `POST /check-password` — password validation
- `POST /proxy/anthropic` — Claude API proxy (passes req.body straight through)
- `GET /2/tweets/search/recent` — X API proxy
- `POST /expand-url` — URL metadata fetcher
- `GET /img-proxy` — image proxy

---

## Platform Structure

Five platform tabs at top: **X, LinkedIn, Threads, Instagram, TikTok**
- **X** — fully featured, single unified panel (panel-x)
- **LinkedIn** — fully featured (panel-linkedin)
- **Threads, Instagram, TikTok** — placeholder "Coming Soon" panels

### X Panel — two zones in one scroll
**CREATE zone** — tweet generation with two-phase cache
**REACT zone** — Watch List + Trending + inline Reply Guy

### LinkedIn Panel — two-phase cache
**Phase 1 (Research):** 4 parallel Haiku calls + ranking call + Sonnet generation
**Phase 2 (Rewrite):** cached research, Sonnet only, per-card rewrite with inline ToV

---

## AI Architecture

### Core API functions
- `callAPI(system, msg, search, maxTokens)` — Sonnet, returns parsed JSON array
- `callAPIHaiku(system, msg, search, maxTokens)` — Haiku, returns parsed JSON object OR array (tries [...] first, falls back to {...})
- `researchCategory(category, tovKey, avoidHeadline)` — single Haiku research call, 2-search cap, shared by LinkedIn and tweets

### LinkedIn generation flow
1. Check `liResearchCache` in localStorage (keyed by local date + topicFilter)
2. Cache miss → 4 parallel `researchCategory()` calls → ranking Haiku call → save cache
3. Cache hit → skip to step 4
4. Sonnet generation with `LINKEDIN_SYSTEM` + cached topics, `search=false`
5. Phase switches to 'rewrite' — per-card ↺ Rewrite, ⟳ Fresh Story, inline ToV

### Tweet generation flow
1. Check `tweetResearchCache` in localStorage (keyed by local date)
2. Cache miss → 4 parallel `researchCategory()` calls → ranking Haiku call → save cache
3. Cache hit → skip to step 4
4. Sonnet generation with `buildOrigSystem(templates)` + cached topics, `search=false`
5. Phase switches to 'rewrite'

### Trending flow
- Primary: X API via `fetchXSearch()` across `TRENDING_QUERIES`
- Fallback: `callAPIHaiku(TRENDING_SYSTEM, ...)` with `search=true, max_tokens=1500`
- Inline reply panels open directly under selected tweet card

### Cost profile (confirmed real usage)
| Operation | Cost |
|-----------|------|
| LinkedIn Phase 1 | ~$0.03 |
| LinkedIn Phase 2 (rewrite) | ~$0.01 |
| Tweet Phase 1 | ~$0.08 |
| Tweet Phase 2 (rewrite) | ~$0.01 |
| Per-card rewrite | ~$0.01 |
| Trending (Haiku fallback) | ~$0.06 |

---

## Voice System

Matt's voice lives in system prompts inside `index.html`. There are two:

**`TWEET_VOICE`** (~1,568 tokens) — governs all tweet generation. Includes full formula, real examples, length variation templates (flash, drop, sharp, beat, open, build, long), and strict guardrails.

**`LINKEDIN_SYSTEM`** (~1,955 tokens combined with VOICE) — governs all LinkedIn generation. Few-shot voice model with:
- 3 confirmed good examples with annotations
- 3 bad examples with annotations explaining what's wrong
- 10 precise rules
- Structure variation requirements (at least 1 single-paragraph post per generation)

**`VOICE`** (~755 tokens) — shared persona constant prepended to LINKEDIN_SYSTEM.

**CRITICAL:** These prompts are the core product value. Never paraphrase, simplify, or rewrite them without explicit Creative Director approval. When porting to iOS, copy verbatim.

### ToV options (both platforms)
Upbeat, Visionary, Bandwagon, Contrarian, Raw

Each ToV has two fields:
- `modifier` — injected into Sonnet system prompt at generation time
- `research` — injected into Haiku research calls (LinkedIn Phase 1 and tweet Phase 1 only)

### Cache keys
- `ss_li_research` — LinkedIn research cache (date + topicFilter)
- `ss_tweet_research` — tweet research cache (date only)
- Both use local browser date via `getLiDateKey()` — NOT UTC — resets at local midnight

---

## Research Cap
Both `researchCategory()` and `TRENDING_SYSTEM` are capped at 2 web searches max. This reduced LinkedIn Phase 1 from $0.72 to $0.03 and tweet Phase 1 from $0.68 to ~$0.08 with no measurable quality impact.

---

## Key UI Patterns

### Two-phase buttons
- Phase 1: "Research & Draft [X]" 
- Phase 2: "✍️ Rewrite [X]" + muted hint + "↺ Fresh Stories" to reset cache

### Per-card actions (LinkedIn)
- **Copy** — copies post text
- **Edit** — inline edit with char count
- **⟳ Fresh Story** (amber) — fires new `researchCategory()` for that card's topic only, avoids current headline, rewrites card
- **↺ Rewrite** (blue) — inline ToV selector expands, rewrites single card from cached research
- **🖼 Image Prompt** — generates image prompt via Sonnet

### Visual treatment
- `card-rewritten` — amber left border, ✦ Rewritten badge
- `card-fresh` — amber left border, ⟳ Fresh Story badge

### Inline Reply Guy (X panel)
- Clicking a Watch List or Trending tweet opens inline reply panel directly under that card
- Panel has ToV selector + "Draft Reply in My Voice" button
- × closes panel
- Watch List and Trending panels are scoped independently — selecting in one zone doesn't affect the other

---

## Agent Roles

Confirm your role before starting any work:

- **Architect Agent** — technical planning and decisions. Does not write production code.
- **Web Dev Agent** — owns `index.html` and all serverless functions. Works in git branch.
- **iOS Dev Agent** — owns React Native codebase (backlogged). Works in git branch.
- **QA Agent** — reviews output before it reaches the Creative Director.

---

## Non-Negotiables

- Always work in a git branch. Never commit directly to main.
- No new npm dependencies without Architect sign-off.
- Never touch voice prompts (TWEET_VOICE, LINKEDIN_SYSTEM, VOICE, GUARDRAILS) without explicit Creative Director approval.
- After completing any task: write a 3-line summary — what you did, what changed, what QA should check.

---

## Roadmap

| Version | What | Status |
|---------|------|--------|
| v1.1 | Platform nav overhaul, per-card rewrite, two-phase cache, voice tuning | Live |
| iOS port | React Native full feature parity | Backlogged |
| v2.0 | Multi-user SaaS, dynamic voice onboarding, industry-specific research | Planned |

---

## Source of Truth

- `CLAUDE.md` — this file. Project context for every session.
- `index.html` — entire frontend + voice prompts
- `api/` — all serverless backend functions

---

## The Creative Director

Matt Wolf is a senior marketing and brand executive. He directs, approves, and makes judgment calls. He does not write code.

Be direct. No jargon without explanation. Flag anything that needs his input immediately — don't make product decisions without him.
