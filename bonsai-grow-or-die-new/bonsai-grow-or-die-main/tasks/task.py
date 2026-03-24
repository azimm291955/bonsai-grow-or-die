#!/usr/bin/env python3
"""
Bonsai Task Manager — local task board for OpenClaw
Usage:
  task.py create "Title" [--description "..."] [--project "Yieldbook"]
  task.py list [--status "In Progress"]
  task.py update ID --status "Done"
  task.py get ID
  task.py stale [--minutes 30]
"""

import json
import argparse
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

TASKS_FILE = Path(__file__).parent / "tasks.json"

VALID_STATUSES = ["Todo", "In Progress", "Blocked", "Done"]


def load_tasks():
    if not TASKS_FILE.exists():
        return []
    with open(TASKS_FILE) as f:
        return json.load(f)


def save_tasks(tasks):
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def cmd_create(args):
    tasks = load_tasks()
    task = {
        "id": str(uuid.uuid4())[:8],
        "title": args.title,
        "description": args.description or "",
        "project": args.project or "General",
        "status": "In Progress",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    tasks.append(task)
    save_tasks(tasks)
    print(f"✅ Created [{task['id']}] {task['title']} ({task['project']}) — In Progress")
    return task


def cmd_list(args):
    tasks = load_tasks()
    status_filter = args.status if hasattr(args, "status") else None
    filtered = [t for t in tasks if not status_filter or t["status"] == status_filter]
    if not filtered:
        print("No tasks found.")
        return
    for t in filtered:
        updated = t["updated_at"][:16].replace("T", " ")
        print(f"[{t['id']}] {t['status']:12} | {t['project']:12} | {t['title']}  (updated {updated})")


def cmd_update(args):
    tasks = load_tasks()
    if args.status not in VALID_STATUSES:
        print(f"❌ Invalid status. Choose from: {', '.join(VALID_STATUSES)}")
        sys.exit(1)
    for t in tasks:
        if t["id"] == args.id:
            t["status"] = args.status
            t["updated_at"] = now_iso()
            save_tasks(tasks)
            print(f"✅ [{t['id']}] {t['title']} → {args.status}")
            return
    print(f"❌ Task {args.id} not found.")
    sys.exit(1)


def cmd_get(args):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] == args.id:
            print(json.dumps(t, indent=2))
            return
    print(f"❌ Task {args.id} not found.")
    sys.exit(1)


def cmd_stale(args):
    """List In Progress tasks not updated in the last N minutes."""
    tasks = load_tasks()
    minutes = args.minutes if hasattr(args, "minutes") else 30
    now = datetime.now(timezone.utc)
    stale = []
    for t in tasks:
        if t["status"] == "In Progress":
            updated = datetime.fromisoformat(t["updated_at"])
            age_minutes = (now - updated).total_seconds() / 60
            if age_minutes > minutes:
                stale.append((t, int(age_minutes)))
    if not stale:
        print(f"✅ No stale tasks (threshold: {minutes} min)")
        return
    print(f"⚠️  Stale tasks (>{minutes} min with no update):")
    for t, age in stale:
        print(f"  [{t['id']}] {t['title']} — {age} min ago")


def main():
    parser = argparse.ArgumentParser(description="Bonsai Task Manager")
    sub = parser.add_subparsers(dest="command")

    # create
    p_create = sub.add_parser("create")
    p_create.add_argument("title")
    p_create.add_argument("--description", default="")
    p_create.add_argument("--project", default="General")

    # list
    p_list = sub.add_parser("list")
    p_list.add_argument("--status", default=None)

    # update
    p_update = sub.add_parser("update")
    p_update.add_argument("id")
    p_update.add_argument("--status", required=True)

    # get
    p_get = sub.add_parser("get")
    p_get.add_argument("id")

    # stale
    p_stale = sub.add_parser("stale")
    p_stale.add_argument("--minutes", type=int, default=30)

    args = parser.parse_args()
    if args.command == "create":
        cmd_create(args)
    elif args.command == "list":
        cmd_list(args)
    elif args.command == "update":
        cmd_update(args)
    elif args.command == "get":
        cmd_get(args)
    elif args.command == "stale":
        cmd_stale(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
