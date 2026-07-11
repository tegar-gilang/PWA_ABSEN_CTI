import React from 'react';

const CutiHRD: React.FC = () => {
  return (
    <div className="p-8">
      
      {/* Judul & Tombol Export */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Cuti</h2>
          <p className="text-gray-500 mt-2 text-sm">Review and manage employee leave requests.</p>
        </div>
        <button className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm">
          <span className="mr-2">📥</span> Export to Excel
        </button>
      </div>

      {/* Tiga Kartu Ringkasan (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Pending */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-2xl mr-4">
            📋
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending</p>
            <h3 className="text-3xl font-bold text-gray-800">4</h3>
          </div>
        </div>

        {/* Card: Approved */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mr-4">
            ✅
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Approved</p>
            <h3 className="text-3xl font-bold text-gray-800">12</h3>
          </div>
        </div>

        {/* Card: Rejected */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl mr-4">
            ❌
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rejected</p>
            <h3 className="text-3xl font-bold text-gray-800">2</h3>
          </div>
        </div>
      </div>

      {/* Tabel Data Cuti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs font-semibold tracking-wide border-b border-gray-200">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Reason (Type & Description)</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              
              {/* Baris 1: Ahmad Ramadhan */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">A</div>
                  <span className="font-semibold text-gray-800">Ahmad Ramadhan</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">Annual Leave</p>
                  <p className="text-xs text-gray-500 mt-1">Family vacation out of town.</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-800">12 Oct - 15 Oct 2023</p>
                  <p className="text-xs text-gray-500 mt-1">4 Days</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span> Pending
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">Approve</button>
                    <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">Reject</button>
                  </div>
                </td>
              </tr>

              {/* Baris 2: Budi Santoso */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">B</div>
                  <span className="font-semibold text-gray-800">Budi Santoso</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">Sick Leave</p>
                  <p className="text-xs text-gray-500 mt-1">Medical checkup & recovery.</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-800">18 Oct - 19 Oct 2023</p>
                  <p className="text-xs text-gray-500 mt-1">2 Days</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span> Pending
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">Approve</button>
                    <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">Reject</button>
                  </div>
                </td>
              </tr>

              {/* Baris 3: Citra Kirana */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">C</div>
                  <span className="font-semibold text-gray-800">Citra Kirana</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">Maternity Leave</p>
                  <p className="text-xs text-gray-500 mt-1">Standard maternity period.</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-800">01 Nov - 31 Jan 2024</p>
                  <p className="text-xs text-gray-500 mt-1">90 Days</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Approved
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-500">
                  Processed
                </td>
              </tr>

              {/* Baris 4: Dian Sastro */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">D</div>
                  <span className="font-semibold text-gray-800">Dian Sastro</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">Unpaid Leave</p>
                  <p className="text-xs text-gray-500 mt-1">Personal matters.</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-800">20 Oct - 25 Oct 2023</p>
                  <p className="text-xs text-gray-500 mt-1">5 Days</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Rejected
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-500">
                  View Reason
                </td>
              </tr>

              {/* Baris 5: Eko Pratama */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">E</div>
                  <span className="font-semibold text-gray-800">Eko Pratama</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">Annual Leave</p>
                  <p className="text-xs text-gray-500 mt-1">Rest and recreation.</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-800">26 Oct - 27 Oct 2023</p>
                  <p className="text-xs text-gray-500 mt-1">2 Days</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span> Pending
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">Approve</button>
                    <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors">Reject</button>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default CutiHRD;