'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons for Next.js
function fixLeafletIcons() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function selectedIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px; height:36px; border-radius:50% 50% 50% 0;
      background:#4F6BF4; border:3px solid white;
      box-shadow:0 2px 8px rgba(79,107,244,0.5);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function defaultIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px; height:28px; border-radius:50% 50% 50% 0;
      background:#1B2559; border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function FlyToSelected({ shops, shopId }) {
  const map = useMap();
  useEffect(() => {
    if (!shopId) return;
    const shop = shops.find(s => s.id === shopId);
    if (shop) map.flyTo([shop.lat, shop.lng], 15, { duration: 0.8 });
  }, [shops, shopId, map]);
  return null;
}

export default function Map({ shops, selectedShopId, userLocation, onSelectShop }) {
  useEffect(() => { fixLeafletIcons(); }, []);

  return (
    <MapContainer
      center={userLocation ? [userLocation.lat, userLocation.lng] : [20, 0]}
      zoom={userLocation ? 14 : 2}
      style={{ height: '320px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected shops={shops} shopId={selectedShopId} />
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={9}
          pathOptions={{ color: '#4F6BF4', fillColor: '#4F6BF4', fillOpacity: 0.9 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
      {shops.map(shop => (
        <Marker
          key={shop.id}
          position={[shop.lat, shop.lng]}
          icon={selectedShopId === shop.id ? selectedIcon() : defaultIcon()}
          eventHandlers={{ click: () => onSelectShop(shop.id) }}
        >
          <Popup>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', minWidth: '160px' }}>
              <strong style={{ color: '#1B2559' }}>{shop.name}</strong>
              <br />
              <span style={{ fontSize: '12px', color: '#6B7280' }}>{shop.address}</span>
              <br />
              <button
                onClick={() => onSelectShop(shop.id)}
                style={{
                  marginTop: '8px', background: '#4F6BF4', color: 'white',
                  border: 'none', borderRadius: '6px', padding: '4px 12px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                }}
              >
                Select this shop
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
