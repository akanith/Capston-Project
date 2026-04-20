"""
WildShield-FL: Alerts dynamic backend
"""

from fastapi import APIRouter
from datetime import datetime
from typing import List

router = APIRouter(tags=["Alerts"])

# Global in-memory alert storage (Standardized list name)
alerts = []

@router.get("/alerts")
async def get_alerts():
    """Return all historical alerts from memory."""
    return alerts

@router.post("/alerts/clear")
async def clear_alerts():
    """Wipe the alert feed."""
    global alerts
    alerts = []
    return {"success": True, "message": "Alert feed cleared"}

def trigger_alert(alert_type: str, message: str):
    """
    Helper to create an alert and push it into the global list.
    Supports: "poaching", "detection", "rare", "system"
    """
    new_alert = {
        "id": f"alert-{int(datetime.now().timestamp())}",
        "type": alert_type,
        "message": message,
        "time": datetime.now().strftime("%H:%M:%S"), # To match user requested key "time"
        "timestamp": datetime.now().isoformat()
    }
    # Insert at beginning (newest first)
    alerts.insert(0, new_alert)
    
    # Cap at 50 alerts to prevent memory bloat
    if len(alerts) > 50:
        alerts.pop()
        
    return new_alert

# Initial system boot alert
trigger_alert("system", "AI Monitoring Pipeline Re-initialized")
