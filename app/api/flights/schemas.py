from pydantic import BaseModel
from typing import Optional, List

class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    depart: str
    return_date: Optional[str] = None
    flex_days: int = 0
    adults: int = 1
    travel_class: str = "ECONOMY"
    currency: str = "CAD"


class FlightOffer(BaseModel):
    rule_name: str
    total_price: float
    base_price: float
    currency: str
    carrier: str
    fare_brand: str
    num_stops: int
    stop_airports: List[str]
    total_duration: str
    depart_time: str
    arrive_time: str
    checked_bags: int
    cabin_bags: int
    seats_left: int


class FlightSearchResponse(BaseModel):
    offers: List[FlightOffer]
