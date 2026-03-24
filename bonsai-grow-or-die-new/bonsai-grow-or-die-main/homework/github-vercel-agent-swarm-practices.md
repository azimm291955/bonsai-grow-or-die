# GitHub + Vercel Best Practices for Agent Swarm Development

**Research Date:** 2026-02-05  
**Sources:** GitHub Blog, Moltbook, Dev Community, Medium, Stack Overflow

---

## 🎯 Core Principles (from GitHub's Agentic Primitives Framework)

### The Three-Layer Framework

**Layer 1: Markdown Prompt Engineering**
- Use structured Markdown for agent instructions
- Context loading via file links: `[Review patterns](./src/patterns/)`
- Role activation: "You are an expert [role]"
- Tool integration: `Use MCP tool tool-name`
- Validation gates: "Stop and get user approval"
- Eliminate ambiguity through precise language

**Layer 2: Agentic Primitives (Reusable Files)**
- `.instructions.md` - Structured guidance for agents
- `.chatmode.md` - Role-based expertise with MCP tool boundaries
- `.prompt.md` - Reusable prompts with built-in validation
- `.spec.md` - Implementation-ready blueprints
- `.memory.md` - Preserve knowledge across sessions
- `.context.md` - Optimize information retrieval

**Layer 3: Context Engineering**
- **Session splitting** - Use distinct agent sessions for different phases
- **Modular instructions** - Apply only relevant instructions per task
- **Memory-driven development** - Leverage `.memory.md` for continuity
- **Cognitive focus optimization** - Prevent cross-domain interference

---

## 🦞 Agent Workflow Orchestration Rules

### Operating Principles (from AI Agent Workflow Guidelines)

1. **Correctness over cleverness** - Prefer boring, readable solutions
2. **Smallest change that works** - Minimize blast radius
3. **Leverage existing patterns** - Follow established conventions
4. **Prove it works** - "Seems right" is not done (test/build/lint)
5. **Be explicit about uncertainty** - Say so and propose next steps

### Plan Mode (for Non-Trivial Tasks)

**Use when:**
- 3+ steps
- Multi-file change
- Architectural decision
- Production-impacting behavior

**Plan must include:**
- Verification steps (not afterthought)
- Crisp spec (inputs/outputs, edge cases, success criteria)
- Stop and update plan if new information invalidates it

### Subagent Strategy (Parallelize Intelligently)

**Use subagents to keep main context clean:**
- Repo exploration
- Pattern discovery
- Test failure triage
- Dependency research
- Risk review

**Give each subagent:**
- One focused objective
- Concrete deliverable
- Example: "Find where X is implemented and list files + key functions"

**After subagents complete:**
- Merge outputs into short, actionable synthesis
- Then proceed with coding

### Incremental Delivery (Reduce Risk)

**Prefer thin vertical slices over big-bang changes:**
- Implement → test → verify → then expand
- Keep changes behind feature flags or config switches when feasible
- Land work in small, verifiable increments

### Verification Before "Done"

**Never mark complete without evidence:**
- Tests pass
- Lint/typecheck pass
- Build succeeds
- Logs confirm expected behavior
- Deterministic manual repro

**Ask:** "Would a staff engineer approve this diff and the verification story?"

---

## 🌿 Git Branching Strategy for Agent Swarms

### Branch Structure

```
main                    # Production-ready, protected
├── feature/frontend    # Frontend agent's work
├── feature/backend     # Backend agent's work
└── feature/charts      # Charts agent's work
```

### Branch Naming Conventions

**Feature branches:**
- `feature/[component]` - e.g., `feature/frontend`, `feature/backend`
- `feature/[ticket-id]` - e.g., `feature/BONS-123`

**Agent-specific branches (if needed):**
- `agent/[agent-name]/[component]` - e.g., `agent/frontend/dashboard-layout`

### The Merge Conflict Problem

**Key Insight:** Merging mainline into your branch frequently does NOT prevent conflicts!

**Why?**
- Conflicts are like race conditions
- They occur when two developers (or agents) work on the same code in the same time window
- Reordering or "conflict etiquette" doesn't solve the problem
- **The ONLY way to reduce conflicts is to reduce the time window**

### Conflict Prevention Strategies

#### 1. **Small, Isolated Changes** (Most Important)
- Merge early, merge often
- Don't wait until feature is "done"
- Every time tests pass, commit and merge
- **This is TRUE Continuous Integration**

#### 2. **Clear File Boundaries**
- Assign agents non-overlapping files when possible
- Frontend agent touches only `/app/` and `/components/`
- Backend agent touches only `/lib/` and `/actions/`
- Charts agent touches only `/components/charts/`

#### 3. **Rebase Feature Branches Regularly**
```bash
# Update feature branch with latest main
git checkout feature/frontend
git fetch origin
git rebase origin/main
git push --force-with-lease origin feature/frontend
```

**Do this:**
- Before starting work each day
- Before opening a PR
- When main gets a significant update

#### 4. **Use Temporary Conflict Resolution Branches**

**When conflicts occur:**

```bash
# Create temporary branch from feature branch
git checkout feature/frontend
git checkout -b temp-conflict-resolve

# Merge main into temporary branch
git merge main

# Resolve conflicts manually
# Stage and commit changes

# Merge temporary branch back into feature
git checkout feature/frontend
git merge temp-conflict-resolve

# Delete temporary branch
git branch -d temp-conflict-resolve
```

**Why?** Keeps unwanted code from main isolated during conflict resolution.

### Multi-Agent Integration Workflow

**Phase 1: Parallel Development**
```bash
# Each agent works in isolation
Agent 1: feature/frontend
Agent 2: feature/backend
Agent 3: feature/charts
```

**Phase 2: Integration Order** (Orchestrator decides)
```bash
# Merge in order of dependencies:
1. Backend first (data layer)
2. Frontend second (consumes backend)
3. Charts third (consumes backend + frontend)
```

**Phase 3: Testing**
```bash
# After each merge to main:
- Vercel auto-deploys preview
- Run integration tests
- Verify no regressions
```

---

## ⚙️ GitHub Actions + Vercel CI/CD

### Workflow Strategy

**Two workflows:**
1. **Preview Deployments** (on PR/push to feature branches)
2. **Production Deployments** (on merge to main)

### Preview Deployment Workflow

**File:** `.github/workflows/preview.yaml`

```yaml
name: Vercel Preview Deployment
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches-ignore:
      - main

jobs:
  Deploy-Preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

### Production Deployment Workflow

**File:** `.github/workflows/production.yaml`

```yaml
name: Vercel Production Deployment
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

on:
  push:
    branches:
      - main

jobs:
  Deploy-Production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Required Secrets

**In GitHub repo settings → Secrets and variables → Actions:**
- `VERCEL_TOKEN` - Get from Vercel account settings
- `VERCEL_ORG_ID` - Get from `.vercel/project.json` after first deploy
- `VERCEL_PROJECT_ID` - Get from `.vercel/project.json` after first deploy

### Testing Strategy in CI/CD

**Add to workflows BEFORE deployment:**

```yaml
- name: Run Lint
  run: npm run lint

- name: Run Type Check
  run: npm run type-check

- name: Run Tests
  run: npm test

- name: Build Check
  run: npm run build
```

**Only deploy if all checks pass.**

---

## 📋 Agent Task Breakdown (with GitHub Integration)

### Frontend Agent Task

**Branch:** `feature/frontend`

**Task spec (`.prompt.md`):**
```markdown
# Frontend Agent Task

## Objective
Build Next.js dashboard UI shell with responsive layout.

## Files to Create/Modify
- app/dashboard/layout.tsx
- app/dashboard/page.tsx
- app/dashboard/production/page.tsx
- app/dashboard/trimmers/page.tsx
- app/dashboard/loading.tsx

## Success Criteria
- [ ] All pages render without errors
- [ ] Mobile responsive (test on 320px, 768px, 1024px)
- [ ] Loading states work
- [ ] Navigation functions correctly
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`

## Context Files
- [Tailwind config](./tailwind.config.ts)
- [TypeScript config](./tsconfig.json)

## Verification
- Run `npm run dev` and verify:
  - http://localhost:3000/dashboard loads
  - All sub-routes load
  - No console errors
- Run `npm run build` - must succeed
- Screenshots at 3 breakpoints (attach to PR)

## PR Requirements
- Title: "Frontend: Dashboard UI shell"
- Description: List of pages created + screenshots
- Assign reviewer: @main-orchestrator
```

### Backend Agent Task

**Branch:** `feature/backend`

**Task spec (`.prompt.md`):**
```markdown
# Backend Agent Task

## Objective
Build data layer with Google Sheets integration and Server Actions.

## Files to Create/Modify
- lib/google-sheets.ts
- lib/calculations.ts
- lib/types.ts
- actions/production.ts

## Success Criteria
- [ ] Data fetching functions work (test with real Google Sheets)
- [ ] Calculations return correct g/sq ft values
- [ ] Server Actions handle form submissions
- [ ] Type safety (no `any` types)
- [ ] ISR caching configured (revalidate: 300)
- [ ] Tag-based revalidation works
- [ ] Build succeeds: `npm run build`
- [ ] Type check passes: `npm run type-check`

## Context Files
- [Google Sheets credentials](../.credentials/sheets-token.pickle)
- [Existing Python scripts](../gmail-sheets-integration/)

## Verification
- Test data fetching: `node -e "require('./lib/google-sheets').getProductionData().then(console.log)"`
- Verify calculations with known dataset
- Test Server Action in dev server
- Run `npm run build` - must succeed

## PR Requirements
- Title: "Backend: Data layer + Google Sheets integration"
- Description: Functions created + test results
- Assign reviewer: @main-orchestrator
```

### Charts Agent Task

**Branch:** `feature/charts`

**Task spec (`.prompt.md`):**
```markdown
# Charts Agent Task

## Objective
Build Recharts visualization components.

## Files to Create/Modify
- components/charts/ProductionChart.tsx
- components/charts/TrimmerChart.tsx
- components/charts/WeeklyChart.tsx
- package.json (add recharts dependency)

## Success Criteria
- [ ] Recharts installed: `npm install recharts`
- [ ] All chart components render without errors
- [ ] ResponsiveContainer wraps all charts
- [ ] Charts handle empty data gracefully
- [ ] Mobile responsive
- [ ] Type safety
- [ ] Build succeeds: `npm run build`

## Context Files
- [Data types](../lib/types.ts)
- [Recharts docs](https://recharts.org/)

## Verification
- Import charts in test page
- Render with sample data
- Test with empty array (should show "No data" message)
- Test on mobile viewport
- Run `npm run build` - must succeed
- Screenshots of all 3 charts (attach to PR)

## PR Requirements
- Title: "Charts: Recharts visualization components"
- Description: Charts created + screenshots
- Assign reviewer: @main-orchestrator
```

---

## 🔄 Integration Workflow (Orchestrator Role)

### Step 1: Monitor Agent Progress

**Check session status:**
```bash
# In OpenClaw
sessions_list({ kinds: ["isolated"], activeMinutes: 120 })
```

**Review branches:**
```bash
git fetch --all
git branch -r | grep feature/
```

### Step 2: Review PRs

**For each agent PR:**
1. Review code changes
2. Check CI/CD status (all checks pass?)
3. Pull branch locally and test
4. Request changes or approve

### Step 3: Merge in Order

**Order matters! Merge dependencies first:**

```bash
# 1. Backend first (no dependencies)
git checkout main
git merge feature/backend
git push origin main

# Wait for Vercel production deployment

# 2. Frontend second (depends on backend types)
git checkout main
git merge feature/frontend
git push origin main

# Wait for Vercel production deployment

# 3. Charts third (depends on backend + frontend)
git checkout main
git merge feature/charts
git push origin main

# Wait for Vercel production deployment
```

### Step 4: Integration Testing

**After all merges:**
1. Visit production URL
2. Test all dashboard pages
3. Verify charts render with real data
4. Test forms/interactions
5. Check mobile responsiveness
6. Verify no console errors

### Step 5: Cleanup

```bash
# Delete merged feature branches
git branch -d feature/backend feature/frontend feature/charts
git push origin --delete feature/backend feature/frontend feature/charts
```

---

## 🚨 Error Recovery Patterns

### When CI/CD Fails

**1. Build Failure**
```bash
# Pull branch locally
git checkout feature/frontend
npm install
npm run build

# Fix errors
# Commit fix
git add .
git commit -m "fix: build error in component X"
git push origin feature/frontend

# CI/CD re-runs automatically
```

**2. Merge Conflict**
```bash
# Use temporary conflict resolution branch
git checkout feature/frontend
git checkout -b temp-conflict-resolve
git merge main
# Resolve conflicts
git add .
git commit -m "resolve: merge conflicts with main"
git checkout feature/frontend
git merge temp-conflict-resolve
git push origin feature/frontend
git branch -d temp-conflict-resolve
```

**3. Deployment Failure**
```bash
# Check Vercel logs
vercel logs [deployment-url]

# Common issues:
# - Missing environment variables
# - Build timeout (increase in vercel.json)
# - Memory limit exceeded (upgrade plan or optimize build)
```

### When Agent Gets Stuck

**1. Provide More Context**
```bash
sessions_send({
  label: "frontend-agent",
  message: "Context: The NavLink component is in components/ui/NavLink.tsx. Use that for navigation instead of creating a new one."
})
```

**2. Simplify Task**
```bash
sessions_send({
  label: "frontend-agent",
  message: "Stop current work. New simplified task: Create ONLY app/dashboard/page.tsx with a basic layout. Skip the sub-routes for now."
})
```

**3. Restart Session (if unresponsive)**
```bash
# Kill old session, spawn new one with clearer instructions
```

---

## 📊 Success Metrics

**Track these to measure swarm efficiency:**

1. **Time to Integration** - How long from spawn to merged PR?
   - Target: <24 hours per agent
   
2. **Merge Conflict Rate** - How many conflicts per merge?
   - Target: <2 conflicts per merge (with proper file boundaries)
   
3. **CI/CD Pass Rate** - % of pushes that pass all checks first try
   - Target: >80%
   
4. **Deployment Success Rate** - % of deployments that succeed
   - Target: >95%
   
5. **Rework Rate** - % of PRs requiring changes after review
   - Target: <30%

---

## ✅ Pre-Swarm Checklist

Before spawning agents:

- [ ] GitHub repo created and pushed
- [ ] Vercel project connected to GitHub
- [ ] Vercel secrets configured (VERCEL_TOKEN, ORG_ID, PROJECT_ID)
- [ ] GitHub Actions workflows created (preview + production)
- [ ] Branch protection rules set (main cannot be pushed directly)
- [ ] Data models defined (TypeScript interfaces)
- [ ] API contracts defined (function signatures)
- [ ] Task specs written (`.prompt.md` files for each agent)
- [ ] File boundaries clear (who touches what)
- [ ] Integration order decided (which merges first)

---

## 🎓 Key Takeaways

1. **Continuous Integration = Merge early, merge often** (not just using a CI tool)
2. **Conflicts are race conditions** - Reduce time window by integrating frequently
3. **Use agentic primitives** - `.prompt.md`, `.instructions.md`, `.spec.md`
4. **Context engineering** - Give agents only what they need
5. **File boundaries** - Assign non-overlapping files to prevent conflicts
6. **Verification before "done"** - Tests, lint, build, manual check
7. **Incremental delivery** - Small, verifiable slices
8. **Orchestrator validates** - Don't trust blindly, review and test
9. **Automate CI/CD** - GitHub Actions + Vercel for fast feedback
10. **Track metrics** - Time to integration, conflict rate, pass rate

---

**Ready to spawn the swarm!** 🦞🚀
