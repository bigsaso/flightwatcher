from typing import Dict, Any, List, Tuple, Optional


def extract_flight_numbers(
    offer: Dict,
) -> Tuple[List[str], Optional[List[str]]]:
    """
    Returns:
      outbound_flight_numbers: ["TS342"] or ["AZ651", "AZ1165"]
      inbound_flight_numbers: same format, or None
    """
    itineraries = offer.get("itineraries", [])

    def extract(itinerary: Dict) -> List[str]:
        nums: List[str] = []
        for segment in itinerary.get("segments", []):
            carrier = segment.get("carrierCode")
            number = segment.get("number")
            if carrier and number:
                nums.append(f"{carrier}{number}")
        return nums

    outbound = extract(itineraries[0]) if len(itineraries) >= 1 else []

    inbound = (
        extract(itineraries[1])
        if len(itineraries) >= 2
        else None
    )

    return outbound, inbound


def count_stops(offer: Dict[str, Any]) -> int:
    max_stops = 0
    for it in offer.get("itineraries", []):
        max_stops = max(max_stops, len(it.get("segments", [])) - 1)
    return max_stops


def extract_stops_by_itinerary(offer: dict) -> dict:
    """
    Returns stop airports split by outbound and inbound itineraries.
    """
    itineraries = offer.get("itineraries", [])

    def stops_for_itinerary(itinerary):
        segments = itinerary.get("segments", [])
        # stops are arrivals of all segments except the last
        return [
            seg["arrival"]["iataCode"]
            for seg in segments[:-1]
            if "arrival" in seg and "iataCode" in seg["arrival"]
        ]

    outbound_stops = stops_for_itinerary(itineraries[0]) if len(itineraries) >= 1 else []
    inbound_stops = stops_for_itinerary(itineraries[1]) if len(itineraries) >= 2 else None

    return {
        "stop_airports_outbound": outbound_stops,
        "stop_airports_inbound": inbound_stops,
    }


def get_total_duration(offer: dict) -> str:
    return offer["itineraries"][0]["duration"]


def extract_itinerary_times(offer: dict) -> dict:
    """
    Returns outbound/inbound timing blocks.
    """
    itineraries = offer.get("itineraries", [])

    def block(itinerary):
        segments = itinerary.get("segments", [])
        if not segments:
            return None

        return {
            "depart_time": segments[0]["departure"]["at"],
            "arrive_time": segments[-1]["arrival"]["at"],
            "duration": itinerary.get("duration"),
        }

    outbound = block(itineraries[0]) if len(itineraries) >= 1 else None
    inbound = block(itineraries[1]) if len(itineraries) >= 2 else None

    return {
        "outbound": outbound,
        "inbound": inbound,
    }


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
