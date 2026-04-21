"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

type MarkerLocation = {
  id: string;
  name: string;
  code: string;
  address: string;
  vehicle_count: number;
  lat: number;
  lng: number;
};

type Props = {
  locations: MarkerLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function LocationMap({ locations, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (locations.length === 0) return;

    // Dynamically import leaflet (avoids SSR issues)
    import("leaflet").then((L) => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView(
        [locations[0].lat, locations[0].lng],
        6
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Active marker icon (blue, slightly larger)
      const activeIcon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:34px;background:#10b981;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [22, 34],
        iconAnchor: [11, 34],
        popupAnchor: [0, -36],
      });

      const defaultIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:28px;background:#3b82f6;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
        iconSize: [18, 28],
        iconAnchor: [9, 28],
        popupAnchor: [0, -30],
      });

      locations.forEach((loc) => {
        const marker = L.marker([loc.lat, loc.lng], {
          icon: defaultIcon,
          title: loc.name,
        })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px">
              <strong style="font-size:14px">${loc.name}</strong><br/>
              <span style="color:#666;font-size:12px">${loc.address}</span><br/>
              <span style="color:#888;font-size:12px">${loc.vehicle_count} vehicle${loc.vehicle_count !== 1 ? "s" : ""}</span>
            </div>`,
            { closeButton: false }
          );

        marker.on("click", () => {
          onSelect(loc.id);
          // Update icons
          Object.entries(markersRef.current).forEach(([id, m]) => {
            m.setIcon(id === loc.id ? activeIcon : defaultIcon);
          });
        });

        markersRef.current[loc.id] = marker;
        // Store icons for later
        (marker as unknown as Record<string, unknown>).__defaultIcon = defaultIcon;
        (marker as unknown as Record<string, unknown>).__activeIcon = activeIcon;
      });

      // Fit map to all markers
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.2));
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.length]);

  // React to selectedId changes
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    import("leaflet").then((L) => {
      const activeIcon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:34px;background:#10b981;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [22, 34],
        iconAnchor: [11, 34],
        popupAnchor: [0, -36],
      });
      const defaultIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:28px;background:#3b82f6;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
        iconSize: [18, 28],
        iconAnchor: [9, 28],
        popupAnchor: [0, -30],
      });

      Object.entries(markersRef.current).forEach(([id, m]) => {
        m.setIcon(id === selectedId ? activeIcon : defaultIcon);
      });

      const marker = markersRef.current[selectedId];
      if (marker) {
        mapRef.current!.flyTo(marker.getLatLng(), Math.max(mapRef.current!.getZoom(), 12), {
          animate: true,
          duration: 0.8,
        });
        marker.openPopup();
      }
    });
  }, [selectedId]);

  return <div ref={containerRef} className="w-full h-full rounded-lg" />;
}
