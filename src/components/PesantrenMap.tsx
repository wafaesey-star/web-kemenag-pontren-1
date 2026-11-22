import L from 'leaflet';
import { useEffect, useRef } from 'react';
import type { IjopStatus } from '../types';
import { IJOP_LABELS } from '../lib/domain';

export interface MapPesantrenPoint {
  id: string;
  nama: string;
  kecamatan: string;
  desa: string;
  tipe: string;
  lat: number;
  lng: number;
  ijopStatusSummary: IjopStatus;
  totalSantriLatest: number;
}

interface PesantrenMapProps {
  items: MapPesantrenPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  heightClass?: string;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function PesantrenMap({
  items,
  selectedId,
  onSelect,
  heightClass = 'h-[380px]',
}: PesantrenMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-8.075, 111.93],
      zoom: 12,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    for (const item of items) {
      if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) continue;
      const isSelected = item.id === selectedId;
      const fillColor =
        item.ijopStatusSummary === 'kedaluwarsa'
          ? '#B91C1C'
          : item.ijopStatusSummary === 'segera_berakhir'
            ? '#B45309'
            : '#0F5132';

      const marker = L.circleMarker([item.lat, item.lng], {
        radius: isSelected ? 10 : 7,
        color: '#FFFFFF',
        weight: 2,
        fillColor,
        fillOpacity: 0.92,
      });

      const popupHtml = `
        <div style="font-family: 'DM Sans', sans-serif; min-width: 180px;">
          <div style="font-weight: 600; font-size: 13px; color: #111815; margin-bottom: 4px;">${escapeHtml(item.nama)}</div>
          <div style="font-size: 12px; color: #4B5751;">${escapeHtml(item.kecamatan)} · ${escapeHtml(item.desa)}</div>
          <div style="font-size: 12px; color: #4B5751; margin-top: 4px;">
            ${escapeHtml(item.tipe)} · ${item.totalSantriLatest.toLocaleString('id-ID')} santri
          </div>
          <div style="font-size: 11px; color: ${fillColor}; font-weight: 600; margin-top: 4px;">
            IJOP: ${escapeHtml(IJOP_LABELS[item.ijopStatusSummary])}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelect?.(item.id);
      });
      marker.addTo(group);
      bounds.push([item.lat, item.lng]);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 14 });
    }
  }, [items, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      aria-label="Peta sebaran pondok pesantren"
      className={`w-full ${heightClass} rounded-xl border border-slate-900/10 bg-[#F1F5F3] z-0`}
    />
  );
}
