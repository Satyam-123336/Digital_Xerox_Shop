'use client';
import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, formatTime } from '@/lib/store';
import { fetchNearbyShops } from '@/lib/shops';

function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',          cls: 'status-pending' },
    ready:     { label: 'Ready for Pickup', cls: 'status-ready' },
    completed: { label: 'Collected',        cls: 'status-completed' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function OrderCard({ order, onMarkReady, onMarkCollected }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-3 transition-all ${
      order.status === 'ready' ? 'border-green-300' :
      order.status === 'completed' ? 'border-paper-200 opacity-70' :
      'border-paper-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-ink-900 tracking-widest">{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-sm font-semibold text-ink-700 mt-1">{order.studentName}</div>
          <div className="text-xs text-ink-500">{order.phone} · {formatTime(order.createdAt)}</div>
        </div>
      </div>

      <div className="bg-paper-50 rounded-xl p-3 text-sm space-y-1">
        <div className="flex gap-2">
          <span className="text-ink-500 w-20 flex-shrink-0">Services</span>
          <span className="font-medium text-ink-900">{order.services.join(', ')}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-ink-500 w-20 flex-shrink-0">Copies</span>
          <span className="font-medium text-ink-900">{order.copies}</span>
        </div>
        {order.notes && (
          <div className="flex gap-2">
            <span className="text-ink-500 w-20 flex-shrink-0">Notes</span>
            <span className="font-medium text-ink-900">{order.notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {order.status === 'pending' && (
          <button
            onClick={() => onMarkReady(order.id)}
            className="flex-1 bg-signal text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-ink-700 transition-colors"
          >
            Mark as Ready
          </button>
        )}
        {order.status === 'ready' && (
          <button
            onClick={() => onMarkCollected(order.id)}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            Mark as Collected
          </button>
        )}
        {order.status === 'completed' && (
          <div className="flex-1 text-center text-xs text-ink-500 py-2.5">
            Completed
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [selectedShopId, setSelectedShopId] = useState('');
  const [orders, setOrders]                 = useState([]);
  const [tab, setTab]                       = useState('active'); // 'active' | 'completed'
  const [flash, setFlash]                   = useState('');
  const [nearbyShops, setNearbyShops]       = useState([]);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [locationError, setLocationError]   = useState('');

  function refresh() {
    if (!selectedShopId) return;
    const all = getOrders().filter(o => String(o.shopId) === String(selectedShopId));
    setOrders(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Location is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const shops = await fetchNearbyShops(
          position.coords.latitude,
          position.coords.longitude,
        );
        setNearbyShops(shops);
        setLocationStatus('ready');
        if (shops.length === 0) {
          setLocationError('No mapped print shops were found near this location.');
        }
      } catch (error) {
        setLocationStatus('error');
        setLocationError(error.message);
      }
    }, error => {
      setLocationStatus('error');
      setLocationError(error.code === error.PERMISSION_DENIED
        ? 'Location permission is required to load your real shop.'
        : 'Unable to determine your shop location.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
  }, []);

  useEffect(() => { refresh(); }, [selectedShopId]);
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [selectedShopId]);

  function markReady(orderId) {
    updateOrderStatus(orderId, 'ready');
    setFlash('Order marked as ready — student will be notified on their next refresh.');
    refresh();
    setTimeout(() => setFlash(''), 3000);
  }

  function markCollected(orderId) {
    updateOrderStatus(orderId, 'completed');
    refresh();
  }

  const active    = orders.filter(o => o.status !== 'completed');
  const completed = orders.filter(o => o.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink-900">Shop dashboard</h2>
        <div className="text-xs text-ink-500/60 bg-paper-100 px-3 py-1.5 rounded-full">Auto-refreshes every 5s</div>
      </div>

      {/* Shop selector */}
      <div className="bg-white rounded-2xl border border-paper-200 p-5">
        <label className="block text-sm font-medium text-ink-700 mb-2">Which shop are you?</label>
        <p className="text-sm text-ink-500 mb-3">
          Select the real shop listing nearest to your current location.
        </p>
        {locationStatus === 'loading' && (
          <p className="text-sm text-ink-500 mb-3">Finding nearby shops…</p>
        )}
        {locationError && (
          <p className="text-sm text-red-600 mb-3">{locationError}</p>
        )}
        <select
          value={selectedShopId}
          onChange={e => setSelectedShopId(e.target.value)}
          className="w-full border border-paper-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-signal bg-white"
        >
          <option value="">Select your shop…</option>
          {nearbyShops.map(shop => (
            <option key={shop.id} value={shop.id}>
              {shop.name} — {shop.distanceKm.toFixed(1)} km
            </option>
          ))}
        </select>
        {selectedShopId && (
          <p className="text-xs text-ink-500 mt-2">
            Real OpenStreetMap listing selected. Orders are matched to this shop ID.
          </p>
        )}
      </div>

      {/* Flash message */}
      {flash && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-medium">
          {flash}
        </div>
      )}

      {selectedShopId && (
        <>
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total today', value: orders.length },
              { label: 'Pending',     value: orders.filter(o => o.status === 'pending').length },
              { label: 'Ready',       value: orders.filter(o => o.status === 'ready').length },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-paper-200 p-4 text-center">
                <div className="text-2xl font-bold text-ink-900">{stat.value}</div>
                <div className="text-xs text-ink-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-paper-100 rounded-xl p-1 w-fit">
            {[
              { key: 'active',    label: `Active (${active.length})` },
              { key: 'completed', label: `Completed (${completed.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Orders */}
          <div className="space-y-4">
            {tab === 'active' && (
              active.length === 0
                ? <div className="bg-white rounded-2xl border border-paper-200 p-10 text-center text-ink-500">
                    No pending orders right now. 🎉
                  </div>
                : active.map(o => (
                    <OrderCard key={o.id} order={o} onMarkReady={markReady} onMarkCollected={markCollected} />
                  ))
            )}
            {tab === 'completed' && (
              completed.length === 0
                ? <div className="bg-white rounded-2xl border border-paper-200 p-10 text-center text-ink-500">
                    No completed orders yet.
                  </div>
                : completed.map(o => (
                    <OrderCard key={o.id} order={o} onMarkReady={markReady} onMarkCollected={markCollected} />
                  ))
            )}
          </div>
        </>
      )}

      {!selectedShopId && (
        <div className="bg-white rounded-2xl border border-paper-200 p-10 text-center text-ink-500">
          Select your shop above to see incoming orders.
        </div>
      )}
    </div>
  );
}
