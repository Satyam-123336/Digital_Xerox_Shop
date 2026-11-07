# XeroxQ

XeroxQ is a location-aware print-ordering app built with Next.js. Students can find nearby real print shops, submit print requests, and track order status. Shop owners can view incoming orders and update them as ready or collected.

## Features

- Browser geolocation with explicit permission.
- Real nearby print-shop listings from OpenStreetMap.
- OpenStreetMap map markers, distances, addresses, and verification links.
- Live fallback search when an Overpass API server is unavailable.
- Student order placement and order tracking.
- Shop-owner order dashboard with status updates.
- Orders stored locally in the browser for this prototype.

## Getting started

### Requirements

- Node.js 18 or newer
- A browser with location access enabled

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm run start
```

## Location and shop data

The app does not use hardcoded shop listings. It requests the user's location and searches OpenStreetMap through Overpass and Nominatim. Results depend on the user's permission, network connection, and the businesses mapped in OpenStreetMap for that area.

## Routes

- `/` — Choose Student or Shop Owner
- `/student` — Find a nearby shop, place an order, and track it
- `/shop` — Select a nearby shop and manage its orders

## License

This project is provided for educational and demonstration purposes.
