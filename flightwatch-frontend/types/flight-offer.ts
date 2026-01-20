import type { ItineraryTiming } from "@/types/itinerary-timing";

export type FlightOffer = {
  rule_name: string;
  total_price: number;
  base_price: number;
  currency: string;
  carrier: string;
  outbound_flight_numbers: string[];
  inbound_flight_numbers?: string[] | null;
  fare_brand: string;
  num_stops: number;
  total_duration: string;
  stop_airports_outbound: string[];
  stop_airports_inbound?: string[] | null;
  outbound: ItineraryTiming;
  inbound?: ItineraryTiming | null;
  checked_bags: number;
  cabin_bags: number;
  seats_left: number;
};