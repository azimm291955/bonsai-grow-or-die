"""
Mission Control Activity Logger for Python Scripts

Usage:
    from logging.python_logger import MissionControlLogger
    
    logger = MissionControlLogger()
    logger.log_activity(
        type="analysis",
        description="Generated weekly production report",
        metadata={
            "file": "production_report.pdf",
            "duration": 1234
        }
    )
"""

import requests
import json
import time
from typing import Optional, Dict, Any

class MissionControlLogger:
    def __init__(self, convex_http_url: Optional[str] = None):
        """
        Initialize the logger with Convex HTTP API endpoint.
        
        Args:
            convex_http_url: Your Convex deployment HTTP URL
                            (e.g., "https://your-deployment.convex.site")
                            If not provided, reads from CONVEX_HTTP_URL env var
        """
        import os
        self.convex_url = convex_http_url or os.getenv("CONVEX_HTTP_URL")
        
        if not self.convex_url:
            print("Warning: CONVEX_HTTP_URL not set. Logger will print to stdout only.")
    
    def log_activity(
        self,
        type: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
        print_log: bool = True
    ) -> bool:
        """
        Log an activity to Mission Control.
        
        Args:
            type: Activity type (analysis, email, file_op, cron, heartbeat, other)
            description: Human-readable description of the activity
            metadata: Optional dictionary with additional context:
                - file: str - file path/name
                - recipient: str - email recipient or destination
                - command: str - command executed
                - duration: int - duration in milliseconds
                - success: bool - whether the action succeeded
                - errorMessage: str - error message if failed
                - additionalData: str - any extra JSON data
            print_log: Whether to print the log to stdout
        
        Returns:
            True if logged successfully, False otherwise
        """
        log_data = {
            "type": type,
            "description": description,
            "timestamp": int(time.time() * 1000)
        }
        
        if metadata:
            log_data["metadata"] = metadata
        
        if print_log:
            print(f"[Mission Control] {type.upper()}: {description}")
            if metadata:
                print(f"  Metadata: {json.dumps(metadata, indent=2)}")
        
        if not self.convex_url:
            return False
        
        try:
            response = requests.post(
                f"{self.convex_url}/api/activities/log",
                json=log_data,
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            print(f"[Mission Control] Error logging activity: {e}")
            return False
    
    # Convenience methods for common activity types
    
    def log_analysis(self, description: str, **metadata):
        """Log an analysis activity."""
        return self.log_activity("analysis", description, metadata)
    
    def log_email(self, description: str, recipient: str, **metadata):
        """Log an email activity."""
        metadata["recipient"] = recipient
        return self.log_activity("email", description, metadata)
    
    def log_file_operation(self, description: str, file: str, **metadata):
        """Log a file operation activity."""
        metadata["file"] = file
        return self.log_activity("file_op", description, metadata)
    
    def log_cron(self, description: str, command: str, **metadata):
        """Log a cron job execution."""
        metadata["command"] = command
        return self.log_activity("cron", description, metadata)
    
    def log_heartbeat(self, description: str = "Heartbeat check", **metadata):
        """Log a heartbeat activity."""
        return self.log_activity("heartbeat", description, metadata)


# Example usage
if __name__ == "__main__":
    logger = MissionControlLogger()
    
    # Example 1: Simple log
    logger.log_activity(
        type="analysis",
        description="Generated weekly production report"
    )
    
    # Example 2: With metadata
    logger.log_analysis(
        "Analyzed sales data for Q1 2024",
        file="sales_q1_2024.csv",
        duration=2500,
        success=True
    )
    
    # Example 3: Email log
    logger.log_email(
        "Sent weekly summary report",
        recipient="aaron@example.com",
        success=True
    )
    
    # Example 4: File operation
    logger.log_file_operation(
        "Updated MEMORY.md with latest insights",
        file="MEMORY.md",
        success=True
    )
    
    # Example 5: Cron job
    logger.log_cron(
        "Executed daily backup",
        command="backup.sh",
        duration=5000,
        success=True
    )
    
    # Example 6: Error handling
    logger.log_activity(
        type="analysis",
        description="Failed to process data file",
        metadata={
            "file": "corrupted_data.csv",
            "success": False,
            "errorMessage": "File format invalid"
        }
    )
