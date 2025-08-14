export type AirportCoords = Record<string, [number, number]>;

async function loadOnce(): Promise<AirportCoords> {  
  try {
    const url = new URL('/data/airports.iata.geojson', window.location.origin).toString();
    const res = await fetch(url);
    const json = await res.json() as {
      features: Array<{ properties: { iata: string }; geometry: { coordinates: [number, number] } }>;
    };
    const map: AirportCoords = {};
    for (const f of json.features) map[f.properties.iata] = f.geometry.coordinates;
    return map;
  } catch (error: unknown) {
    console.error('Failed to load airport coordinates:', error);
    return {};
  }
}

export async function ensureAirportCoordsLoaded(): Promise<void> {
  await loadOnce();
}

export async function getAirportCoord(iata: string): Promise<[number, number] | undefined> {
  const coords = await loadOnce();
  return coords[iata];
}