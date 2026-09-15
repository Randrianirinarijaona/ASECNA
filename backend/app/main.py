from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, users, admin, airports, network_items, network_links, local_points

app = FastAPI(
    title=settings.APP_NAME,
    description="API backend pour l'application de gestion du réseau ASECNA (aéroports, SFA/SMA/SRNA, liaisons).",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(airports.router)
app.include_router(network_items.router)
app.include_router(network_links.router)
app.include_router(local_points.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
