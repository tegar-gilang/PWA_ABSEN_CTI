import React from 'react';

const RekrutmenHRD: React.FC = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Rekrutmen</h2>
          <p className="text-gray-500 mt-2 text-sm">Kelola lowongan pekerjaan dan kandidat.</p>
        </div>
        <div className="flex space-x-3">
          <button className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm">
            <span className="mr-2">📥</span> Export to Excel
          </button>
          <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm">
            <span className="mr-2">➕</span> Add New Job Opening
          </button>
        </div>
      </div>

      {/* Tiga Kartu Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Openings */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Openings</p>
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center text-lg">
              💼
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-gray-800">12</h3>
            <p className="text-xs text-gray-500 mt-2">+2 from last month</p>
          </div>
        </div>

        {/* Card 2: Total Candidates */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Candidates</p>
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-lg">
              👥
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-gray-800">148</h3>
            <p className="text-xs text-gray-500 mt-2">Active applications</p>
          </div>
        </div>

        {/* Card 3: Interviews Scheduled */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Interviews Scheduled</p>
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-lg">
              📅
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-gray-800">24</h3>
            <p className="text-xs text-gray-500 mt-2">This week</p>
          </div>
        </div>
      </div>

      {/* Tabel Active Job Openings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header / Toolbar */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/30">
          <h3 className="font-bold text-gray-800 text-lg">Active Job Openings</h3>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Filter jobs..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 bg-white" />
          </div>
        </div>
        
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold border-b border-gray-200 bg-white">
                <th className="px-6 py-4">Job Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Candidates</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 bg-white">
              
              {/* Row 1 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-800">Senior Frontend Developer</td>
                <td className="px-6 py-4 text-gray-500">Engineering</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden mr-3">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">45</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold">Interview</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-800">Product Manager</td>
                <td className="px-6 py-4 text-gray-500">Product</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden mr-3">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">24</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold">Screening</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-800">HR Specialist</td>
                <td className="px-6 py-4 text-gray-500">Human Resources</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden mr-3">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">8</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-semibold">Hired</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-800">UX Designer</td>
                <td className="px-6 py-4 text-gray-500">Design</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden mr-3">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">52</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold">Interview</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-500 bg-white flex justify-between items-center">
          <span>Showing 4 of 12 openings</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">Prev</button>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded font-medium">1</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">2</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">3</button>
            <button className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RekrutmenHRD;