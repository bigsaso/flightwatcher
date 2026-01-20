from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WatchCreate(BaseModel):
    rule_id: int
    origin: str
    destination: str
    depart_date: str
    return_date: Optional[str] = None
    flex_days: int = 0
    adults: int = 1
    travel_class: str = "ECONOMY"
    currency: str = "CAD"


class WatchUpdate(BaseModel):
    enabled: bool


class Watch(BaseModel):
    id: int
    rule_id: int
    rule_name: str
    origin: str
    destination: str
    depart_date: str
    return_date: Optional[str]
    flex_days: int
    adults: int
    travel_class: str
    currency: str
    enabled: bool
    created_at: str
