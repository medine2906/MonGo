import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ContainerLocation } from '../types';
import { MARKER_COLORS } from '../constants';
import { generateSimulatedLocations } from '../utils/locationSimulator';

interface Props {
  locations: ContainerLocation[];
  onLocationSelect: (loc: ContainerLocation) => void;
  selectedLocation: ContainerLocation | null;
}

function makePinIcon(color: string, selected = false, reward?: number): L.DivIcon {
  const w  = selected ? 28 : 22;
  const h  = selected ? 40 : 30;
  const lh = reward !== undefined ? 16 : 0; // label height
  const glow = selected
    ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 2px 6px rgba(0,0,0,.7))`
    : 'drop-shadow(0 2px 6px rgba(0,0,0,.7))';
  const label = reward !== undefined
    ? `<div style="background:${color};color:#fff;border-radius:6px;padding:1px 5px;font-size:8px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.5);letter-spacing:.2px;line-height:14px;margin-top:1px">${reward} MONECO</div>`
    : '';
  return L.divIcon({
    className:   '',
    iconSize:    [54, h + lh],
    iconAnchor:  [27, h],
    popupAnchor: [0, -h],
    html: `
      <div style="width:54px;display:flex;flex-direction:column;align-items:center">
        <div style="width:${w}px;height:${h}px;filter:${glow};transition:all .2s">
          <svg viewBox="0 0 24 36" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 24 12 24S24 20 24 12C24 5.373 18.627 0 12 0z"
              fill="${color}" stroke="#fff" stroke-width="${selected ? 1.8 : 1.4}"/>
            <circle cx="12" cy="12" r="5" fill="#fff" fill-opacity="0.9"/>
          </svg>
        </div>
        ${label}
      </div>`,
  });
}

export const MapView: React.FC<Props> = ({ locations, onLocationSelect, selectedLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<Map<string, { marker: L.Marker; loc: ContainerLocation }>>(new Map());
  const circlesRef   = useRef<Map<string, L.Circle>>(new Map());
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;
  const [filter, setFilter] = useState<'all' | 'green' | 'orange' | 'red'>('all');

  useEffect(() => {
    if (!mapContainer.current) return;
    
    if (!mapRef.current) {
      const map = L.map(mapContainer.current, {
        center: [40.15, 26.9],
        zoom: 10,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear old markers and circles
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
    circlesRef.current.forEach(c => c.remove());
    circlesRef.current.clear();

    locations.forEach(loc => {
      const color = MARKER_COLORS[loc.markerColor];

      // Renkli alan (zone) ekle
      const circle = L.circle([loc.latitude, loc.longitude], {
        radius:      450,
        color:       color,
        fillColor:   color,
        fillOpacity: 0.13,
        weight:      1,
        opacity:     0.35,
      }).addTo(map);
      circlesRef.current.set(loc.id, circle);

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: makePinIcon(color, false, loc.reward),
      }).addTo(map);

      const photosHtml = loc.photos?.length
        ? `<div class="popup-photos" style="margin-top: 8px; max-height: 100px; overflow-y: auto;">
             <strong>Doğrulanmış Çevre Fotoğrafları:</strong>
             <div style="display:flex; gap: 4px; overflow-x: auto; margin-top: 4px;">
               ${loc.photos.map(p => `<img src="${p}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />`).join('')}
             </div>
           </div>`
        : '';

      const popupHtml = `
        <div class="mapbox-popup">
          <div class="popup-header">
            <span class="popup-color-dot" style="background:${color}"></span>
            <strong>${loc.city} / ${loc.district}</strong>
          </div>
          <p class="popup-name">${loc.locationName}</p>
          <div class="popup-stats">
            <div><span>Ödül</span><b style="color:#f9ab00">${loc.reward} $MONECO</b></div>
          </div>
          ${photosHtml}
          <button id="sel-${loc.id}" style="
            margin-top:8px;width:100%;padding:8px 12px;border-radius:20px;
            background:#1a73e8;border:none;
            color:#fff;cursor:pointer;font-weight:500;font-size:12px;
            font-family:inherit;
          ">Burayı Seç</button>
        </div>`;

      marker.bindPopup(popupHtml, { maxWidth: 240, className: 'leaflet-custom-popup' });

      marker.on('popupopen', () => {
        setTimeout(() => {
          document.getElementById(`sel-${loc.id}`)?.addEventListener('click', () => {
            onLocationSelectRef.current(loc);
            marker.closePopup();
          });
        }, 0);
      });

      markersRef.current.set(loc.id, { marker, loc });
    });

  }, [locations, onLocationSelect]);

  // Filtre
  useEffect(() => {
    markersRef.current.forEach(({ marker, loc }) => {
      const show = filter === 'all' || loc.markerColor === filter;
      if (show) marker.addTo(mapRef.current!);
      else marker.remove();
    });
    circlesRef.current.forEach((circle, id) => {
      const entry = markersRef.current.get(id);
      if (!entry) return;
      const show = filter === 'all' || entry.loc.markerColor === filter;
      if (show) circle.addTo(mapRef.current!);
      else circle.remove();
    });
  }, [filter]);

  // Seçili konuma uç + vurgula
  useEffect(() => {
    if (!selectedLocation || !mapRef.current) return;

    mapRef.current.flyTo([selectedLocation.latitude, selectedLocation.longitude], 15, { duration: 1.2 });

    markersRef.current.forEach(({ marker, loc }) => {
      const isSelected = loc.id === selectedLocation.id;
      marker.setIcon(makePinIcon(MARKER_COLORS[loc.markerColor], isSelected, loc.reward));
    });
  }, [selectedLocation]);

  return (
    <div className="map-wrapper">
      {/* Filtre butonları */}
      <div className="map-filters">
        {(['all', 'green', 'orange', 'red'] as const).map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all'    && 'Tümü'}
            {f === 'green'  && <><span className="dot" style={{ background: MARKER_COLORS.green  }} /> Temiz Çevre</>}
            {f === 'orange' && <><span className="dot" style={{ background: MARKER_COLORS.orange }} /> Orta Kirlilik</>}
            {f === 'red'    && <><span className="dot" style={{ background: MARKER_COLORS.red    }} /> Kirli Çevre</>}
          </button>
        ))}
      </div>

      {/* Harita */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />


    </div>
  );
};
