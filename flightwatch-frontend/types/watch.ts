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
