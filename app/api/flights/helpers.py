from typing import Dict, Any, List

def get_stops(offer: dict) -> list[str]:
    stops = []
    for itinerary in offer.get("itineraries", []):
        for seg in itinerary.get("segments", [])[:-1]:
            arrival = seg.get("arrival", {}).get("iataCode")
            if arrival:
                stops.append(arrival)
    return stops


def count_stops(offer: Dict[str, Any]) -> int:
    max_stops = 0
    for it in offer.get("itineraries", []):
        max_stops = max(max_stops, len(it.get("segments", [])) - 1)
    return max_stops


def get_total_duration(offer: dict) -> str:
    return offer["itineraries"][0]["duration"]


def get_depart_and_arrive_times(offer: dict) -> tuple[str, str]:
    segments = offer["itineraries"][0]["segments"]
    return segments[0]["departure"]["at"], segments[-1]["arrival"]["at"]


def get_baggage_info(offer: dict) -> tuple[int, int]:
    fares = offer.get("travelerPricings", [{}])[0].get("fareDetailsBySegment", [])
    if not fares:
        return 0, 0
    return (
        fares[0].get("includedCheckedBags", {}).get("quantity", 0),
        fares[0].get("includedCabinBags", {}).get("quantity", 0),
    )


def get_fare_brand(offer: dict) -> str:
    fares = offer.get("travelerPricings", [{}])[0].get("fareDetailsBySegment", [])
    return fares[0].get("brandedFareLabel", "UNKNOWN") if fares else "UNKNOWN"
