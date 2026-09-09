import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Edit, Trash2, X, Compass } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getToken } from '../../lib/api';

// Perbaikan icon leaflet yang tidak muncul di React Leaflet
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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newPos = new L.LatLng(parseFloat(result.lat), parseFloat(result.lon));
        setFormPosition(newPos);
        
        // Opsional: Jika nama/alamat masih kosong, bisa diisi otomatis
        if (!formData.name) setFormData(prev => ({ ...prev, name: result.display_name.split(',')[0] }));
        if (!formData.address) setFormData(prev => ({ ...prev, address: result.display_name }));
      } else {
        alert('Lokasi tidak ditemukan. Coba gunakan kata kunci yang berbeda.');
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
          <div className="self-end md:self-auto">
            <button 
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 mt-4 md:mt-0 rounded-md flex items-center justify-center whitespace-nowrap transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
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
                    placeholder="Contoh: Rumah Sakit Banyumas..."
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
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
