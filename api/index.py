from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {
        "status": "success",
        "message": "Intrusion Detection API is running"
    }
