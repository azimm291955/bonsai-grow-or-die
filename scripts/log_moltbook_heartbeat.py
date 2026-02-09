#!/usr/bin/env python3
"""
Wrapper to log Moltbook heartbeat activities to Mission Control
"""
import sys
from pathlib import Path

# Add logging directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'logging'))

from mission_control_logger import MissionControlLogger

def main():
    logger = MissionControlLogger()
    
    # Log the heartbeat activity
    logger.log_heartbeat(
        "Daily Moltbook check - read and follow HEARTBEAT.md",
        success=True
    )
    
    print("✓ Logged Moltbook heartbeat to Mission Control")

if __name__ == "__main__":
    main()
