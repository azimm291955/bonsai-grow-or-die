# Agent Team Management - Anthropic C Compiler Insights

**Source:** https://www.anthropic.com/engineering/building-c-compiler  
**Date:** 2026-02-06  
**Context:** Building Bonsai Yieldbook with agent teams

---

## Core Architecture

### 1. Autonomous Agent Loop
- **Simple infinite loop:** Agent completes task → picks next task → repeat
- No human intervention required between tasks
- Run in containers for isolation
- Agent prompt should instruct: break into small pieces, track progress, decide next task, keep going

### 2. Parallel Agent Teams (16 agents in C compiler project)
- **Git-based synchronization:**
  - Bare upstream repo
  - Each agent gets Docker container + local clone
  - Agent works locally → pushes to upstream
  - Pull → merge → push workflow

### 3. Task Locking Mechanism
- **Prevent duplicate work:**
  - Agent "claims" task by writing lock file (e.g., `current_tasks/parse_if_statement.txt`)
  - Git synchronization prevents two agents from claiming same task
  - Agent works → merges changes → pushes → removes lock
  - Merge conflicts happen frequently (agents handle them)

### 4. No Orchestration Agent
- Each agent decides what to work on independently
- Picks "next most obvious" problem
- Maintains running docs of failed approaches + remaining tasks
- Self-organizing system

---

## Critical Design Principles

### Write Extremely High-Quality Tests
- **Agent will solve whatever you test for** → tests must be nearly perfect
- Bad tests = agents solve the wrong problem
- Continuous integration prevents breaking existing features
- Strictness matters: new commits shouldn't break old code

### Design Environment FOR Agents (Not Humans)
**Context window pollution:**
- Don't print thousands of useless bytes
- Print minimal output, log details to files
- Use `grep`-friendly formats: `ERROR: reason on same line`
- Pre-compute aggregate statistics (don't make agent recalculate)

**Time blindness:**
- Agents can't tell time → will run tests for hours
- Print incremental progress infrequently
- Add `--fast` option: run 1-10% random sample
- Make sample deterministic per-agent but random across VMs

**Orientation:**
- Agents dropped into fresh containers with no context
- Maintain extensive READMEs + progress files
- Update frequently with current status
- Help agents help themselves

### Make Parallelism Easy
**Independent tasks:**
- Many distinct failing tests = easy parallelization
- Each agent picks different failing test

**Shared tasks (harder):**
- Example: Linux kernel = one giant task
- All agents hit same bug → overwrite each other
- **Solution:** Use oracle/reference to split work
  - C compiler used GCC as "known-good" oracle
  - Random subset compiled with test compiler vs reference
  - If works → test different files
  - If breaks → refine which files cause failure
  - Agents work on different bugs in different files

### Multiple Agent Roles (Specialization)
- **Code deduplication agent** - coalesces duplicate implementations
- **Performance agent** - improves compiler speed
- **Optimization agent** - outputs efficient compiled code
- **Architecture critic** - reviews design, makes structural improvements
- **Documentation agent** - maintains docs

---

## Real-World Results (C Compiler Benchmark)

**Scope:**
- 100,000 lines of Rust
- Compiles Linux 6.9 (x86, ARM, RISC-V)
- Compiles QEMU, FFmpeg, SQLite, postgres, redis
- 99% pass rate on GCC torture test suite
- Can compile and run Doom 😎

**Cost:**
- 2,000 Claude Code sessions over 2 weeks
- 2 billion input tokens
- 140 million output tokens
- **Total cost: ~$20,000**
- Still cheaper than human team equivalent

**Limitations:**
- New features frequently broke existing functionality (at the limits of Opus 4.6)
- Some features couldn't be implemented (e.g., 16-bit x86 codegen)
- Generated code less efficient than GCC
- Not yet drop-in replacement for production compiler

---

## Applying to Bonsai Yieldbook

### Phase 1: Foundation (Current)
- Build single-agent workflow first
- High-quality test suite for data analysis accuracy
- Clean git workflow + continuous integration

### Phase 2: Agent Team (Future)
**Potential specialized agents:**
1. **Data Analysis Agent** - weekly reports, trends, insights
2. **Frontend Agent** - Next.js components, UI/UX
3. **Backend Agent** - API routes, database operations
4. **Testing Agent** - E2E tests, data validation
5. **Documentation Agent** - README, API docs, user guides
6. **METRC Integration Agent** - API sync, compliance mapping

**Task structure:**
- Each feature = lockable task
- Clear success criteria (tests pass, feature works)
- Independent components (charts, forms, API endpoints)

**Testing strategy:**
- Unit tests for calculations (g/sq ft, yield conversions)
- Integration tests for data pipelines
- E2E tests for user workflows
- Regression tests to prevent breaking changes

### Phase 3: Continuous Improvement
- Monitor agent performance
- Refine prompts based on failure patterns
- Add specialized agents as needs emerge
- Build feedback loops (measure → learn → improve)

---

## Key Warnings

### Quality Control
- "Easy to see tests pass and assume job is done" - RARELY the case
- Autonomous systems need human verification
- Don't deploy code you haven't personally verified

### Risks
- Rapid progress is exciting but concerning
- Potential to write enormous amounts of new code quickly
- Requires new safety strategies

### Author's Concern (Nicholas Carlini, Anthropic Safeguards Team)
> "I did not expect this to be anywhere near possible so early in 2026."

---

## Next Steps for Bonsai Yieldbook

1. **Finish current manual development** (production chart automation)
2. **Build comprehensive test suite** (data accuracy is CRITICAL)
3. **Set up git-based workflow** (proper branching, CI/CD)
4. **Experiment with 2-3 agent parallelization** (smaller scale first)
5. **Scale to full team** only after proving smaller team works

**Priority:** Get the testing infrastructure right FIRST. Everything else depends on it.

---

*Notes prepared for Aaron C. Zimmerman - Bonsai Cultivation*  
*Application: Bonsai Yieldbook agent team development (PRIVATE PROJECT)*
