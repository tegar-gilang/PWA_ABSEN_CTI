import { exportToExcel, exportToPDF } from '@/src/utils/exportUtils';
import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Edit, Trash2, X, Compass } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getToken } from '../../lib/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Hospital {
  id: string;
  name: string;
  nama_rs?: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
const mapboxStyleId = import.meta.env.VITE_MAPBOX_STYLE_ID?.trim() || 'streets-v12';

const tileUrl = mapboxToken
  ? `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyleId}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const attribution = mapboxToken
  ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Komponen untuk menangkap event klik pada map saat form Add/Edit
function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Lokasi yang dipilih</Popup>
    </Marker>
  );
}

// Komponen untuk mengubah posisi tengah peta secara dinamis
function MapCenterUpdater({ position }: { position: L.LatLng | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

const DataRumahSakitHRD: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const token = getToken();

  // Modal Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', radius_meters: 200 });
  const [formPosition, setFormPosition] = useState<L.LatLng | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Modal View Map State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const fetchHospitals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/hrd/hospitals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat data');
      const data = await res.json();
      const list = (data.hospitals || []).map((h: any) => ({
        ...h,
        name: h.nama_rs || h.name || 'Rumah Sakit',
        address: h.address || '-',
        latitude: Number(h.latitude) || 0,
        longitude: Number(h.longitude) || 0,
        radius_meters: h.radius_meters ? Number(h.radius_meters) : 200
      }));
      setHospitals(list);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memuat data rumah sakit');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', address: '', radius_meters: 200 });
    // Default position to Jakarta
    setFormPosition(new L.LatLng(-6.200000, 106.816666));
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (h: Hospital) => {
    setEditingId(h.id);
    setFormData({ 
      name: h.name || h.nama_rs || '', 
      address: h.address || '', 
      radius_meters: h.radius_meters || 200 
    });
    setFormPosition(new L.LatLng(h.latitude, h.longitude));
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rumah sakit ini?')) return;
    try {
      const res = await fetch(`${API_URL}/hrd/hospitals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal menghapus data');
      await fetchHospitals();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPosition) {
      return alert('Pilih lokasi di peta terlebih dahulu');
    }

    const payload = {
      nama_rs: formData.name,
      name: formData.name,
      address: formData.address,
      latitude: formPosition.lat,
      longitude: formPosition.lng,
      radius_meters: Number(formData.radius_meters) || 200
    };

    try {
      const url = editingId ? `${API_URL}/hrd/hospitals/${editingId}` : `${API_URL}/hrd/hospitals`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("Backend Error Response:", errText);
        throw new Error(errText || 'Gagal menyimpan data');
      }
      
      setIsFormModalOpen(false);
      fetchHospitals();
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan saat menyimpan data: ${err.message || err}`);
    }
  };

  const handleSearchLocation = async () => {
    if (!mapSearchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      const q = mapSearchQuery.trim();

      // =========================================================================
      // FITUR: Deteksi Otomatis Jika Input Merupakan Koordinat (Lat, Lng)
      // Contoh format: "-7.418464929097952, 109.21289445325951" atau "-7.418464 109.212894"
      // =========================================================================
      const coordMatch = q.replace(/[°NSEW]/gi, '').match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const newPos = new L.LatLng(lat, lng);
          setFormPosition(newPos);

          // Lakukan reverse geocoding untuk mendapatkan alamat / nama tempat di titik koordinat tersebut
          let placeName = '';
          let placeAddress = '';

          // Coba Photon Reverse
          try {
            const revRes = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
            if (revRes.ok) {
              const revData = await revRes.json();
              if (revData && revData.features && revData.features.length > 0) {
                const props = revData.features[0].properties;
                placeName = props.name || '';
                placeAddress = [props.name, props.street, props.city, props.state, props.country].filter(Boolean).join(', ');
              }
            }
          } catch (e) {
            console.warn('Photon reverse error:', e);
          }

          // Fallback Mapbox Reverse
          if (!placeAddress && mapboxToken) {
            try {
              const revRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=id`);
              if (revRes.ok) {
                const revData = await revRes.json();
                if (revData && revData.features && revData.features.length > 0) {
                  placeName = placeName || revData.features[0].text || revData.features[0].place_name.split(',')[0];
                  placeAddress = revData.features[0].place_name;
                }
              }
            } catch (e) {
              console.warn('Mapbox reverse error:', e);
            }
          }

          if (!formData.name) setFormData(prev => ({ ...prev, name: placeName || `Rumah Sakit (${lat.toFixed(5)}, ${lng.toFixed(5)})` }));
          if (!formData.address) setFormData(prev => ({ ...prev, address: placeAddress || `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}` }));

          return;
        }
      }

      // =========================================================================
      // PENCARIAN BERDASARKAN NAMA TEMPAT / NAMA RUMAH SAKIT
      // =========================================================================
      const searchTerms: string[] = [];

      // Khusus RSUD Ir. Soekarno di Sukoharjo (sebelumnya tercatat sebagai Kompleks RSUD Sukoharjo di OSM)
      if (/soekarno/i.test(q) && /sukoharjo/i.test(q)) {
        searchTerms.push('RSUD Sukoharjo');
        searchTerms.push('Rumah Sakit Sukoharjo');
      }

      searchTerms.push(q);
      const stripped = q.replace(/^(rsud|rs|rumah\s+sakit|klinik|puskesmas)\.?\s+/i, '').trim();

      if (stripped && stripped.toLowerCase() !== q.toLowerCase()) {
        searchTerms.push(`RSUD ${stripped}`);
        searchTerms.push(`Rumah Sakit ${stripped}`);
        searchTerms.push(`RS ${stripped}`);
        searchTerms.push(stripped);
      } else {
        searchTerms.push(`RSUD ${q}`);
        searchTerms.push(`Rumah Sakit ${q}`);
        searchTerms.push(`RS ${q}`);
      }

      const uniqueTerms = Array.from(new Set(searchTerms));
      let foundLocation: { name: string; address: string; lat: number; lng: number } | null = null;

      // Fungsi bantuan cek kota jika user menyebutkan nama kota di query
      const queryHasCity = (cityName?: string) => {
        if (!cityName) return false;
        return q.toLowerCase().includes(cityName.toLowerCase());
      };

      // 1. Prioritas Utama: Photon API (Data OpenStreetMap tanpa batas CORS)
      for (const term of uniqueTerms) {
        try {
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&limit=10`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.features && data.features.length > 0) {
              const indoFeatures = data.features.filter((f: any) => 
                f.properties?.country === 'Indonesia' || 
                f.properties?.countrycode === 'ID' ||
                f.properties?.state?.toLowerCase().includes('jawa')
              );

              // TINGKAT 1: Filter ketat faskes medis (hospital, clinic, doctors) yang cocok dengan kota jika disebutkan
              let target = indoFeatures.find((f: any) => {
                const val = (f.properties?.osm_value || '').toLowerCase();
                const name = (f.properties?.name || '').toLowerCase();
                const isMedical = val === 'hospital' || val === 'clinic' || val === 'doctors';
                const isExcluded = val === 'marketplace' || val === 'market' || val === 'shop' || val === 'mall' || name.startsWith('pasar');
                const cityMatch = queryHasCity(f.properties?.city) || queryHasCity(f.properties?.county);
                return isMedical && !isExcluded && cityMatch;
              });

              // TINGKAT 2: Filter ketat faskes medis tanpa batasan kota (namun tolak pasar, mall, toko)
              if (!target) {
                target = indoFeatures.find((f: any) => {
                  const val = (f.properties?.osm_value || '').toLowerCase();
                  const name = (f.properties?.name || '').toLowerCase();
                  const isMedical = val === 'hospital' || val === 'clinic' || val === 'doctors';
                  const isExcluded = val === 'marketplace' || val === 'market' || val === 'shop' || val === 'mall' || name.startsWith('pasar');
                  return isMedical && !isExcluded;
                });
              }

              // TINGKAT 3: Nama yang mengandung RSUD / Rumah Sakit / RSU (bukan pasar / halte)
              if (!target) {
                target = indoFeatures.find((f: any) => {
                  const name = (f.properties?.name || '').toLowerCase();
                  const val = (f.properties?.osm_value || '').toLowerCase();
                  const isExcluded = val === 'marketplace' || val === 'market' || val === 'shop' || val === 'mall' || name.startsWith('pasar');
                  const hasHospitalName = name.includes('rsud') || name.includes('rumah sakit') || name.includes('rsu ');
                  return hasHospitalName && !isExcluded;
                });
              }

              if (target) {
                const props = target.properties;
                const coord = target.geometry.coordinates; // [lon, lat]
                const parts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean);
                foundLocation = {
                  name: props.name || q,
                  address: parts.join(', '),
                  lat: coord[1],
                  lng: coord[0]
                };
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Photon search error:', e);
        }
      }

      // 2. Fallback: Mapbox Geocoding dengan batasan negara Indonesia (country=id)
      if (!foundLocation && mapboxToken) {
        for (const term of uniqueTerms) {
          try {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json?access_token=${mapboxToken}&country=id&language=id`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.features && data.features.length > 0) {
                const top = data.features.find((f: any) => {
                  const name = (f.place_name || '').toLowerCase();
                  return !name.includes('pasar') && (f.relevance || 1) >= 0.6;
                }) || data.features[0];

                foundLocation = {
                  name: top.text || top.place_name.split(',')[0],
                  address: top.place_name,
                  lat: top.center[1],
                  lng: top.center[0]
                };
                break;
              }
            }
          } catch (e) {
            console.warn('Mapbox search error:', e);
          }
        }
      }

      if (foundLocation) {
        const newPos = new L.LatLng(foundLocation.lat, foundLocation.lng);
        setFormPosition(newPos);

        if (!formData.name) setFormData(prev => ({ ...prev, name: foundLocation!.name }));
        if (!formData.address) setFormData(prev => ({ ...prev, address: foundLocation!.address }));
      } else {
        alert(`Lokasi rumah sakit untuk "${q}" tidak ditemukan di wilayah Indonesia. Anda juga dapat mencari dengan memasukkan titik koordinat (contoh: -7.418464, 109.212894).`);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mencari lokasi.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleViewMap = (h: Hospital) => {
    setSelectedHospital(h);
    setIsMapModalOpen(true);
  };

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 flex-1 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Lokasi Rumah Sakit</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola data rumah sakit beserta lokasinya</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 w-full max-w-2xl">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari RS Atau Tempat</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="cari rumah sakit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="self-end md:self-auto flex flex-wrap gap-2 mt-4 md:mt-0">
            <button 
              onClick={() => {
                exportToExcel({
                    title: 'Data Lokasi Rumah Sakit',
                    filename: 'Data_Lokasi_Rumah_Sakit',
                    columns: [
                      { header: 'Nama Rumah Sakit', dataKey: 'name' },
                      { header: 'Alamat', dataKey: 'address' },
                      { header: 'Radius (m)', dataKey: 'radius_meters' },
                      { header: 'Latitude', dataKey: 'latitude' },
                      { header: 'Longitude', dataKey: 'longitude' },
                    ],
                    data: hospitals
                  });
              }}
              className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-600 px-4 py-2 rounded-md flex items-center justify-center whitespace-nowrap transition-colors shadow-sm text-sm font-semibold"
            >
              Excel
            </button>
            <button 
              onClick={() => {
                exportToPDF({
                    title: 'Data Lokasi Rumah Sakit',
                    filename: 'Data_Lokasi_Rumah_Sakit',
                    columns: [
                      { header: 'Nama Rumah Sakit', dataKey: 'name' },
                      { header: 'Alamat', dataKey: 'address' },
                      { header: 'Radius (m)', dataKey: 'radius_meters' },
                      { header: 'Latitude', dataKey: 'latitude' },
                      { header: 'Longitude', dataKey: 'longitude' },
                    ],
                    data: hospitals
                  });
              }}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-600 px-4 py-2 rounded-md flex items-center justify-center whitespace-nowrap transition-colors shadow-sm text-sm font-semibold"
            >
              PDF
            </button>
            <button 
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center whitespace-nowrap transition-colors shadow-sm text-sm font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Rumah Sakit
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  RUMAH SAKIT
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ALAMAT
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  RADIUS
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  LOKASI
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredHospitals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Tidak ada data ditemukan</td>
                </tr>
              ) : (
                filteredHospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{hospital.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 leading-relaxed max-w-md line-clamp-2">
                        {hospital.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {hospital.radius_meters || 200} m
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 mb-1">{hospital.latitude.toFixed(5)}, {hospital.longitude.toFixed(5)}</span>
                        <button 
                          onClick={() => handleViewMap(hospital)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          Lihat di Maps
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleOpenEdit(hospital)}
                          className="flex items-center text-blue-600 hover:text-blue-800 bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(hospital.id)}
                          className="flex items-center text-red-600 hover:text-red-800 bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Rumah Sakit' : 'Tambah Rumah Sakit'}
              </h2>
              <button onClick={() => setIsFormModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Rumah Sakit</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius Geofence Absensi (Meter)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min={10}
                    max={5000}
                    step={10}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.radius_meters}
                    onChange={e => setFormData({...formData, radius_meters: Number(e.target.value) || 200})}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium pointer-events-none">meter</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Radius toleransi presensi karyawan dari titik lokasi rumah sakit (default: 200m).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Peta (Cari atau klik untuk memindahkan pin)</label>
                
                {/* Pencarian Lokasi */}
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text"
                    placeholder="Cari nama RS atau koordinat (contoh: -7.418464, 109.212894)..."
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchLocation();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearchingMap || !mapSearchQuery.trim()}
                    className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {isSearchingMap ? 'Mencari...' : 'Cari'}
                  </button>
                </div>

                <div className="h-[300px] w-full rounded-md overflow-hidden border border-gray-300 relative z-0">
                  <MapContainer 
                    center={formPosition || [-6.200000, 106.816666]} 
                    zoom={13} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution={attribution}
                      url={tileUrl}
                      tileSize={256}
                      maxZoom={22}
                    />
                    <MapCenterUpdater position={formPosition} />
                    <LocationMarker position={formPosition} setPosition={setFormPosition} />
                  </MapContainer>
                </div>
                {formPosition && (
                  <p className="text-xs text-gray-500 mt-2">
                    Koordinat: {formPosition.lat.toFixed(6)}, {formPosition.lng.toFixed(6)}
                  </p>
                )}
              </div>
              <div className="flex justify-end pt-4 mt-2 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Map */}
      {isMapModalOpen && selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedHospital.name}</h2>
                <p className="text-xs text-gray-500">
                  {selectedHospital.latitude}, {selectedHospital.longitude}
                </p>
              </div>
              <button onClick={() => setIsMapModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0">
              <div className="h-[400px] w-full bg-gray-100">
                <MapContainer 
                  center={[selectedHospital.latitude, selectedHospital.longitude]} 
                  zoom={15} 
                  scrollWheelZoom={true} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution={attribution}
                    url={tileUrl}
                    tileSize={256}
                    maxZoom={22}
                  />
                  <Marker position={[selectedHospital.latitude, selectedHospital.longitude]}>
                    <Popup>
                      <strong>{selectedHospital.name}</strong><br/>
                      {selectedHospital.address}
                    </Popup>
                  </Marker>
                  <Circle 
                    center={[selectedHospital.latitude, selectedHospital.longitude]} 
                    radius={selectedHospital.radius_meters || 200}
                    pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                  />
                </MapContainer>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <p className="text-sm text-gray-700">{selectedHospital.address}</p>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full shrink-0">
                Radius Geofence: {selectedHospital.radius_meters || 200} m
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DataRumahSakitHRD;
