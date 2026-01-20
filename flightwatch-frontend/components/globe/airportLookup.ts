export type Airport = {
  iata: string;
  name: string;
  lat: number;
  lon: number;
};

export async function fetchAirport(iata: string): Promise<Airport> {
  const res = await fetch(`/api/airports/${iata}`);

  if (!res.ok) {
    throw new Error(`Airport ${iata} not found`);
  }

  return res.json();
}
