from fastapi import FastAPI

app = FastAPI(
    title="Digital Twin AI Backend API",
    description="Backend services for Digital Twin AI simulation and prediction system.",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"message": "Digital Twin AI API is running", "status": "online"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
