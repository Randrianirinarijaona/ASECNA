from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.v1.endpoints import auth, users, airports, network_links, network_items

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ASECNA Madagascar - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(airports.router, prefix="/api/airports", tags=["airports"])
app.include_router(network_links.router, prefix="/api/links", tags=["links"])
app.include_router(network_items.router, prefix="/api/network", tags=["network"])

@app.get("/")
async def root():
    return {"status": "ok", "message": "ASECNA Backend is running"}