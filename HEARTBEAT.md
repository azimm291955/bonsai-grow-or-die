# HEARTBEAT.md

## Checks to run

1. **Stale tasks** — run `python3 /root/.openclaw/workspace/tasks/task.py stale --minutes 30`
   - If any stale tasks found, alert Aaron with the task titles and how long they've been stuck
   - If none, continue silently

If nothing needs attention, reply HEARTBEAT_OK.
