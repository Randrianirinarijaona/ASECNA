from pydantic import BaseModel
from typing import Optional

class AirportBase(BaseModel):
    iata: str
    name: str
    latitude: float
    longitude: float

class AirportCreate(AirportBase):
    is_technical_point: bool = False

class AirportRead(AirportBase):
    is_technical_point: bool
    created_at: datetime

    class Config:
        from_attributes = True