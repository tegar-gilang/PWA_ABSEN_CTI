import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OfficeLocation } from '../types';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Location {
  lat: number;
  lng: number;
  accuracy?: number | null; // radius akurasi GPS dalam meter, ditampilkan sebagai lingkaran putus-putus
}

interface MiniMapProps {
  checkInLocation?: Location | null;
  checkOutLocation?: Location | null;
  office?: OfficeLocation | null; // titik & radius kantor untuk menampilkan area geofencing
}

// Component to handle map bounds when locations change
function MapUpdater({ checkInLocation, checkOutLocation, office }: MiniMapProps) {
  const map = useMap();
  
  useEffect(() => {
    const locations: Location[] = [];
    if (checkInLocation) locations.push(checkInLocation);
    if (checkOutLocation) locations.push(checkOutLocation);
    if (office) locations.push({ lat: office.lat, lng: office.lng });
    
    if (locations.length > 0) {
      if (locations.length === 1) {
        map.setView([locations[0].lat, locations[0].lng], 15);
      } else {
        const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  }, [map, checkInLocation, checkOutLocation, office]);
  
  return null;
}

export default function MiniMap({ checkInLocation, checkOutLocation, office }: MiniMapProps) {
  if (!checkInLocation && !checkOutLocation) return null;
  
  const defaultCenter = checkInLocation || checkOutLocation;
  if (!defaultCenter) return null;
  
  // Custom icons for in and out
  const checkInIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'hue-rotate-[120deg]', // Makes it green-ish
  });
  
  const checkOutIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'hue-rotate-[240deg]', // Makes it blue/purple-ish
  });

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200 z-0 relative shadow-inner">
      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Lingkaran radius geofencing kantor - area yang diizinkan untuk absen */}
        {office && (
          <Circle
            center={[office.lat, office.lng]}
            radius={office.radiusMeters}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' }}
          >
            <Popup>
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Radius Kantor: {office.radiusMeters} m
              </span>
            </Popup>
          </Circle>
        )}
        
        {checkInLocation && (
          <>
            {/* Lingkaran akurasi GPS saat check-in - menggambarkan seberapa presisi lokasi terbaca */}
            {!!checkInLocation.accuracy && (
              <Circle
                center={[checkInLocation.lat, checkInLocation.lng]}
                radius={checkInLocation.accuracy}
                pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.1, weight: 1, dashArray: '4 4' }}
              />
            )}
            <Marker position={[checkInLocation.lat, checkInLocation.lng]} icon={checkInIcon}>
              <Popup>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                  Lokasi Masuk{checkInLocation.accuracy ? ` (±${Math.round(checkInLocation.accuracy)} m)` : ''}
                </span>
              </Popup>
            </Marker>
          </>
        )}
        
        {checkOutLocation && (
          <>
            {/* Lingkaran akurasi GPS saat check-out */}
            {!!checkOutLocation.accuracy && (
              <Circle
                center={[checkOutLocation.lat, checkOutLocation.lng]}
                radius={checkOutLocation.accuracy}
                pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.1, weight: 1, dashArray: '4 4' }}
              />
            )}
            <Marker position={[checkOutLocation.lat, checkOutLocation.lng]} icon={checkOutIcon}>
              <Popup>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                  Lokasi Pulang{checkOutLocation.accuracy ? ` (±${Math.round(checkOutLocation.accuracy)} m)` : ''}
                </span>
              </Popup>
            </Marker>
          </>
        )}
        
        <MapUpdater checkInLocation={checkInLocation} checkOutLocation={checkOutLocation} office={office} />
      </MapContainer>
    </div>
  );
}
