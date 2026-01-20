export type Rule = {
  id: number;
  rule_name: string;
  included_airline_codes: string | null;
  non_stop: number | null;
  max_allowed_stops: number;
  enabled: number;
};