from pydantic import BaseModel
from typing import Optional, List

class ItineraryTiming(BaseModel):
    depart_time: str
    arrive_time: str
    duration: Optional[str] = None


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
    # stop_airports: List[str]
    total_duration: str
    stop_airports_outbound: List[str]
    stop_airports_inbound: Optional[List[str]] = None
    # depart_time: str
    # arrive_time: str
    outbound: ItineraryTiming
    inbound: Optional[ItineraryTiming] = None
    checked_bags: int
    cabin_bags: int
    seats_left: int


class FlightSearchResponse(BaseModel):
    offers: List[FlightOffer]
