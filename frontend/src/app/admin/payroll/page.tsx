"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminPayroll() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payroll?month=${month}&year=${year}`);
      setPayrolls(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payroll', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/payroll/generate', { month, year });
      fetchPayroll();
    } catch (error) {
      alert('Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
        
        <div className="flex gap-4 items-center">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-gray-300 rounded-md px-3 py-2 bg-white">
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-300 rounded-md px-3 py-2 bg-white">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Calculate Payroll'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Worker</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4 text-right">Working Days</th>
                  <th className="px-6 py-4 text-right">Total Hours</th>
                  <th className="px-6 py-4 text-right">Hourly Rate</th>
                  <th className="px-6 py-4 text-right">Gross Salary</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No payroll generated for this month. Click "Calculate Payroll" to generate.</td></tr>
                ) : (
                  payrolls.map((pay) => (
                    <tr key={pay._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{pay.userId?.name}</td>
                      <td className="px-6 py-4 text-gray-500">{pay.userId?.workerId}</td>
                      <td className="px-6 py-4 text-right">{pay.totalWorkingDays}</td>
                      <td className="px-6 py-4 text-right font-medium">{pay.totalWorkingHours}h</td>
                      <td className="px-6 py-4 text-right text-gray-500">₹{pay.hourlyRate}/h</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600 text-lg">₹{pay.grossSalary}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
