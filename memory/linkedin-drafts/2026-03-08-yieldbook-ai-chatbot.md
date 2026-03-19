# LinkedIn Post — Sunday March 8, 2026
## Topic: Making the Yieldbook AI actually useful

---

### Raw Notes (what we built this week)

**Phase 1 — AI Chatbot Launch**
- Embedded Claude AI (Haiku) into the Bonsai Yieldbook — a floating chat button on every page
- Role-aware system prompts: managers, growers, and trimmers each get a different context
- Problem: the AI sounded smart but was completely blind to our actual data
- A tester asked it "what are our YTD numbers?" — it made up a generic answer

**Phase 2 — Tool Calling Integration (built Fri March 6)**
- Gave the AI 6 live data tools it can call on demand:
  - `get_production_summary` — YTD lbs, weekly avg, vs 2025, goal tracking
  - `get_weekly_production` — recent weeks of dry-equivalent output
  - `get_room_performance` — per-room lbs, g/plant, g/sq ft
  - `get_strain_performance` — top strains, strain × room cross-reference
  - `get_trimmer_stats` — leaderboard + weekly trends (role-gated)
  - `get_room_turns` — detailed per-harvest turn data
- Taps existing Google Sheets data pipeline (5-min cache) — zero new infrastructure
- Role enforcement at tool level: trimmers only see their own data, growers excluded from trimmer leaderboard
- Frontend unchanged — same endpoint, same response format

**Result:** Ask "how is Room 3 doing vs Room LED?" — it fetches the data, compares, answers.

---

### LinkedIn Draft

**Option A (technical angle):**

We put an AI chatbot in our cannabis production app.

Step 1: It could talk to anyone on the team — managers, growers, trimmers — with role-specific context. It sounded helpful.

Step 2: A tester asked it what our YTD numbers were.

It made something up. 😅

Step 3: This week we fixed that with Claude's tool-calling API. The AI now has 6 real-time tools that let it query our actual production data on demand — yields by room, strain performance, trimmer stats, harvest turn data.

The conversation that wasn't possible last week:

> "How did Room LED perform this turn vs its average?"
> [AI calls get_room_turns + get_room_performance, compares, answers with real numbers]

No new infrastructure. The data pipeline was already there. We just gave the AI hands to reach into it.

There's a big difference between AI that *sounds* like it knows your business and AI that *actually* knows your business. We're building the second kind.

#Cannabis #AgTech #AI #ClaudeAI #ToolCalling #Yieldbook

---

**Option B (story angle):**

"What are our YTD numbers?"

Our AI chatbot gave a confident, completely fabricated answer.

That's the problem with LLMs out of the box — they're great at sounding informed. Actually being informed requires connecting them to your data.

This week we did that for Bonsai Yieldbook. Claude's tool-calling API lets the AI decide mid-conversation when it needs real data, fetch it from our production pipeline, and answer with actual numbers.

Ask about room performance. Ask about strain yields. Ask how your trimming rate compares to the company average. It goes and checks.

Smart → actually useful. That's the upgrade.

#Cannabis #AI #ToolUse #DataDriven #Yieldbook

---

*Send to Azimm29_Molty for final polish and scheduling Sunday morning*
