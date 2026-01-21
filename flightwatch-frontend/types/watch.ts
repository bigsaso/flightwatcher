export type Watch = {
  id: number;
  rule_id: number;
  rule_name: string;
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string | null;
  flex_days: number;
  adults: number;
  travel_class: string;
  currency: string;
  enabled: number;
};

export type WatchResult = {
  id: number;
  watch_id: number;
  total_price: number;
  currency: string;
  carrier: string;
  fare_brand: string;

  outbound_depart_time: string;
  outbound_arrive_time: string;
  inbound_depart_time: string | null;
  inbound_arrive_time: string | null;

  checked_bags: number;
  cabin_bags: number;
  seats_left: number;
  adults: number;
  captured_at: string;
};
