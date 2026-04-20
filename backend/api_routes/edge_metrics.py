"""
WildShield-FL: Edge Simulation Metrics API
"""

from fastapi import APIRouter
import random
import psutil
import os

router = APIRouter(tags=["Edge Metrics"])

@router.get("/edge-metrics")
async def get_edge_metrics():
    """
    Returns real-time simulated edge device performance metrics.
    """
    # Simulate CPU usage if psutil fails (common in restricted environments)
    try:
        cpu_usage = psutil.cpu_percent()
        ram_usage = psutil.virtual_memory().percent
    except:
        cpu_usage = random.uniform(15.0, 45.0)
        ram_usage = random.uniform(30.0, 60.0)
        
    return {
        "success": True,
        "device_info": "Edge-IoT-Gateway-v4",
        "cpu_usage": round(cpu_usage, 2),
        "ram_usage": round(ram_usage, 2),
        "temperature": round(random.uniform(40.0, 65.0), 1),
        "latency_ms": round(random.uniform(5.0, 25.0), 2),
        "battery_level": round(random.uniform(80.0, 95.0), 1),
        "network_bandwidth_mbps": round(random.uniform(5.0, 15.0), 2)
    }
