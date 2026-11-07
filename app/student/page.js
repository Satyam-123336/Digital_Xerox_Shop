'use client';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { SERVICES, addOrder, getOrderById, formatTime } from '@/lib/store';
import { fetchNearbyShops } from '@/lib/shops';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',          cls: 'status-pending' },
    ready:     { label: 'Ready for Pickup', cls: 'status-ready' },
    completed: { label: 'Collected',        cls: 'status-completed' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StatusTimeline({ status }) {
  const steps = ['pending', 'ready', 'completed'];
  const idx   = steps.indexOf(status);
  const labels = ['Order placed', 'Ready for pickup', 'Collected'];
  return (
    <div className="flex items-center gap-2 mt-4">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
            i < idx  ? 'bg-green-500 text-white' :
            i === idx ? 'bg-signal text-white' :
            'bg-paper-200 text-ink-500'
          }`}>
            {i < idx ? '✓' : i + 1}
          </div>
          <div className="flex-1">
            <div className={`text-xs font-medium ${i <= idx ? 'text-ink-900' : 'text-ink-500/50'}`}>
              {labels[i]}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-full max-w-[40px] ${i < idx ? 'bg-green-500' : 'bg-paper-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function TrackOrderView({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  function refresh() {
    const o = getOrderById(orderId);
    setOrder(o);
    setLastChecked(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!order) return (
    <div className="bg-white rounded-2xl border border-paper-200 p-8 text-center">
      <p className="text-ink-500">Order <strong>{orderId}</strong> not found.</p>
      <button onClick={onBack} className="mt-4 text-signal font-medium text-sm">← Place a new order</button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-paper-200 p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">Order ID</div>
          <div className="font-mono font-bold text-2xl text-ink-900 tracking-widest">{order.id}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <StatusTimeline status={order.status} />

      <hr className="border-paper-200" />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-ink-500 mb-0.5">Name</div>
          <div className="font-medium text-ink-900">{order.studentName}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 mb-0.5">Shop</div>
          <div className="font-medium text-ink-900">{order.shopName}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 mb-0.5">Services</div>
          <div className="font-medium text-ink-900">{order.services.join(', ')}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 mb-0.5">Copies</div>
          <div className="font-medium text-ink-900">{order.copies}</div>
        </div>
        {order.notes && (
          <div className="col-span-2">
            <div className="text-xs text-ink-500 mb-0.5">Notes</div>
            <div className="font-medium text-ink-900">{order.notes}</div>
          </div>
        )}
        <div>
          <div className="text-xs text-ink-500 mb-0.5">Placed at</div>
          <div className="font-medium text-ink-900">{formatTime(order.createdAt)}</div>
        </div>
      </div>

      {order.status === 'ready' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-semibold text-green-800">Your order is ready!</div>
            <div className="text-sm text-green-700 mt-0.5">Head over to <strong>{order.shopName}</strong> to collect your printouts.</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="text-sm text-ink-500 hover:text-signal transition-colors">
          ← Place another order
        </button>
        <div className="text-xs text-ink-500/60">
          Auto-refreshes · Last checked {lastChecked}
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const [view, setView]           = useState('form'); // 'form' | 'track' | 'success'
  const [trackId, setTrackId]     = useState('');
  const [trackInput, setTrackInput] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [locationError, setLocationError] = useState('');
  const [locationAttempt, setLocationAttempt] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [form, setForm] = useState({ studentName: '', phone: '', copies: '1', notes: '' });
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [errors, setErrors] = useState({});

  function toggleService(s) {
    setSelectedServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  function validate() {
    const e = {};
    if (!form.studentName.trim()) e.studentName = 'Enter your name';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit number';
    if (selectedServices.length === 0) e.services = 'Pick at least one service';
    if (!selectedShop) e.shop = 'Select a shop on the map';
    return e;
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Location is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async position => {
      try {
        setLocationStatus('loading');
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        const nearbyShops = await fetchNearbyShops(
          position.coords.latitude,
          position.coords.longitude,
        );
        setShops(nearbyShops);
        setLocationStatus('ready');
        if (nearbyShops.length === 0) {
          setLocationError('No nearby print shops were found in OpenStreetMap.');
        }
      } catch (error) {
        setLocationStatus('error');
        setLocationError(error.message);
      }
    }, error => {
      setLocationStatus('error');
      setLocationError(error.code === error.PERMISSION_DENIED
        ? 'Location permission is required to find nearby shops.'
        : 'Unable to determine your location.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
  }, [locationAttempt]);

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    const shop = shops.find(item => item.id === selectedShop);
    if (!shop) {
      setErrors({ shop: 'That shop is no longer available. Please choose another nearby shop.' });
      return;
    }
    const order = addOrder({ ...form, services: selectedServices, shop });
    setSubmittedOrder(order);
    setView('success');
  }

  if (view === 'track') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('form')} className="text-ink-500 hover:text-signal transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h2 className="text-xl font-bold text-ink-900">Track your order</h2>
        </div>
        <div className="bg-white rounded-2xl border border-paper-200 p-5">
          <label className="block text-sm font-medium text-ink-700 mb-2">Order ID</label>
          <div className="flex gap-3">
            <input
              value={trackInput}
              onChange={e => setTrackInput(e.target.value.toUpperCase())}
              placeholder="e.g. AB3X7K"
              className="flex-1 border border-paper-200 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-signal"
            />
            <button
              onClick={() => { if (trackInput.trim()) setTrackId(trackInput.trim()); }}
              className="bg-signal text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-ink-700 transition-colors"
            >
              Track
            </button>
          </div>
        </div>
        {trackId && <TrackOrderView orderId={trackId} onBack={() => { setView('form'); setTrackId(''); setTrackInput(''); }} />}
      </div>
    );
  }

  if (view === 'success' && submittedOrder) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-paper-200 p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl">✓</div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">Order placed!</h2>
            <p className="text-ink-500 text-sm mt-1">We'll let you know when it's ready.</p>
          </div>
          <div className="bg-paper-50 rounded-xl p-4 inline-block">
            <div className="text-xs text-ink-500 mb-1">Your order ID</div>
            <div className="font-mono font-bold text-3xl text-ink-900 tracking-widest">{submittedOrder.id}</div>
            <div className="text-xs text-ink-500 mt-1">Save this to track your order</div>
          </div>
          <div className="text-sm text-ink-700 bg-paper-100 rounded-xl p-4 text-left">
            <div className="font-semibold mb-2">Order summary</div>
            <div className="space-y-1 text-ink-500">
              <div>Shop: <span className="text-ink-900 font-medium">{submittedOrder.shopName}</span></div>
              <div>Services: <span className="text-ink-900 font-medium">{submittedOrder.services.join(', ')}</span></div>
              <div>Copies: <span className="text-ink-900 font-medium">{submittedOrder.copies}</span></div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => { setTrackId(submittedOrder.id); setTrackInput(submittedOrder.id); setView('track'); }}
              className="flex-1 bg-signal text-white py-3 rounded-xl font-semibold hover:bg-ink-700 transition-colors"
            >
              Track this order
            </button>
            <button
              onClick={() => { setView('form'); setSubmittedOrder(null); setForm({ studentName: '', phone: '', copies: '1', notes: '' }); setSelectedServices([]); setSelectedShop(''); setErrors({}); }}
              className="flex-1 border border-paper-200 text-ink-700 py-3 rounded-xl font-semibold hover:border-signal hover:text-signal transition-colors"
            >
              Place another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink-900">Place a print request</h2>
        <button onClick={() => setView('track')} className="text-sm text-signal font-medium hover:underline">
          Track order →
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal details */}
        <div className="bg-white rounded-2xl border border-paper-200 p-5 space-y-4">
          <h3 className="font-semibold text-ink-900">Your details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Full name</label>
              <input
                value={form.studentName}
                onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                placeholder="Priya Sharma"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors ${errors.studentName ? 'border-red-400' : 'border-paper-200'}`}
              />
              {errors.studentName && <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Phone number</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                placeholder="9876543210"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-signal transition-colors ${errors.phone ? 'border-red-400' : 'border-paper-200'}`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl border border-paper-200 p-5 space-y-4">
          <h3 className="font-semibold text-ink-900">What do you need?</h3>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => toggleService(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selectedServices.includes(s)
                    ? 'bg-signal text-white border-signal'
                    : 'bg-paper-50 text-ink-700 border-paper-200 hover:border-signal'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.services && <p className="text-red-500 text-xs">{errors.services}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Number of copies</label>
              <input
                type="number"
                min="1"
                value={form.copies}
                onChange={e => setForm(f => ({ ...f, copies: e.target.value }))}
                className="w-full border border-paper-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-signal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Notes (optional)</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. double-sided, A4"
                className="w-full border border-paper-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-signal"
              />
            </div>
          </div>
        </div>

        {/* Shop selection map */}
        <div className="bg-white rounded-2xl border border-paper-200 p-5 space-y-4">
          <h3 className="font-semibold text-ink-900">Pick a nearby shop</h3>
          <p className="text-sm text-ink-500">
            Real print shops from OpenStreetMap near your current location. Results are not dummy listings.
          </p>
          {userLocation && locationStatus === 'ready' && (
            <p className="text-xs text-ink-500">
              Found {shops.length} mapped shop{shops.length === 1 ? '' : 's'} within 5 km of{' '}
              {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}.
            </p>
          )}
          {locationStatus === 'loading' && (
            <p className="text-sm text-ink-500">Requesting your location and finding nearby shops…</p>
          )}
          {locationError && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-red-600">{locationError}</p>
              <button
                type="button"
                onClick={() => { setLocationError(''); setLocationStatus('loading'); setLocationAttempt(value => value + 1); }}
                className="flex-shrink-0 text-sm font-semibold text-signal hover:underline"
              >
                Try again
              </button>
            </div>
          )}
          <Suspense fallback={<div className="h-80 bg-paper-100 rounded-xl animate-pulse" />}>
            <Map
              shops={shops}
              userLocation={userLocation}
              selectedShopId={selectedShop}
              onSelectShop={id => { setSelectedShop(id); setErrors(e => ({ ...e, shop: undefined })); }}
            />
          </Suspense>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {shops.map(shop => (
              <button
                type="button"
                key={shop.id}
                onClick={() => { setSelectedShop(shop.id); setErrors(e => ({ ...e, shop: undefined })); }}
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selectedShop === shop.id
                    ? 'border-signal bg-signal/5 text-ink-900'
                    : 'border-paper-200 text-ink-700 hover:border-signal'
                }`}
              >
                <div className="font-medium">{shop.name}</div>
                <div className="text-xs text-ink-500 mt-0.5">{shop.address} · {shop.distanceKm.toFixed(1)} km</div>
                <a
                  href={shop.osmUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={event => event.stopPropagation()}
                  className="text-xs text-signal hover:underline mt-1 inline-block"
                >
                  Verify on OpenStreetMap
                </a>
              </button>
            ))}
          </div>
          {locationStatus === 'ready' && shops.length === 0 && (
            <p className="text-sm text-ink-500">Try again in an area with mapped print shops.</p>
          )}
          {errors.shop && <p className="text-red-500 text-xs">{errors.shop}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-ink-900 hover:bg-signal text-white py-4 rounded-2xl font-bold text-base transition-colors"
        >
          Submit request
        </button>
      </form>
    </div>
  );
}
