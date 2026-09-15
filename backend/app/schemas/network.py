from typing import Optional
from app.models.network import NetworkCategoryEnum, ItemStatusEnum, SubParamStatusEnum
from app.schemas.base import CamelModel


class SubParameterCreate(CamelModel):
    title: str
    value: str
    description: Optional[str] = None


class SubParameterOut(CamelModel):
    id: str
    title: str
    value: str
    status: SubParamStatusEnum
    description: Optional[str] = None


class NetworkItemCreate(CamelModel):
    title: str
    status: Optional[ItemStatusEnum] = ItemStatusEnum.operational
    description: Optional[str] = None
    details: Optional[list[str]] = None


class NetworkItemUpdate(CamelModel):
    title: Optional[str] = None
    status: Optional[ItemStatusEnum] = None
    description: Optional[str] = None


class NetworkItemOut(CamelModel):
    id: str
    airport_key: str
    category: NetworkCategoryEnum
    title: str
    description: Optional[str] = None
    details: Optional[list[str]] = None
    status: Optional[ItemStatusEnum] = None
    sub_parameters: list[SubParameterOut] = []


class AirportNetworkMatchOut(CamelModel):
    key: str
    matched_title: str
    status: Optional[ItemStatusEnum] = None
    airport_name: str
    airport_iata: str
