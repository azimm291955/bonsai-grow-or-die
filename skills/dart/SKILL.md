# Task Management Skill (Local)

Use this skill whenever Aaron asks to create a task, check task status, update progress, or list open work.
Tasks are stored locally in `/root/.openclaw/workspace/tasks/tasks.json`.

## Core Commands

### Create a task
```bash
python3 /root/.openclaw/workspace/tasks/task.py create "Title" --project "Yieldbook" --description "Optional details"
```

### List tasks
```bash
python3 /root/.openclaw/workspace/tasks/task.py list
python3 /root/.openclaw/workspace/tasks/task.py list --status "In Progress"
```

### Update a task status
```bash
python3 /root/.openclaw/workspace/tasks/task.py update TASK_ID --status "Done"
# Valid statuses: Todo | In Progress | Blocked | Done
```

### Get task details
```bash
python3 /root/.openclaw/workspace/tasks/task.py get TASK_ID
```

### Check for stale tasks (heartbeat use)
```bash
python3 /root/.openclaw/workspace/tasks/task.py stale --minutes 30
```

## Project Prefixes
Use `--project` with these values for easy filtering:
- `Yieldbook` — Next.js app features
- `METRC` — Compliance integration
- `Report` — Weekly production report
- `Moltbook` — Social/LinkedIn content
- `Infra` — Server, cron, OpenClaw setup
- `General` — Everything else

## Workflow Rules

1. **When Aaron assigns a task** → create it immediately, confirm the ID back to Aaron
2. **When a task completes** → update status to `Done`
3. **When a task is blocked** → update to `Blocked` and flag Aaron with the reason
4. **During heartbeats** → run `stale --minutes 30`; if anything is stale, alert Aaron

## What NOT to do
- Don't create tasks for quick one-liners (<2 min)
- Don't mark Done without actually completing the work
- Don't create duplicates — `list` first if unsure
