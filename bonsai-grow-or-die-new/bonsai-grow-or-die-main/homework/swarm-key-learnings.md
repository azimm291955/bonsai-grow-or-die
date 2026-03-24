# Agent Swarm Key Learnings - Research Notes

**Updated:** 2026-02-05

---

## 🔑 Major Insights

### 1. **"More Agents" Is NOT Always Better** (Google Research)

**The Myth Busted:**
- Adding more agents doesn't universally improve performance
- Performance depends on **task properties** and **architecture alignment**

**When Multi-Agent WINS (80.9% improvement):**
- ✅ **Parallelizable tasks** - Financial analysis, multiple data sources
- ✅ **Decomposable problems** - Can split into independent sub-tasks
- ✅ **Low tool count** - Fewer than 8-10 tools per agent

**When Multi-Agent FAILS (39-70% degradation):**
- ❌ **Sequential reasoning** - Planning tasks, step-by-step logic
- ❌ **High coordination overhead** - Communication "tax" exceeds benefits
- ❌ **Tool-use bottleneck** - 16+ tools = disproportionate coordination cost

**Error Amplification:**
- Independent agents (no coordination): **17.2x error propagation**
- Centralized orchestrator: **4.4x error propagation**
- **One orchestrator agent is CRITICAL for error containment**

---

## 🏗️ Architecture Patterns

### 1. **Single-Agent System (SAS)**
- One agent, sequential execution, unified memory
- **Use when:** Task is inherently sequential, simple workflow

### 2. **Independent (Parallel)**
- Multiple agents, no communication, aggregate at end
- **Use when:** Tasks are completely isolated (e.g., scraping 5 different websites)
- **Risk:** 17.2x error amplification - NO error checking between agents

### 3. **Centralized (Hub-and-Spoke)**
- One orchestrator delegates to worker agents
- **Use when:** Need coordination + parallelization
- **Benefit:** 4.4x error amplification (orchestrator validates outputs)
- **Best for:** Our Bonsai app! (UI agent, data agent, chart agent coordinated by main)

### 4. **Decentralized (Peer-to-Peer)**
- Agents communicate directly with each other
- **Use when:** Complex negotiation, consensus-building
- **Risk:** High coordination overhead

### 5. **Hybrid**
- Mix of hierarchical oversight + peer collaboration
- **Use when:** Large-scale systems with multiple teams

---

## 📊 Predictive Model for Architecture Selection

**Task Properties to Evaluate:**
1. **Decomposability** - Can the task be split into independent chunks?
2. **Sequential dependencies** - Do steps rely on previous steps?
3. **Tool count** - How many tools does each agent need?
4. **Communication overhead** - How much do agents need to talk?

**Decision Framework:**
```
IF parallelizable AND low_tool_count:
    → Centralized multi-agent (80% performance boost)
    
IF sequential_reasoning:
    → Single-agent system (multi-agent causes 40-70% degradation)
    
IF high_tool_count (16+):
    → Single-agent or reduce tool count per agent
```

---

## 🦞 OpenAI Swarm Framework

**Key Concepts:**
- **Lightweight** - No state between calls, runs client-side
- **Two primitives:** Agents + Handoffs
- **Agent = Instructions + Tools + Ability to hand off to another agent**

**Core Loop:**
1. Get completion from current agent
2. Execute tool calls and append results
3. Switch agent if necessary (handoff)
4. Update context variables
5. If no new function calls, return

**When to Use Swarm Pattern:**
- Large number of independent capabilities
- Difficult to encode everything in single prompt
- Need lightweight, stateless coordination

**Example:**
```python
from swarm import Swarm, Agent

def transfer_to_specialist():
    return specialist_agent

main_agent = Agent(
    name="Main Agent",
    instructions="You coordinate the team",
    functions=[transfer_to_specialist]
)

specialist_agent = Agent(
    name="Specialist",
    instructions="You handle specific tasks"
)

response = client.run(
    agent=main_agent,
    messages=[{"role": "user", "content": "Do the thing"}]
)
```

---

## 🛠️ OpenClaw Implementation

**How OpenClaw Does Swarms:**
- Use `sessions_spawn(task, agentId, label)` to create isolated agent sessions
- Each sub-agent works independently in its own session
- They ping back when done
- Main agent (me) integrates results

**For Bonsai Production Data App:**

**Option A: Sequential Development** (slower, simpler)
1. Build frontend
2. Build backend
3. Build charts
4. Integrate
Total: ~4-5 development cycles

**Option B: Centralized Swarm** (faster, coordinated)
Spawn 4 agents simultaneously:
1. **Frontend Agent** - Build Next.js UI components, forms, layout
2. **Backend Agent** - Build API routes, data processing logic
3. **Charts Agent** - Build visualization components (Recharts/Chart.js)
4. **Auth Agent** - Implement password protection

Main agent (me) orchestrates, prevents conflicts, integrates work.
Total: ~2 development cycles (50% faster)

---

## ✅ Action Items for Bonsai App

**Before spawning swarm:**
1. Define clear task boundaries (what each agent builds)
2. Create shared interfaces (API contracts between frontend/backend)
3. Set up GitHub branch strategy
4. Design data models (schema)

**Swarm coordination strategy:**
- I act as the **centralized orchestrator**
- Each agent gets isolated task with clear deliverables
- I validate outputs before integration (prevent 17.2x error amplification)
- Use sessions_spawn for parallel work
- Integrate results in main session

---

## 📚 Sources

- Google Research: "Towards a Science of Scaling Agent Systems" (2026)
- OpenAI Swarm Framework (github.com/openai/swarm)
- DEV Community: "How to Build Multi-Agent Systems: Complete 2026 Guide"
- Medium: "Multi-Agent Systems Complete Guide" (2026)

---

**Next Steps:**
- [ ] Research Next.js 15 App Router best practices
- [ ] Study data visualization libraries (Recharts vs Chart.js vs D3)
- [ ] Design Bonsai app architecture
- [ ] Create task breakdown for agent swarm
