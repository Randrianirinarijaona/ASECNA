@router.get("/")
async def get_all_airports(skip: int = 0, limit: int = 100):
    ...

@router.post("/")
async def create_airport(airport_in: AirportCreate, current_user=Depends(get_current_admin)):
    ...

@router.get("/{iata}")
async def get_airport(iata: str):
    ...

# CRUD complet + endpoints pour items réseau