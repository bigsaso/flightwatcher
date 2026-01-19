from fastapi import APIRouter
from .schemas import FlightSearchRequest, FlightSearchResponse
from .service import search_flights_service

router = APIRouter(prefix="/flights", tags=["flights"])

@router.post("/search", response_model=FlightSearchResponse)
def search_flights(req: FlightSearchRequest):
    return search_flights_service(req)
