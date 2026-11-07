const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const SEARCH_RADIUS_METERS = 5000;
const SEARCH_RADIUS_DEGREES = 0.06;

function distanceBetween(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const toRadians = value => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getAddress(tags) {
  return [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
  ].filter(Boolean).join(', ') || 'Address unavailable from OpenStreetMap';
}

function normalizeShop(element, userLatitude, userLongitude) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!element.tags?.name || latitude == null || longitude == null) return null;

  return {
    id: `${element.type}/${element.id}`,
    name: element.tags.name,
    address: getAddress(element.tags),
    lat: latitude,
    lng: longitude,
    distanceKm: distanceBetween(userLatitude, userLongitude, latitude, longitude),
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
}

export async function fetchNearbyShops(latitude, longitude) {
  const query = `
    [out:json][timeout:35];
    (
      nwr["shop"="copyshop"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      nwr["shop"="printer"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      nwr["shop"="printing"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      nwr["shop"="stationery"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      nwr["craft"="printer"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
    );
    out center tags;
  `;
  const failures = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      });
      if (!response.ok) {
        failures.push(`${response.status} from ${new URL(endpoint).hostname}`);
        continue;
      }

      const data = await response.json();
      const shops = data.elements
        .map(element => normalizeShop(element, latitude, longitude))
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .filter((shop, index, shops) => shops.findIndex(item => item.id === shop.id) === index);
      if (shops.length > 0) return shops;
    } catch (error) {
      failures.push(`${error.name === 'AbortError' ? 'timeout' : 'network error'} from ${new URL(endpoint).hostname}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  const fallbackShops = await fetchFromNominatim(latitude, longitude);
  if (fallbackShops.length > 0) return fallbackShops;

  throw new Error(`No mapped print shops were found near your location. OpenStreetMap search services were unavailable (${failures.join(', ')}).`);
}

async function fetchFromNominatim(latitude, longitude) {
  const viewbox = [
    longitude - SEARCH_RADIUS_DEGREES,
    latitude + SEARCH_RADIUS_DEGREES,
    longitude + SEARCH_RADIUS_DEGREES,
    latitude - SEARCH_RADIUS_DEGREES,
  ].join(',');
  const searches = ['xerox', 'photocopy', 'printing', 'print shop', 'stationery'];
  const results = [];

  for (const search of searches) {
    const params = new URLSearchParams({
      q: search,
      format: 'jsonv2',
      limit: '20',
      bounded: '1',
      viewbox,
      dedupe: '1',
    });
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      if (!response.ok) continue;
      const data = await response.json();
      results.push(...data);
    } catch {
      // Try the next live OpenStreetMap search term.
    }
  }

  return results
    .map(result => {
      const shop = normalizeShop({
        type: result.osm_type,
        id: result.osm_id,
        lat: Number(result.lat),
        lon: Number(result.lon),
        tags: {
          name: result.name || result.display_name.split(',')[0],
          'addr:street': result.address?.road,
          'addr:suburb': result.address?.suburb || result.address?.neighbourhood,
          'addr:city': result.address?.city || result.address?.town,
        },
      }, latitude, longitude);
      return shop;
    })
    .filter(Boolean)
    .filter(shop => shop.distanceKm <= SEARCH_RADIUS_METERS / 1000)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .filter((shop, index, shops) => shops.findIndex(item => item.id === shop.id) === index);
}
