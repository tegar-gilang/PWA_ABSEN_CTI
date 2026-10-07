import React, { useState } from 'react';
import { Search, Edit2, X, Download } from 'lucide-react';
import { apiHrdUpdateCandidate } from '../../lib/api';
import { exportToExcel } from '../../utils/exportUtils';

interface DataPelamarTabProps {
  candidates: any[];
  jobs: any[];
  onRefresh: () => void;
}

const DataPelamarTab: React.FC<DataPelamarTabProps> = ({ candidates, jobs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState<any>({});

  const handleEdit = (cand: any) => {
    setForm({ ...cand });
    setEditingCandidate(cand);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiHrdUpdateCandidate(editingCandidate.id, form);
      alert('Berhasil menyimpan data pelamar.');
      setEditingCandidate(null);
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = candidates.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.job_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    exportToExcel({
      title: 'Data Pelamar',
      filename: 'Data_Pelamar',
      columns: [
        { header: 'No', dataKey: 'no' },
        { header: 'Tgl Melamar', dataKey: 'tgl_melamar' },
        { header: 'Status', dataKey: 'stage' },
        { header: 'Nama', dataKey: 'name' },
        { header: 'Posisi Dilamar', dataKey: 'job_title' },
        { header: 'Tempat, Tanggal Lahir', dataKey: 'tempat_tanggal_lahir' },
        { header: 'Umur', dataKey: 'umur' },
        { header: 'No KTP', dataKey: 'no_ktp' },
        { header: 'Jenis Kelamin', dataKey: 'jenis_kelamin' },
        { header: 'No Telepon', dataKey: 'no_telepon' },
        { header: 'Status Pernikahan', dataKey: 'status_pernikahan' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Alamat', dataKey: 'alamat' },
        { header: 'Pendidikan', dataKey: 'pendidikan' },
        { header: 'Jurusan', dataKey: 'jurusan' },
        { header: 'Pengalaman', dataKey: 'pengalaman' },
        { header: 'CV / Lamaran', dataKey: 'cv_lamaran' },
        { header: 'Tgl Dipanggil', dataKey: 'tgl_dipanggil' },
        { header: 'Hasil Interview', dataKey: 'hasil_interview' },
      ],
      data: filtered.map((c, i) => ({
        ...c,
        no: i + 1,
        tgl_melamar: c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : '-',
        stage: c.stage,
        name: c.name,
        job_title: c.job_title,
        tempat_tanggal_lahir: c.tempat_tanggal_lahir || '-',
        umur: c.umur || '-',
        no_ktp: c.no_ktp || '-',
        jenis_kelamin: c.jenis_kelamin || '-',
        no_telepon: c.no_telepon || '-',
        status_pernikahan: c.status_pernikahan || '-',
        email: c.email || '-',
        alamat: c.alamat || '-',
        pendidikan: c.pendidikan || '-',
        jurusan: c.jurusan || '-',
        pengalaman: c.pengalaman || '-',
        cv_lamaran: c.cv_lamaran || '-',
        tgl_dipanggil: c.tgl_dipanggil ? new Date(c.tgl_dipanggil).toLocaleDateString('id-ID') : '-',
        hasil_interview: c.hasil_interview || '-'
      }))
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">Detail Data Pelamar</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari pelamar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1 border border-green-600 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-100"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[2500px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">No</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Tgl Melamar</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Nama</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Posisi Yg Dilamar</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Tempat, Tgl Lahir</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Umur</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">No KTP</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Jenis Kelamin</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">No. Telepon</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Status Nikah</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Email</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Alamat</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Pendidikan</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Jurusan</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Pengalaman</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">CV / Lamaran</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Tgl Dipanggil</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase">Hasil Interview</th>
              <th className="p-3 text-xs font-bold text-gray-500 uppercase sticky right-0 bg-gray-50 z-10 border-l border-gray-200">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={20} className="p-8 text-center text-gray-500">
                  Tidak ada data pelamar.
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => (
                <tr key={c.id} className="hover:bg-blue-50/30">
                  <td className="p-3 text-sm text-gray-800">{idx + 1}</td>
                  <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="p-3 text-sm font-semibold text-blue-600">{c.stage}</td>
                  <td className="p-3 text-sm text-gray-800 font-medium whitespace-nowrap">{c.name}</td>
                  <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{c.job_title}</td>
                  <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{c.tempat_tanggal_lahir || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.umur || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.no_ktp || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.jenis_kelamin || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.no_telepon || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.status_pernikahan || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.email || '-'}</td>
                  <td className="p-3 text-sm text-gray-800 max-w-[200px] truncate" title={c.alamat}>{c.alamat || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.pendidikan || '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.jurusan || '-'}</td>
                  <td className="p-3 text-sm text-gray-800 max-w-[200px] truncate" title={c.pengalaman}>{c.pengalaman || '-'}</td>
                  <td className="p-3 text-sm text-blue-500 underline cursor-pointer truncate max-w-[150px]" title={c.cv_lamaran}>{c.cv_lamaran || '-'}</td>
                  <td className="p-3 text-sm text-gray-800 whitespace-nowrap">{c.tgl_dipanggil ? new Date(c.tgl_dipanggil).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="p-3 text-sm text-gray-800">{c.hasil_interview || '-'}</td>
                  <td className="p-3 text-sm sticky right-0 bg-white border-l border-gray-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">
                    <button onClick={() => handleEdit(c)} className="flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold">Edit Detail Pelamar</h3>
              <button onClick={() => setEditingCandidate(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="editCandForm" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama</label>
                  <input required value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={form.stage || 'SCREENING'} onChange={e => setForm({...form, stage: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300 bg-white">
                    <option value="SCREENING">Screening</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="HIRED">Diterima</option>
                    <option value="REJECTED">Ditolak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempat, Tanggal Lahir</label>
                  <input value={form.tempat_tanggal_lahir || ''} onChange={e => setForm({...form, tempat_tanggal_lahir: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Umur</label>
                  <input type="number" value={form.umur || ''} onChange={e => setForm({...form, umur: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No KTP</label>
                  <input value={form.no_ktp || ''} onChange={e => setForm({...form, no_ktp: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                  <select value={form.jenis_kelamin || ''} onChange={e => setForm({...form, jenis_kelamin: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300 bg-white">
                    <option value="">-- Pilih --</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No Telepon</label>
                  <input value={form.no_telepon || ''} onChange={e => setForm({...form, no_telepon: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Pernikahan</label>
                  <select value={form.status_pernikahan || ''} onChange={e => setForm({...form, status_pernikahan: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300 bg-white">
                    <option value="">-- Pilih --</option>
                    <option value="Belum Menikah">Belum Menikah</option>
                    <option value="Menikah">Menikah</option>
                    <option value="Cerai">Cerai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pendidikan</label>
                  <input value={form.pendidikan || ''} onChange={e => setForm({...form, pendidikan: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jurusan</label>
                  <input value={form.jurusan || ''} onChange={e => setForm({...form, jurusan: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tgl Dipanggil (Interview)</label>
                  <input type="date" value={form.tgl_dipanggil ? form.tgl_dipanggil.split('T')[0] : ''} onChange={e => setForm({...form, tgl_dipanggil: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">CV / Lamaran (Link/Nama File)</label>
                  <input value={form.cv_lamaran || ''} onChange={e => setForm({...form, cv_lamaran: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" placeholder="https://drive.google.com/..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Alamat</label>
                  <textarea rows={2} value={form.alamat || ''} onChange={e => setForm({...form, alamat: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Pengalaman</label>
                  <textarea rows={2} value={form.pengalaman || ''} onChange={e => setForm({...form, pengalaman: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Hasil Interview</label>
                  <textarea rows={2} value={form.hasil_interview || ''} onChange={e => setForm({...form, hasil_interview: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 outline-none border-gray-300" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setEditingCandidate(null)} className="px-4 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-100">Batal</button>
              <button form="editCandForm" type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPelamarTab;
