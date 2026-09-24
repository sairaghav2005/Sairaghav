import os
from fastapi import FastAPI, Response
from fastapi.responses import HTMLResponse, JSONResponse

app = FastAPI(title="NIDS Security API")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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
    return "<!doctype html><html><body><h1>NIDS Security Dashboard</h1><p>Dashboard is initializing...</p></body></html>"

@app.get("/")
@app.get("/index.html")
async def home():
    return HTMLResponse(content=get_html_content(), status_code=200)

@app.get("/api")
@app.get("/api/health")
async def api_health():
    return {
        "status": "success",
        "message": "Intrusion Detection API is running"
    }

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if full_path.startswith("api"):
        return JSONResponse({"status": "success", "message": "Intrusion Detection API is running"})

    # Check for static asset files
    for base in [os.path.join(BASE_DIR, "public"), os.path.join(BASE_DIR, "frontend", "dist"), "public", "frontend/dist"]:
        target = os.path.join(base, full_path)
        if os.path.exists(target) and os.path.isfile(target):
            with open(target, "rb") as f:
                data = f.read()
            media = "application/javascript" if full_path.endswith(".js") else "text/css" if full_path.endswith(".css") else "text/plain"
            return Response(content=data, media_type=media)

    # Single Page App fallback for all UI routes
    return HTMLResponse(content=get_html_content(), status_code=200)
