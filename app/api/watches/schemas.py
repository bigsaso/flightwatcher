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

class WatchedResultResponse(BaseModel):
    id: int
    watch_id: int
    total_price: float
    currency: str
    carrier: str
    fare_brand: str
    outbound_depart_time: str
    outbound_arrive_time: str
    inbound_depart_time: Optional[str] = None
    inbound_arrive_time: Optional[str] = None

class WatchedResult(BaseModel):
    id: int
    watch_id: int
    adults: int

    total_price: float
    base_price: float
    currency: str

    carrier: str
    fare_brand: str

    outbound_flight_numbers: list[str]
    inbound_flight_numbers: list[str] | None

    num_stops: int
    stop_airports_outbound: list[str]
    stop_airports_inbound: list[str] | None

    outbound_depart_time: str
    outbound_arrive_time: str
    outbound_duration: str | None

    inbound_depart_time: str | None
    inbound_arrive_time: str | None
    inbound_duration: str | None

    checked_bags: int
    cabin_bags: int
    seats_left: int
    captured_at: str
