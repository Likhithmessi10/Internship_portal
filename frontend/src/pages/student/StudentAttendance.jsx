import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
    Calendar, CheckCircle, XCircle, Clock, ChevronLeft, 
    Zap, ShieldCheck, MapPin, Briefcase, Award, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentAttendance = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                setProfile(res.data.data);
                
                // Find the active/hired application
                const hired = res.data.data.applications?.find(app => 
                    ['HIRED', 'CA_APPROVED', 'ONGOING'].includes(app.status)
                );
                setSelectedApp(hired);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-[#090e17]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const attendance = selectedApp?.attendance;
    const logs = attendance?.attendanceLog || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-700">
            {/* Header / Breadcrumb */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 group font-black uppercase tracking-widest text-[10px]">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white font-rajdhani uppercase tracking-tight flex items-center gap-4">
                        <Calendar className="text-blue-600" size={32} /> Attendance History
                    </h1>
                </div>
                
                {selectedApp && (
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Program</p>
                            <p className="font-bold text-slate-900 dark:text-white">{selectedApp.internship?.title}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Stats Card 1: Total Attendance */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-6">Total Presence</p>
                        <div className="flex items-end gap-3 mb-6">
                            <h2 className="text-6xl font-black font-rajdhani leading-none">{attendance?.daysAttended || 0}</h2>
                            <p className="text-xl font-bold text-blue-100/60 pb-1 uppercase tracking-tighter">/ {attendance?.totalDays || 0} Days</p>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                            <div 
                                className="h-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-1000 delay-300"
                                style={{ width: `${attendance?.totalDays > 0 ? (attendance.daysAttended / attendance.totalDays) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs font-bold text-blue-100">{attendance?.totalDays > 0 ? Math.round((attendance.daysAttended / attendance.totalDays) * 100) : 0}% Completion Rate</p>
                    </div>
                </div>

                {/* Stats Card 2: Program Status */}
                <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Minimum Requirement</p>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white font-rajdhani">{attendance?.minimumDays || 20} Days</h2>
                            <p className="text-[10px] font-black uppercase text-slate-500 mt-1">Required for Certification</p>
                        </div>
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${attendance?.meetsMinimum ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            <Award size={32} />
                        </div>
                    </div>
                    {attendance?.meetsMinimum ? (
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-600">
                            <CheckCircle size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Eligibility Criteria Met</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600">
                            <Clock size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Ongoing Progress</span>
                        </div>
                    )}
                </div>

                {/* Stats Card 3: Quick Info */}
                <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Help & Support</p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors cursor-pointer group">
                            <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Info size={18} /></div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Discrepancy?</p>
                                <p className="text-[10px] font-bold text-slate-500 leading-tight mt-1">Contact your mentor if you see any errors in logs.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors cursor-pointer group">
                            <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Zap size={18} /></div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Stipend Correlation</p>
                                <p className="text-[10px] font-bold text-slate-500 leading-tight mt-1">Attendance records directly impact your stipend cycle.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Logs Table */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[3rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-black font-rajdhani text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Clock className="text-blue-600" size={24} /> Detailed Log Entries
                    </h2>
                    <div className="flex gap-2">
                        <span className="px-5 py-2 bg-slate-100 dark:bg-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">Filters: All Time</span>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marked At</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {logs.length > 0 ? logs.sort((a,b) => new Date(b.date) - new Date(a.date)).map((log, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-[9px] font-black text-slate-400 leading-none uppercase">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white leading-none mt-0.5">{new Date(log.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.date).getFullYear()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {log.present ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Present
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Absent
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500">
                                                <Clock size={14} />
                                            </div>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{log.hours || 0} Hours</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{new Date(log.markedAt || log.date).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-500/5 px-3 py-1 rounded-lg">
                                            <ShieldCheck size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Mentor Verified</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 mb-6">
                                            <Calendar className="text-slate-300 dark:text-slate-700" size={40} />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mb-2 uppercase tracking-wide">No attendance logs found</p>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-md mx-auto">Your attendance records will appear here after your mentor marks your presence in the system.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
