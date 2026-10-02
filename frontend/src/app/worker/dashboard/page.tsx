"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

export default function WorkerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [payroll, setPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'WORKER') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const attRes = await api.get(`/attendance/worker/${(user as any).workerId}`);
        setAttendances(attRes.data.data);
        
        // Find today's attendance
        const todayStr = new Date().toISOString().split('T')[0];
        const today = attRes.data.data.find((a: any) => a.date === todayStr);
        setTodayAttendance(today);

        // Fetch payroll for current month
        const now = new Date();
        const payRes = await api.get(`/payroll/${(user as any).workerId}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        if (payRes.data.data.length > 0) {
          setPayroll(payRes.data.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const calculateLiveDuration = () => {
    if (!todayAttendance || !todayAttendance.punchIn || todayAttendance.punchOut) return null;
    const punchInDate = new Date(todayAttendance.punchIn);
    const diffMs = currentTime.getTime() - punchInDate.getTime();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase">GOOD MORNING, {user.name}</h1>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 font-medium hover:text-red-800">
            Log Out
          </button>
        </div>

        {/* Today's Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Today's Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 uppercase">Status</span>
              <span className={`font-bold text-lg flex items-center gap-2 ${
                !todayAttendance ? 'text-gray-500' :
                todayAttendance.status === 'WORKING' ? 'text-blue-600' : 'text-green-600'
              }`}>
                <span className={`w-3 h-3 rounded-full ${
                  !todayAttendance ? 'bg-gray-400' :
                  todayAttendance.status === 'WORKING' ? 'bg-blue-600 animate-pulse' : 'bg-green-600'
                }`}></span>
                {todayAttendance ? todayAttendance.status : 'NOT STARTED'}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 uppercase">Punch In</span>
              <span className="font-semibold text-gray-900 text-lg">
                {todayAttendance?.punchIn ? new Date(todayAttendance.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 uppercase">
                {todayAttendance?.status === 'WORKING' ? 'Current Time' : 'Working Hours'}
              </span>
              <span className="font-semibold text-gray-900 text-lg">
                {todayAttendance?.status === 'WORKING' 
                  ? calculateLiveDuration() 
                  : todayAttendance?.workingMinutes 
                    ? `${Math.floor(todayAttendance.workingMinutes / 60)}h ${todayAttendance.workingMinutes % 60}m` 
                    : '--'}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 uppercase">Estimated Earnings</span>
              <span className="font-semibold text-gray-900 text-lg">
                {todayAttendance?.dailySalary ? `₹${todayAttendance.dailySalary}` : '--'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Summary */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Monthly Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Hours:</span>
                <span className="font-bold text-gray-900">{payroll ? payroll.totalWorkingHours : '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Working Days:</span>
                <span className="font-bold text-gray-900">{payroll ? payroll.totalWorkingDays : '0'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-gray-600 font-semibold">Estimated Salary:</span>
                <span className="font-bold text-green-600 text-xl">₹{payroll ? payroll.grossSalary : '0'}</span>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Attendance History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">In</th>
                    <th className="px-4 py-3">Out</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.slice(0, 10).map((record: any) => (
                    <tr key={record._id} className="border-b">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        {record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-4 py-3">
                        {record.workingMinutes ? `${Math.floor(record.workingMinutes / 60)}h ${record.workingMinutes % 60}m` : '--'}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        {record.dailySalary ? `₹${record.dailySalary}` : '--'}
                      </td>
                    </tr>
                  ))}
                  {attendances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
