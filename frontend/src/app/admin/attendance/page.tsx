"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function AdminAttendance() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPunchOut, setEditPunchOut] = useState('');

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const response = await api.get('/attendance');
      setAttendances(response.data.data);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      if (!editPunchOut) return;
      const punchOutDate = new Date(editPunchOut);
      await api.put(`/attendance/${id}`, { punchOut: punchOutDate.toISOString() });
      setEditingId(null);
      fetchAttendances(); // refresh
    } catch (error: any) {
      alert(error.response?.data?.message || 'Update failed');
    }
  };

  const startEdit = (att: any) => {
    setEditingId(att._id);
    const date = att.punchOut ? new Date(att.punchOut) : new Date();
    // format to YYYY-MM-DDTHH:mm
    setEditPunchOut(
      new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Logs</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Worker</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Punch In</th>
                <th className="px-6 py-4">Punch Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att) => (
                <tr key={att._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{format(new Date(att.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">{att.userId?.name}</td>
                  <td className="px-6 py-4 text-gray-500">{att.userId?.workerId}</td>
                  <td className="px-6 py-4">{format(new Date(att.punchIn), 'hh:mm a')}</td>
                  <td className="px-6 py-4">
                    {editingId === att._id ? (
                      <input 
                        type="datetime-local" 
                        value={editPunchOut} 
                        onChange={e => setEditPunchOut(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      />
                    ) : (
                      att.punchOut ? format(new Date(att.punchOut), 'hh:mm a') : '--'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {att.workingMinutes ? `${(att.workingMinutes / 60).toFixed(2)}h` : '--'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      att.status === 'WORKING' ? 'bg-blue-100 text-blue-800' : 
                      att.status === 'MANUALLY_ADJUSTED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {att.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === att._id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(att._id)} className="text-blue-600 hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(att)} className="text-indigo-600 hover:underline">Correct Exit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
