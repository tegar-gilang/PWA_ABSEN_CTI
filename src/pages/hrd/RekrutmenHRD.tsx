import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  Briefcase, 
  Users, 
  CalendarDays, 
  Search, 
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  Filter
} from 'lucide-react';
import { 
  apiHrdGetRecruitmentOverview, 
  apiHrdCreateJobOpening, 
  apiHrdUpdateJobOpening, 
  apiHrdDeleteJobOpening,
  apiHrdGetCandidates,
  apiHrdCreateCandidate,
  apiHrdUpdateCandidateStage,
  apiHrdDeleteCandidate
} from '../../lib/api';
import { JobOpening, Candidate } from '../../types';

const RekrutmenHRD: React.FC = () => {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  // Job Modal State (Add / Edit)
  const [isJobModalOpen, setIsJobModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [jobForm, setJobForm] = useState({ title: '', role: '', status: 'OPEN' as 'OPEN' | 'CLOSED' });
  const [savingJob, setSavingJob] = useState<boolean>(false);

  // Candidates Modal State
  const [isCandidatesModalOpen, setIsCandidatesModalOpen] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);
  const [newCandidateName, setNewCandidateName] = useState<string>('');
  const [newCandidateStage, setNewCandidateStage] = useState<Candidate['stage']>('SCREENING');
  const [addingCandidate, setAddingCandidate] = useState<boolean>(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await apiHrdGetRecruitmentOverview();
      setJobs(res.recruitment || []);
    } catch (err) {
      console.error('Gagal mengambil data rekrutmen:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Summary Metrics
  const totalOpenings = jobs.filter(j => j.status === 'OPEN').length;
  const totalCandidates = jobs.reduce((sum, j) => sum + (Number(j.total_candidates) || 0), 0);
  const scheduledInterviews = jobs.reduce((sum, j) => sum + (Number(j.interview_count) || 0), 0);

  // Open Add Job Modal
  const handleOpenAddJob = () => {
    setEditingJob(null);
    setJobForm({ title: '', role: '', status: 'OPEN' });
    setIsJobModalOpen(true);
  };

  // Open Edit Job Modal
  const handleOpenEditJob = (job: JobOpening) => {
    setEditingJob(job);
    setJobForm({ title: job.title, role: job.role, status: job.status });
    setIsJobModalOpen(true);
  };

  // Save Job (Create or Update)
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title.trim() || !jobForm.role.trim()) {
      alert('Mohon lengkapi judul lowongan dan divisi / role.');
      return;
    }

    setSavingJob(true);
    try {
      if (editingJob) {
        await apiHrdUpdateJobOpening(editingJob.id, {
          title: jobForm.title.trim(),
          role: jobForm.role.trim(),
          status: jobForm.status
        });
      } else {
        await apiHrdCreateJobOpening({
          title: jobForm.title.trim(),
          role: jobForm.role.trim()
        });
      }
      setIsJobModalOpen(false);
      fetchJobs();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal menyimpan lowongan pekerjaan.');
    } finally {
      setSavingJob(false);
    }
  };

  // Delete Job
  const handleDeleteJob = async (job: JobOpening) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus lowongan "${job.title}"? Semua data kandidat terkait akan ikut terhapus.`)) {
      return;
    }
    try {
      await apiHrdDeleteJobOpening(job.id);
      fetchJobs();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal menghapus lowongan pekerjaan.');
    }
  };

  // Open Candidates Management Modal
  const handleOpenCandidates = async (job: JobOpening) => {
    setSelectedJob(job);
    setIsCandidatesModalOpen(true);
    setLoadingCandidates(true);
    setNewCandidateName('');
    setNewCandidateStage('SCREENING');
    try {
      const res = await apiHrdGetCandidates(job.id);
      setCandidates(res.candidates || []);
    } catch (err) {
      console.error('Gagal mengambil data kandidat:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Add Candidate
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !newCandidateName.trim()) return;

    setAddingCandidate(true);
    try {
      await apiHrdCreateCandidate({
        job_opening_id: selectedJob.id,
        name: newCandidateName.trim(),
        stage: newCandidateStage
      });
      setNewCandidateName('');
      // Reload candidates
      const res = await apiHrdGetCandidates(selectedJob.id);
      setCandidates(res.candidates || []);
      // Refresh jobs list to update counts
      fetchJobs();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal menambahkan pelamar.');
    } finally {
      setAddingCandidate(false);
    }
  };

  // Update Candidate Stage
  const handleUpdateCandidateStage = async (candidateId: string, stage: Candidate['stage']) => {
    try {
      await apiHrdUpdateCandidateStage(candidateId, stage);
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage } : c));
      fetchJobs();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal memperbarui status tahapan.');
    }
  };

  // Delete Candidate
  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Hapus pelamar ini?')) return;
    try {
      await apiHrdDeleteCandidate(candidateId);
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      fetchJobs();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal menghapus kandidat.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (jobs.length === 0) {
      alert('Tidak ada data lowongan untuk diekspor.');
      return;
    }

    const headers = ['ID', 'Judul Lowongan', 'Divisi / Role', 'Status', 'Total Pelamar', 'Pelamar Interview', 'Tanggal Dibuat'];
    const rows = jobs.map(j => [
      j.id,
      `"${j.title.replace(/"/g, '""')}"`,
      `"${j.role.replace(/"/g, '""')}"`,
      j.status,
      j.total_candidates || 0,
      j.interview_count || 0,
      j.created_at ? new Date(j.created_at).toLocaleDateString('id-ID') : '-'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekrutmen-cti-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStageBadge = (stage: Candidate['stage']) => {
    switch (stage) {
      case 'SCREENING':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-xs font-semibold">Screening</span>;
      case 'INTERVIEW':
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded text-xs font-semibold">Interview</span>;
      case 'HIRED':
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded text-xs font-semibold">Diterima</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded text-xs font-semibold">Ditolak</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-semibold">{stage}</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 relative w-full bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Rekrutmen & Pelamar</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola lowongan pekerjaan, kandidat pelamar, dan tahapan seleksi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExportCSV}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4 mr-2" /> Export ke CSV
          </button>
          <button 
            onClick={handleOpenAddJob}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Lowongan
          </button>
        </div>
      </div>

      {/* Tiga Kartu Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Openings */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lowongan Dibuka</p>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-800">{totalOpenings}</h3>
            <p className="text-xs text-gray-500 mt-1">{jobs.length} total posisi terdaftar</p>
          </div>
        </div>

        {/* Card 2: Total Candidates */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pelamar</p>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-800">{totalCandidates}</h3>
            <p className="text-xs text-gray-500 mt-1">Kandidat aktif di semua lowongan</p>
          </div>
        </div>

        {/* Card 3: Interviews Scheduled */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tahap Interview</p>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-800">{scheduledInterviews}</h3>
            <p className="text-xs text-gray-500 mt-1">Kandidat siap/dalam tahap wawancara</p>
          </div>
        </div>
      </div>

      {/* Tabel Lowongan Pekerjaan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header / Toolbar */}
        <div className="p-4 md:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 text-lg">Daftar Lowongan Kerja</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
              {filteredJobs.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Status */}
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-transparent border-none text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="OPEN">Hanya OPEN</option>
                <option value="CLOSED">Hanya CLOSED</option>
              </select>
            </div>

            {/* Pencarian */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari lowongan atau role..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64 bg-white" 
              />
            </div>
          </div>
        </div>
        
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-gray-600 font-bold border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Judul Lowongan</th>
                <th className="px-6 py-4">Divisi / Role</th>
                <th className="px-6 py-4">Kandidat Pelamar</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Kelola Kandidat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 rounded-full animate-spin border-2 border-blue-600 border-t-transparent"></div>
                      <span>Memuat data lowongan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">Tidak ada data lowongan ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Gunakan tombol "Tambah Lowongan" untuk membuka rekrutmen baru.</p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const candidateCount = Number(job.total_candidates) || 0;
                  const progressPct = Math.min(100, candidateCount * 10);

                  return (
                    <tr key={job.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {job.title}
                        {job.created_at && (
                          <span className="block text-xs font-normal text-gray-400 mt-0.5">
                            Dibuat: {new Date(job.created_at).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {job.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden mr-3">
                            <div 
                              className={`h-2 rounded-full ${candidateCount > 0 ? 'bg-blue-600' : 'bg-gray-300'}`} 
                              style={{ width: `${progressPct || 5}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{candidateCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {job.status === 'OPEN' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            OPEN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                            CLOSED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleOpenCandidates(job)}
                          className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                        >
                          <Users className="w-3.5 h-3.5 mr-1.5" />
                          Lihat Pelamar ({candidateCount})
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenEditJob(job)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Lowongan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteJob(job)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Hapus Lowongan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit Lowongan */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingJob ? 'Edit Lowongan Kerja' : 'Tambah Lowongan Kerja'}
              </h3>
              <button 
                onClick={() => setIsJobModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveJob} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama / Posisi Pekerjaan <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Senior Frontend Developer"
                  value={jobForm.title}
                  onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Divisi / Kategori Role <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Engineering / IT, Human Resources, Keuangan"
                  value={jobForm.role}
                  onChange={e => setJobForm({ ...jobForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {editingJob && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Lowongan
                  </label>
                  <select 
                    value={jobForm.status}
                    onChange={e => setJobForm({ ...jobForm, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="OPEN">OPEN (Menerima Pelamar)</option>
                    <option value="CLOSED">CLOSED (Ditutup)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={savingJob}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingJob ? 'Menyimpan...' : 'Simpan Lowongan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kelola Pelamar / Kandidat */}
      {isCandidatesModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50/60">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedJob.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Divisi: <span className="font-semibold text-gray-700">{selectedJob.role}</span> &bull; {candidates.length} pelamar
                </p>
              </div>
              <button 
                onClick={() => setIsCandidatesModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* Form Tambah Pelamar Baru */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center">
                  <UserPlus className="w-4 h-4 mr-1.5 text-blue-600" /> Tambah Pelamar Baru
                </h4>
                <form onSubmit={handleAddCandidate} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap Kandidat / Pelamar"
                    required
                    value={newCandidateName}
                    onChange={e => setNewCandidateName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select 
                    value={newCandidateStage}
                    onChange={e => setNewCandidateStage(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="SCREENING">Tahap: Screening</option>
                    <option value="INTERVIEW">Tahap: Interview</option>
                    <option value="HIRED">Tahap: Diterima (Hired)</option>
                    <option value="REJECTED">Tahap: Ditolak (Rejected)</option>
                  </select>
                  <button 
                    type="submit" 
                    disabled={addingCandidate || !newCandidateName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs"
                  >
                    {addingCandidate ? 'Menyimpan...' : 'Tambah'}
                  </button>
                </form>
              </div>

              {/* Daftar Pelamar */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3">Daftar Pelamar untuk Posisi Ini</h4>
                {loadingCandidates ? (
                  <div className="py-10 text-center text-gray-500 text-sm">
                    Memuat daftar pelamar...
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Users className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Belum ada pelamar yang terdaftar</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tambahkan kandidat melalui formulir di atas.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200 bg-white">
                    {candidates.map((cand) => (
                      <div key={cand.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{cand.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStageBadge(cand.stage)}
                            {cand.created_at && (
                              <span className="text-xs text-gray-400">
                                Melamar: {new Date(cand.created_at).toLocaleDateString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Ubah Tahap:</label>
                          <select 
                            value={cand.stage}
                            onChange={e => handleUpdateCandidateStage(cand.id, e.target.value as any)}
                            className="text-xs border border-gray-300 rounded-md py-1 px-2 bg-white focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="HIRED">Hired (Diterima)</option>
                            <option value="REJECTED">Rejected (Ditolak)</option>
                          </select>
                          <button 
                            onClick={() => handleDeleteCandidate(cand.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Pelamar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsCandidatesModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekrutmenHRD;