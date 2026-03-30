import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { CheckCircle, XCircle, Calendar, Clock, X, Send } from 'lucide-react';

const AttendanceModal = ({ application, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [present, setPresent] = useState(true);
    const [hours, setHours] = useState(8);

    useEffect(() => {
        if (application?.id) {
            fetchAttendance();
        }
    }, [application?.id]);

    const fetchAttendance = async () => {
        try {
            const res = await api.get(`/admin/attendance?applicationId=${application.id}`);
            setAttendanceData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('Marking attendance:', {
                applicationId: application.id,
                date: selectedDate,
                present,
                hours
            });
            const res = await api.post('/admin/attendance/mark', {
                applicationId: application.id,
                date: selectedDate,
                present,
                hours
            });
            console.log('Attendance marked successfully:', res.data);
            fetchAttendance();
            alert('Attendance marked successfully!');
            onClose(true);
        } catch (err) {
            console.error('Failed to mark attendance:', err);
            const errorMsg = err.response?.data?.message || 'Failed to mark attendance. Please try again.';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const attendancePercentage = attendanceData?.totalDays > 0
        ? Math.round((attendanceData.daysAttended / attendanceData.totalDays) * 100)
        : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-emerald-600/80 text-white">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Calendar size={24} /> Mark Attendance
                        </h3>
                        <p className="text-[10px] text-white/70 uppercase font-black mt-1 tracking-widest">
                            {application?.student?.fullName}
                        </p>
                    </div>
                    <button onClick={() => onClose()} className="hover:bg-white/20 p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Attendance Summary */}
                    {attendanceData && (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Attendance Summary</h4>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${attendanceData.meetsMinimum
                                        ? 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                                        : 'bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                                    }`}>
                                    {attendanceData.meetsMinimum ? 'On Track' : 'Needs Attention'}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <p className="text-3xl font-black text-emerald-600">{attendanceData.daysAttended}</p>
                                    <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mt-1">Days Present</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-slate-400 dark:text-slate-500">{attendanceData.totalDays}</p>
                                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Total Days</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-primary dark:text-blue-400">{attendancePercentage}%</p>
                                    <p className="text-[9px] font-bold text-primary dark:text-blue-400 uppercase tracking-widest mt-1">Attendance</p>
                                </div>
                            </div>

                            <div className="w-full h-3 bg-white dark:bg-slate-800 rounded-full overflow-hidden border border-emerald-100 dark:border-emerald-500/20 font-bold">
                                <div
                                    className={`h-full transition-all duration-1000 ${attendanceData.meetsMinimum ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${attendancePercentage}%` }}
                                />
                            </div>
                            <p className="text-[9px] text-emerald-600/60 font-medium uppercase tracking-widest text-center mt-2">
                                Minimum {attendanceData.minimumDays} days required
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" />
                                <input
                                    type="date"
                                    required
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Status</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPresent(true)}
                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${present
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-emerald-300'
                                        }`}
                                >
                                    <CheckCircle size={20} /> Present
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPresent(false)}
                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${!present
                                            ? 'bg-red-50 dark:bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-red-300'
                                        }`}
                                >
                                    <XCircle size={20} /> Absent
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Hours (Optional)</label>
                            <div className="relative">
                                <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" />
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={hours}
                                    onChange={(e) => setHours(parseInt(e.target.value))}
                                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? 'SAVING...' : (
                                <>
                                    <Send size={20} /> {present ? 'MARK PRESENT' : 'MARK ABSENT'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;
