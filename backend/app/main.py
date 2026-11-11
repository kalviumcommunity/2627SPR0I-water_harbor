from fastapi import FastAPI


app = FastAPI(title="Campus WaterPoint Board")


@app.get("/")
def root():
    return {"message": "WaterPoint Board API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}