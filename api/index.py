import os
import json
import random
from datetime import datetime
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse

app = FastAPI(title="NIDS Security Dashboard API")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# In-memory mock data state for serverless execution
sample_ips = [
    "185.220.101.5", "45.33.32.156", "192.168.1.105", "103.251.167.20",
    "91.240.118.172", "198.51.100.44", "203.0.113.195", "192.168.1.200"
]
attack_categories = ["DoS", "Probe", "R2L", "U2R"]

blocked_ips = {
    "185.220.101.5": {
        "ip": "185.220.101.5",
        "blockedAt": datetime.utcnow().isoformat(),
        "reason": "SYN Flood DDoS attempt detected",
        "attack_category": "DoS"
    },
    "192.168.1.105": {
        "ip": "192.168.1.105",
        "blockedAt": datetime.utcnow().isoformat(),
        "reason": "Brute force SSH dictionary attack",
        "attack_category": "R2L"
    }
}

alerts_data = [
    {"id": 1, "timestamp": datetime.utcnow().isoformat(), "time": "Just now", "src_ip": "185.220.101.5", "dst_ip": "10.0.0.15", "attack_category": "DoS", "severity": "CRITICAL", "status": "new", "confidence": 0.98},
    {"id": 2, "timestamp": datetime.utcnow().isoformat(), "time": "4 mins ago", "src_ip": "45.33.32.156", "dst_ip": "10.0.0.4", "attack_category": "Probe", "severity": "HIGH", "status": "investigating", "confidence": 0.91},
    {"id": 3, "timestamp": datetime.utcnow().isoformat(), "time": "12 mins ago", "src_ip": "192.168.1.105", "dst_ip": "10.0.0.2", "attack_category": "R2L", "severity": "MEDIUM", "status": "resolved", "confidence": 0.86},
    {"id": 4, "timestamp": datetime.utcnow().isoformat(), "time": "22 mins ago", "src_ip": "103.251.167.20", "dst_ip": "10.0.0.8", "attack_category": "U2R", "severity": "CRITICAL", "status": "new", "confidence": 0.96},
    {"id": 5, "timestamp": datetime.utcnow().isoformat(), "time": "35 mins ago", "src_ip": "91.240.118.172", "dst_ip": "10.0.0.12", "attack_category": "DoS", "severity": "HIGH", "status": "new", "confidence": 0.93},
    {"id": 6, "timestamp": datetime.utcnow().isoformat(), "time": "45 mins ago", "src_ip": "198.51.100.44", "dst_ip": "10.0.0.7", "attack_category": "Probe", "severity": "LOW", "status": "resolved", "confidence": 0.79}
]

simulator_running = True

def get_html_content():
    candidates = [
        os.path.join(BASE_DIR, "public", "index.html"),
        os.path.join(BASE_DIR, "frontend", "dist", "index.html"),
        "public/index.html",
        "frontend/dist/index.html",
        "index.html",
    ]
    for p in candidates:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                return f.read()
    return "<!doctype html><html><body><h1>NIDS Dashboard</h1></body></html>"

@app.get("/")
@app.get("/index.html")
async def root():
    return HTMLResponse(content=get_html_content(), status_code=200)

@app.get("/api/v1/stats/summary")
@app.get("/stats/summary")
async def stats_summary():
    timeline = [
        {"timestamp": "12:00", "normal": 320, "malicious": 14},
        {"timestamp": "12:15", "normal": 380, "malicious": 22},
        {"timestamp": "12:30", "normal": 310, "malicious": 18},
        {"timestamp": "12:45", "normal": 420, "malicious": 35},
        {"timestamp": "13:00", "normal": 390, "malicious": 19},
        {"timestamp": "13:15", "normal": 450, "malicious": 28},
        {"timestamp": "13:30", "normal": 410, "malicious": 16},
    ]
    critical_count = sum(1 for a in alerts_data if a.get("severity") == "CRITICAL")
    top_sources = [
        {"ip": "185.220.101.5", "count": 18, "isBlocked": "185.220.101.5" in blocked_ips},
        {"ip": "45.33.32.156", "count": 12, "isBlocked": "45.33.32.156" in blocked_ips},
        {"ip": "192.168.1.105", "count": 9, "isBlocked": "192.168.1.105" in blocked_ips},
        {"ip": "103.251.167.20", "count": 7, "isBlocked": "103.251.167.20" in blocked_ips},
        {"ip": "91.240.118.172", "count": 5, "isBlocked": "91.240.118.172" in blocked_ips},
    ]
    return {
        "total_traffic": 14850 + random.randint(10, 50),
        "total_alerts": len(alerts_data),
        "critical_alerts": critical_count,
        "blocked_ips_count": len(blocked_ips),
        "model_accuracy": 0.985,
        "timeline": timeline,
        "attack_breakdown": {"DoS": 24, "Probe": 14, "R2L": 6, "U2R": 4, "Normal": 480},
        "top_sources": top_sources
    }

@app.get("/api/v1/alerts")
@app.get("/alerts")
async def get_alerts():
    return {
        "alerts": alerts_data,
        "total": len(alerts_data),
        "page": 1,
        "page_size": 20
    }

@app.get("/api/v1/firewall/blocked")
@app.get("/firewall/blocked")
async def get_blocked():
    return {
        "blocked": list(blocked_ips.values()),
        "count": len(blocked_ips)
    }

@app.post("/api/v1/firewall/block")
@app.post("/firewall/block")
async def block_ip(request: Request):
    try:
        body = await request.json()
        ip = body.get("ip")
        if ip:
            blocked_ips[ip] = {
                "ip": ip,
                "blockedAt": datetime.utcnow().isoformat(),
                "reason": body.get("reason", "Manual block via dashboard"),
                "attack_category": body.get("attack_category", "Suspicious Host")
            }
            return {"success": True, "message": f"IP {ip} blocked"}
    except Exception:
        pass
    return {"success": True}

@app.post("/api/v1/firewall/unblock")
@app.post("/firewall/unblock")
async def unblock_ip(request: Request):
    try:
        body = await request.json()
        ip = body.get("ip")
        if ip in blocked_ips:
            del blocked_ips[ip]
    except Exception:
        pass
    return {"success": True}

@app.get("/api/v1/simulator/status")
@app.get("/simulator/status")
async def simulator_status():
    return {"running": simulator_running}

@app.post("/api/v1/simulator/start")
@app.post("/simulator/start")
async def simulator_start():
    global simulator_running
    simulator_running = True
    return {"running": True}

@app.post("/api/v1/simulator/stop")
@app.post("/simulator/stop")
async def simulator_stop():
    global simulator_running
    simulator_running = False
    return {"running": False}

@app.get("/api/v1/live-feed/poll")
@app.get("/live-feed/poll")
async def live_feed_poll():
    is_malicious = random.random() < 0.28
    src = random.choice(sample_ips)
    dst = f"10.0.0.{random.randint(1, 40)}"
    cat = random.choice(attack_categories) if is_malicious else "Normal"
    conf = round(0.88 + random.random() * 0.11, 3) if is_malicious else round(0.92 + random.random() * 0.07, 3)
    packet = {
        "packet_id": f"pkt-{int(datetime.utcnow().timestamp())}-{random.randint(100, 999)}",
        "timestamp": datetime.utcnow().isoformat(),
        "src_ip": src,
        "dst_ip": dst,
        "protocol": random.choice(["TCP", "UDP", "ICMP"]),
        "port": random.choice([80, 443, 22, 8080, 53, 3389]),
        "flow_duration": random.randint(500, 60000),
        "flow_bytes_s": random.randint(1000, 300000),
        "flow_packets_s": random.randint(20, 2500),
        "total_fwd_packets": random.randint(1, 45),
        "total_bwd_packets": random.randint(0, 30),
        "prediction": "ATTACK" if is_malicious else "NORMAL",
        "attack_type": cat,
        "confidence": conf,
        "risk_level": "High" if is_malicious and conf > 0.94 else "Medium" if is_malicious else "Low",
        "blocked": src in blocked_ips
    }
    return {
        "packet": packet,
        "alert": None,
        "totalPackets": 14890 + random.randint(1, 50),
        "activeAlerts": len(alerts_data)
    }

@app.post("/api/v1/auth/login")
async def auth_login():
    return {"access_token": "mock-jwt-token", "token_type": "bearer"}

@app.get("/api/v1/auth/me")
async def auth_me():
    return {"username": "admin", "email": "admin@nids.local", "is_active": True}

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if full_path.startswith("api"):
        return JSONResponse({"status": "success", "message": "API endpoint not matched"})

    # Check public or frontend/dist for static assets
    for base in [os.path.join(BASE_DIR, "public"), os.path.join(BASE_DIR, "frontend", "dist"), "public", "frontend/dist"]:
        target = os.path.join(base, full_path)
        if os.path.exists(target) and os.path.isfile(target):
            with open(target, "rb") as f:
                data = f.read()
            media = "application/javascript" if full_path.endswith(".js") else "text/css" if full_path.endswith(".css") else "text/plain"
            return Response(content=data, media_type=media)

    # SPA fallback for routes like /monitoring, /upload, /alerts
    return HTMLResponse(content=get_html_content(), status_code=200)
