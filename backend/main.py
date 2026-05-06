
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.chat import router as chat_router
from routes.code import router as code_router

# ---------------- APP INIT ----------------
app = FastAPI(
    title="AI IDE Backend",
    description="Multi-agent AI coding assistant with RAG",
    version="1.0.0",
)

# ---------------- CORS FIX ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ai-ide-frontend2.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- ROUTES ----------------
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(code_router, prefix="/api", tags=["Code"])

# ---------------- HEALTH CHECK ----------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "AI IDE Backend"
    }

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv

# load_dotenv()

# from routes.chat import router as chat_router
# from routes.code import router as code_router

# app = FastAPI(
#     title="AI IDE Backend",
#     description="Multi-agent AI coding assistant with RAG",
#     version="1.0.0",
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(chat_router, prefix="/api", tags=["Chat"])
# app.include_router(code_router, prefix="/api", tags=["Code"])


# @app.get("/health")
# async def health():
#     return {"status": "ok", "service": "AI IDE Backend"}


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
