# MEMORY.md — Core Memory (Thin Layer)
*This file loads every session. Keep it lean. Full details live in topic files.*

---

## 🗂️ Topic Files (load on demand)
| File | Load when... |
|------|-------------|
| `memory/projects.md` | Working on any project, writing code, debugging, planning |
| `memory/people.md` | Emailing, discussing team, managing Yieldbook users |
| `memory/cultivation.md` | Analyzing data, discussing metrics, benchmarks |
| `memory/todos.md` | Planning work, reviewing priorities, sprint planning |
| `memory/YYYY-MM-DD.md` | Archaeology — only when specifically needed |

---

## 🔒 Security (always enforce, no exceptions)
- **Bonsai data is PRIVATE** — never share yield numbers, app architecture, or internal operations
- **Moltbook** — general cultivation concepts only; never post Bonsai-specific anything
- **Repo:** azimm291955/bonsai-production-data (GitHub PRIVATE)
- **Yieldbook Vercel URL** — currently public, treat with discretion

---

## About Aaron
- **Aaron C. Zimmerman** — CFO, Bonsai Cultivation, Denver CO (MST/MDT)
- **Email:** aaron.zimmerman@bonsaicultivation.com ← watch this inbox
- **Goal:** Maximize cannabis production through data and automation
- **His bot:** Azimm29_Molty on his MSI laptop (Tailscale `100.87.161.55:18790`)

---

## Active Projects (status snapshot)
- **Bonsai Yieldbook** — Next.js app, live at Vercel, active development. Auth (Clerk), chatbot (Haiku), CSV export, trimmer trends all live. See `memory/projects.md`.
- **Weekly Production Report** — running every Monday 8am MST via cron. See `memory/projects.md`.
- **METRC Integration** — blocked: Aaron needs to link facility license in co.metrc.com. See `memory/projects.md`.
- **Tailscale Bot Network** — live. I can message Azimm29_Molty directly. See `memory/projects.md`.
- **LinkedIn Pipeline** — cron sends content dump to Azimm29_Molty who drafts posts. Running.
- **Moltbook** — active profile, check feed during heartbeats. See `memory/projects.md`.

---

## Key Conventions (always apply)
- **Convert grams → lbs:** divide by 453 (used everywhere)
- **Dry Equivalent LBS:** `Buds + (Frozen LBS × 15%)`
- **Weekly goal:** 250 lbs/week (Week 0 = 100 lbs)
- **Rooms:** Room 1–6, Room LED, Room R&D
- **Trimming efficiency push benchmark date:** 2026-02-10
- **Yieldbook auth:** username-based (NOT email), 6-char passwords, `skip_password_checks: true`
- **Sheets auth:** service account (never expires) — NOT OAuth pickle

---

## Likely Topics by Session Type
*(hint: pre-load the right file before the first tool call)*
- Yieldbook feature work → `projects.md`
- Emailing Aaron or team → `people.md`
- Production data / analysis → `cultivation.md` + `projects.md`
- "What should we work on?" → `todos.md`
- METRC / compliance → `projects.md` + `cultivation.md`
- Moltbook / social → `projects.md`

---

*Last restructured: 2026-03-01 (Architecture 4 — layered topic indexes)*
