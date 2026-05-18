import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api, { MEDIA_URL } from '../../../utils/api';
import {
    Users, CheckCircle, XCircle, Calendar,
    ClipboardList, AlertTriangle, Search, Check, X, Award, FileText, Loader2
} from 'lucide-react';
import AttendanceModal from './AttendanceModal';

const pct = (attended, total) =>
    total > 0 ? Math.round((attended / total) * 100) : 0;

const AttendanceBadge = ({ meetsMinimum, percentage }) => {
    if (percentage === undefined || percentage === null) return null;
    return percentage >= 90
        ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"><CheckCircle size={9} /> Meets Minimum ({percentage}%)</span>
        : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700"><AlertTriangle size={9} /> Low Attendance ({percentage}%)</span>;
};

const MentorApplications = () => {
    const { user } = useAuth();
    const [apps, setApps] = useState([]);
    const [attendances, setAttendances] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeApp, setActiveApp] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [attRes, mentorIntRes] = await Promise.all([
                api.get('/mentor/attendance'),
                api.get('/admin/interns/all'),
            ]);

            const allInterns = mentorIntRes.data.data || [];
            const myInterns = allInterns.filter(i => i.mentorId === user.id);

            // Map attendance by applicationId
            const attMap = {};
            (attRes.data.data || []).forEach(a => { attMap[a.applicationId] = a; });

            setApps(myInterns);
            setAttendances(attMap);
        } catch (err) {
            console.error('Failed to load interns', err);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = apps.filter(a =>
        !search ||
        a.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.student?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
        a.student?.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.student?.phone?.toLowerCase().includes(search.toLowerCase()) ||
        a.student?.collegeName?.toLowerCase().includes(search.toLowerCase()) ||
        a.internship?.title?.toLowerCase().includes(search.toLowerCase())
    );

    const totalInterns = apps.length;
    const completedCount = apps.filter(a => a.status === 'COMPLETED').length;
    
    // Calculate average attendance rate
    const validAtts = Object.values(attendances).filter(a => a.totalDays > 0);
    const avgAttendance = validAtts.length > 0
        ? Math.round(validAtts.reduce((sum, a) => sum + pct(a.daysAttended, a.totalDays), 0) / validAtts.length)
        : 0;

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 size={36} className="animate-spin text-primary" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 px-2 py-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">Mentor Administration</span>
                    <h2 className="text-3xl font-black text-primary tracking-tight">My Assigned Interns</h2>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Assigned Interns', val: totalInterns, icon: <Users size={16} className="text-primary" />, color: 'border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10' },
                    { label: 'Avg Attendance Rate', val: `${avgAttendance}%`, icon: <Calendar size={16} className="text-blue-500" />, color: 'border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/20' },
                    { label: 'Completed Internships', val: `${completedCount} Completed`, icon: <CheckCircle size={16} className="text-emerald-500" />, color: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/20' },
                ].map((k, i) => (
                    <div key={i} className={`rounded-2xl border p-5 flex items-center gap-4 ${k.color}`}>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">{k.icon}</div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{k.val}</p>
                            <p className="text-[10px] font-bold text-outline dark:text-slate-400 uppercase tracking-widest mt-1.5">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {apps.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-900/40">
                    <Users size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="font-bold text-slate-400 dark:text-slate-500 text-sm uppercase tracking-widest">No interns assigned to you yet.</p>
                </div>
            ) : (<>
                {/* Search Bar */}
                <div className="relative max-w-xs">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search interns or colleges…"
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Intern Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(app => {
                        const att = attendances[app.id];
                        const attended = att?.daysAttended ?? 0;
                        const total = att?.totalDays ?? 0;
                        const p = pct(attended, total);
                        const hasLowAttendance = att && p < 90;

                        return (
                            <div key={app.id} className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-5 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-primary font-black text-xl shrink-0 border border-indigo-100 dark:border-indigo-900">
                                        {app.student?.fullName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-base font-black text-slate-800 dark:text-slate-100 truncate">{app.student?.fullName}</h4>
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                Roll No: {app.student?.rollNumber}
                                            </span>
                                            {app.status === 'COMPLETED' && (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">Completed</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate mt-0.5">
                                            {app.student?.collegeName}
                                        </p>
                                        <p className="text-[10px] font-black text-primary uppercase mt-1">
                                            {app.internship?.title} {app.field?.fieldName ? `· ${app.field.fieldName}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Attendance summary */}
                                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Attendance Progress</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-black">
                                            {att ? `${attended} / ${total} days` : 'Not Marked'}
                                        </span>
                                    </div>
                                    
                                    {att ? (
                                        <>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${p >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${p}%` }} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <AttendanceBadge percentage={p} />
                                                {att.fileUrl && (
                                                    <a
                                                        href={`${MEDIA_URL}/${att.fileUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest inline-flex items-center gap-1 hover:underline"
                                                    >
                                                        <FileText size={12} /> Sheet File
                                                    </a>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                            <AlertTriangle size={12} /> Attendance Sheet Verification Pending
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setActiveApp(app)}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
                                >
                                    <ClipboardList size={14} /> Manage Intern & Attendance
                                </button>
                            </div>
                        );
                    })}
                </div>
            </>)}

            {activeApp && (
                <AttendanceModal
                    application={activeApp}
                    onClose={(refresh) => {
                        setActiveApp(null);
                        if (refresh) fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default MentorApplications;
