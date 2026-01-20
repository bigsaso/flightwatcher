const {
  getAirportByIata
} = require('airport-data-js');

export async function GET(
  _req: Request,
  context: { params: Promise<{ iata: string }> }
) {
  const { iata } = await context.params;
  const code = iata.toUpperCase();

  const airports = await getAirportByIata(code)
  const airport = airports?.[0]

  if (!airports || airports.length === 0) {
    return Response.json(
      { error: "Airport not found" },
      { status: 404 }
    );
  }
  
  const payload = {
    iata: airport.iata,
    name: airport.airport,
    lat: airport.latitude,
    lon: airport.longitude,
  }

  return Response.json(payload);
}
