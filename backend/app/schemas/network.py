from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class NetworkItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "operational"

class NetworkItemCreate(NetworkItemBase):
    pass

class NetworkSubParameterCreate(BaseModel):
    title: str
    value: str
    status: str = "operational"

class NetworkLinkCreate(BaseModel):
    category: str
    item_title: str
    from_airport_iata: str
    to_airport_iata: str

class LinkParameterCreate(BaseModel):
    name: str

class LinkParameterValueCreate(BaseModel):
    name: str
    text_value: str