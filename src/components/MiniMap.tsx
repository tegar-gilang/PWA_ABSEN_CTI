import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

interface MiniMapProps {
  checkInLocation?: Location | null;
  checkOutLocation?: Location | null;
}

// Component to handle map bounds when locations change
function MapUpdater({ checkInLocation, checkOutLocation }: MiniMapProps) {
  const map = useMap();
  
  useEffect(() => {
    const locations: Location[] = [];
    if (checkInLocation) locations.push(checkInLocation);
    if (checkOutLocation) locations.push(checkOutLocation);
    
    if (locations.length > 0) {
      if (locations.length === 1) {
        map.setView([locations[0].lat, locations[0].lng], 15);
      } else {
        const bounds = L.latLngBounds([locations[0].lat, locations[0].lng], [locations[1].lat, locations[1].lng]);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, checkInLocation, checkOutLocation]);
  
  return null;
}

export default function MiniMap({ checkInLocation, checkOutLocation }: MiniMapProps) {
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
        
        {checkInLocation && (
          <Marker position={[checkInLocation.lat, checkInLocation.lng]} icon={checkInIcon}>
            <Popup>
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Lokasi Masuk</span>
            </Popup>
          </Marker>
        )}
        
        {checkOutLocation && (
          <Marker position={[checkOutLocation.lat, checkOutLocation.lng]} icon={checkOutIcon}>
            <Popup>
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Lokasi Pulang</span>
            </Popup>
          </Marker>
        )}
        
        <MapUpdater checkInLocation={checkInLocation} checkOutLocation={checkOutLocation} />
      </MapContainer>
    </div>
  );
}
