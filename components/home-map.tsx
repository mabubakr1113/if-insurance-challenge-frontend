'use client';

import type { Map as MapboxMap } from 'mapbox-gl';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './icons';
import { button } from './styles';
import { Spinner } from './ui';
import 'mapbox-gl/dist/mapbox-gl.css';
import './home-map.css';

type View = '2d' | '3d';
const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const camera = (view: View) => ({ zoom: view === '3d' ? 17.5 : 16.7, pitch: view === '3d' ? 60 : 0, bearing: view === '3d' ? -25 : 0 });

export function HomeMap({ lat, lng, address, city }: { lat: number; lng: number; address: string; city: string }) {
  const titleId = useId();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [view, setView] = useState<View>('2d');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const validLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85 && Math.abs(lng) <= 180;

  useEffect(() => {
    if (!container.current || !validLocation || !token) return;
    const element = container.current;
    let disposed = false;
    let instance: MapboxMap | null = null;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let observer: ResizeObserver | undefined;

    async function initialise() {
      timeout = setTimeout(() => {
        if (!disposed) setStatus('error');
      }, 20000);
      try {
        const mapbox = (await import('mapbox-gl')).default;
        if (disposed) return;
        if (!mapbox.supported()) throw new Error('WebGL is unavailable');
        instance = new mapbox.Map({
          container: element,
          accessToken: token,
          style: 'mapbox://styles/mapbox/standard',
          config: {
            basemap: {
              theme: 'faded',
              lightPreset: 'day',
              show3dObjects: false,
              show3dTrees: false,
              show3dLandmarks: false,
              show3dFacades: false,
              showPointOfInterestLabels: false,
              showTransitLabels: false,
              colorLand: '#faf6f3',
              colorBuildings: '#dfd2c9',
              colorWater: '#c4d8de',
              colorGreenspace: '#dfe8d8',
              font: 'Inter',
            },
          },
          center: [lng, lat],
          ...camera('2d'),
          maxPitch: 70,
          minZoom: 3,
          maxZoom: 20,
          antialias: true,
          scrollZoom: false,
          cooperativeGestures: true,
          attributionControl: false,
          renderWorldCopies: false,
        });
        map.current = instance;
        instance.dragRotate.disable();
        instance.touchZoomRotate.disableRotation();
        instance.touchPitch.disable();
        instance.addControl(new mapbox.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
        instance.addControl(new mapbox.AttributionControl({ compact: true }), 'bottom-right');
        instance.addControl(new mapbox.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');
        instance.getCanvas().setAttribute('aria-label', `Map of the home at ${address}, ${city}`);

        const pin = document.createElement('div');
        pin.className = 'home-map-pin';
        pin.setAttribute('role', 'img');
        pin.setAttribute('aria-label', `Home at ${address}, ${city}`);
        const label = document.createElement('span');
        label.className = 'home-map-pin-label';
        label.textContent = 'Your home';
        const icon = document.createElement('span');
        icon.className = 'home-map-pin-icon';
        icon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>';
        pin.append(label, icon);
        new mapbox.Marker({ element: pin, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(instance);

        instance.on('load', () => {
          if (disposed) return;
          clearTimeout(timeout);
          setStatus('ready');
        });
        instance.on('error', (event) => {
          const error = event.error as Error & { status?: number };
          if (!disposed && [401, 403].includes(error.status ?? 0)) {
            clearTimeout(timeout);
            setStatus('error');
          }
        });
        observer = new ResizeObserver(() => instance?.resize());
        observer.observe(element);
      } catch {
        clearTimeout(timeout);
        if (!disposed) setStatus('error');
      }
    }

    // Delay the SDK and tile requests until the map is near the viewport.
    const visibility = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        visibility.disconnect();
        void initialise();
      }
    }, { rootMargin: '200px' });
    visibility.observe(element);

    return () => {
      disposed = true;
      clearTimeout(timeout);
      visibility.disconnect();
      observer?.disconnect();
      instance?.remove();
      map.current = null;
    };
  }, [lat, lng, address, city, attempt, validLocation]);

  function changeView(next: View) {
    if (!map.current || status !== 'ready') return;
    const current = map.current;
    setView(next);
    current.setConfigProperty('basemap', 'show3dObjects', next === '3d');
    if (next === '3d') {
      current.dragRotate.enable();
      current.touchZoomRotate.enableRotation();
      current.touchPitch.enable();
    } else {
      current.dragRotate.disable();
      current.touchZoomRotate.disableRotation();
      current.touchPitch.disable();
    }
    current.easeTo({ ...camera(next), duration: 750 });
  }

  function retry() {
    setStatus('loading');
    setView('2d');
    setAttempt((value) => value + 1);
  }

  const unavailable = !validLocation || !token || status === 'error';
  const ready = status === 'ready' && !unavailable;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;

  return (
    <section aria-labelledby={titleId} className="home-map overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 wide:px-[22px]">
        <div className="min-w-0">
          <h2 id={titleId} className="flex items-center gap-2 text-[15px] font-semibold"><Icon name="map" size={18} />Home location</h2>
          <p className="mt-1 text-[13px] text-muted">{address}, {city}</p>
        </div>
        <div role="group" aria-label="Map view" className="inline-flex gap-1 rounded-[11px] bg-tile p-1">
          {(['2d', '3d'] as const).map((mode) => (
            <button key={mode} type="button" aria-pressed={view === mode} disabled={!ready} onClick={() => changeView(mode)} className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${view === mode ? 'bg-ink text-white' : 'text-muted hover:bg-hover-btn'}`}>
              <Icon name={mode === '2d' ? 'map' : 'cube'} size={15} />{mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-[340px] bg-tile wide:h-[400px]">
        <div ref={container} className="absolute inset-0" />
        {ready ? (
          <button type="button" onClick={() => map.current?.easeTo({ center: [lng, lat], ...camera(view), duration: 750 })} className={button('secondary', 'sm', 'absolute top-3 left-3 z-10 shadow-sm')}>
            <Icon name="overview" size={15} />Back to home
          </button>
        ) : (
          <div role={unavailable ? 'status' : undefined} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-tile px-6 text-center">
            {unavailable ? <Icon name="map" size={30} className="text-muted" /> : <Spinner tone="dark" />}
            <p className="text-sm font-semibold">{unavailable ? validLocation ? 'The map is unavailable right now' : 'The home’s location hasn’t been added yet' : 'Loading the map…'}</p>
            {status === 'error' && token && validLocation ? <button type="button" onClick={retry} className={button('secondary', 'sm')}>Try again</button> : null}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 wide:px-[22px]">
        <p aria-live="polite" className="max-w-[420px] text-xs leading-relaxed text-muted">
          {view === '3d' ? 'Drag to explore. 3D buildings show mapped shapes and heights where available.' : 'Explore the neighbourhood or switch to 3D to see the buildings.'}
        </p>
        {validLocation ? <a href={directions} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink hover:text-accent-text">Get directions<Icon name="next" size={14} /><span className="sr-only"> (opens in a new tab)</span></a> : null}
      </div>
    </section>
  );
}
