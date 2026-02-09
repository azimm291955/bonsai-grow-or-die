#!/usr/bin/env python3
"""
Wrapper to run weekly production calculation with Mission Control logging
"""
import sys
import subprocess
import time
from pathlib import Path

# Add logging directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'logging'))

from mission_control_logger import MissionControlLogger

def main():
    logger = MissionControlLogger()
    script_path = Path(__file__).parent.parent / 'gmail-sheets-integration' / 'scripts' / 'calculate_weekly_production.py'
    
    # Log start
    start_time = time.time()
    
    try:
        # Run the production calculation
        result = subprocess.run(
            ['python3', str(script_path)],
            capture_output=True,
            text=True,
            check=True
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Log success
        logger.log_analysis(
            "Weekly production calculation completed",
            file="calculate_weekly_production.py",
            duration=duration_ms,
            success=True
        )
        
        print(result.stdout)
        return 0
        
    except subprocess.CalledProcessError as e:
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Log failure
        logger.log_analysis(
            "Weekly production calculation failed",
            file="calculate_weekly_production.py",
            duration=duration_ms,
            success=False,
            errorMessage=str(e)
        )
        
        print(f"Error: {e}", file=sys.stderr)
        if e.stdout:
            print(e.stdout)
        if e.stderr:
            print(e.stderr, file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
