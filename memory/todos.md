# memory/todos.md — Active To-Do List
*Load this file when: planning what to work on, during sprints, reviewing priorities*

---

## 🔴 HIGH PRIORITY

### Mission Control — Make Private
- **URL:** https://mission-control-iota-nine.vercel.app/
- Currently PUBLIC — needs auth before adding any sensitive data
- **Fix:** Next.js middleware authentication (same pattern as Yieldbook)

### METRC Integration — Unblock
- Aaron needs to log into co.metrc.com → Admin → API Access → link Bonsai Cultivation license
- Once facility linked: test API with Bearer token, then build data sync
- See `memory/projects.md` for full METRC details

---

## 🟡 ACTIVE / IN PROGRESS

### Yieldbook — Pending Features
- [ ] Trimmer personal stats page (conversion rate + BD count by week)
- [ ] TIP calculator (deferred — needs CSV upload flow first)
- [ ] Password protection on Vercel URL
- [ ] Trimmer role fully implemented (currently only Manager/Grower active)

### Data Analysis Scripts
- [ ] Trimmer productivity and efficiency reports
- [ ] Batch performance comparisons
- [ ] Year-over-year trends (2023 vs 2024 vs 2025)
- [ ] Strain analysis
- [ ] Labor analysis (hours vs output)

---

## 🟢 FUTURE / BACKLOG

### Agent Team Framework
- Research: Anthropic's C compiler project (16 parallel agents, $20K, 100K lines of code)
- Application: multi-agent Yieldbook development
- Critical lesson: testing infrastructure must be perfect FIRST
- Notes: `memory/agent-team-management-notes.md`

### Systematic Learning Framework
- Build feedback loops: measure → learn → improve → repeat
- Track decisions made, outcomes observed, lessons extracted

### Yieldbook Long-Term
- Direct data input forms (replace Google Sheets workflow entirely)
- Real-time analytics dashboard
- Trimmer individual accounts with personal dashboards

### Bonsai Cultivation Website
- Fix "Dagba" → "Dagda" typo
- Add dispensary locator ("Find Us" feature)
- Improve SEO (structured data, blog content, backlinks)
- Mobile friendliness audit

---

## ✅ RECENTLY COMPLETED
- ✅ Yieldbook Trimmer Performance Trends (2026-03-01)
- ✅ Yieldbook CSV Export (2026-02-27)
- ✅ Yieldbook user onboarding emails (2026-02-25)
- ✅ Bot-to-bot Tailscale comms (2026-02-26)
- ✅ Weekly production report cron (2026-02-09)
- ✅ Gmail + Sheets integration (2026-02-02)
