import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
    Users, CheckCircle, XCircle, Calendar, ChevronDown, ChevronUp,
    ClipboardList, AlertCircle, Search, Check, X
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);

const pct = (attended, total) =>
    total > 0 ? Math.round((attended / total) * 100) : 0;

const AttendanceBadge = ({ meetsMinimum }) =>
    meetsMinimum
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"><CheckCircle size={9} /> Meets Minimum</span>
        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700"><AlertCircle size={9} /> Below Minimum</span>;

// ── Single intern card with expandable log + per-day mark form ────────────────
const InternCard = ({ app, attendance, onMarked }) => {
    const [open, setOpen]           = useState(false);
    const [markDate, setMarkDate]   = useState(today());
    const [present, setPresent]     = useState(true);
    const [hours, setHours]         = useState(8);
    const [saving, setSaving]       = useState(false);
    const [msg, setMsg]             = useState('');

    const log      = attendance?.attendanceLog || [];
    const attended = attendance?.daysAttended ?? 0;
    const total    = attendance?.totalDays ?? 0;
    const minDays  = attendance?.minimumDays ?? 20;
    const p        = pct(attended, total);

    const handleMark = async () => {
        setSaving(true);
        setMsg('');
        try {
            await api.post('/mentor/attendance', {
                applicationId: app.id,
                date: markDate,
                present,
                hours
            });
            setMsg('Saved ✓');
            onMarked();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            {/* Card header */}
            <button type="button" onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg shrink-0">
                    {app.student?.fullName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{app.student?.fullName}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">
                        {app.student?.collegeName} · {app.internship?.title}
                        {app.field?.fieldName ? ` · ${app.field.fieldName}` : ''}
                    </p>
                </div>

                {/* Attendance summary */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="text-right">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">{attended}/{total} <span className="text-slate-400 dark:text-slate-500 font-bold">days</span></p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{p}% present</p>
                    </div>
                    {/* mini progress bar */}
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${p}%` }} />
                    </div>
                    <AttendanceBadge meetsMinimum={attendance?.meetsMinimum} />
                </div>

                {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
            </button>

            {open && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-5 pb-5 pt-4 space-y-5">
                    {/* Stats row (mobile-visible) */}
                    <div className="grid grid-cols-3 gap-3 sm:hidden">
                        {[
                            { label: 'Present', val: attended },
                            { label: 'Total', val: total },
                            { label: '% Rate', val: `${p}%` },
                        ].map(k => (
                            <div key={k.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-primary">{k.val}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{k.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar (full, with label) */}
                    <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            <span>{attended} days attended</span>
                            <span>Minimum: {minDays} days</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${p}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                            <span>{p}% attendance rate</span>
                            <AttendanceBadge meetsMinimum={attendance?.meetsMinimum} />
                        </div>
                    </div>

                    {/* Quick mark form */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Mark Attendance</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <input type="date" value={markDate} max={today()}
                                onChange={e => setMarkDate(e.target.value)}
                                className="text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />

                            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                <button onClick={() => setPresent(true)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-colors ${present ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                                    <Check size={12} /> Present
                                </button>
                                <button onClick={() => setPresent(false)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-colors ${!present ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                                    <X size={12} /> Absent
                                </button>
                            </div>

                            {present && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hours:</span>
                                    <input type="number" min={1} max={12} value={hours}
                                        onChange={e => setHours(parseInt(e.target.value) || 8)}
                                        className="w-16 text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-center focus:outline-none" />
                                </div>
                            )}

                            <button onClick={handleMark} disabled={saving}
                                className="px-4 py-1.5 bg-primary text-white text-xs font-black uppercase rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                            {msg && <span className={`text-[10px] font-bold ${msg.includes('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</span>}
                        </div>
                    </div>

                    {/* Attendance log table */}
                    {log.length > 0 && (
                        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
                            <table className="w-full text-left min-w-[400px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                                        {['Date', 'Status', 'Hours', 'Marked At'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {[...log].sort((a, b) => new Date(b.date) - new Date(a.date)).map((entry, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">{entry.date}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${entry.present ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                    {entry.present ? <><Check size={9}/> Present</> : <><X size={9}/> Absent</>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">{entry.present ? `${entry.hours}h` : '—'}</td>
                                            <td className="px-4 py-2.5 text-[10px] text-slate-400 dark:text-slate-500">{new Date(entry.markedAt).toLocaleTimeString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {log.length === 0 && (
                        <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 py-4">No attendance records yet — mark the first day above.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Bulk mark panel for a single date ─────────────────────────────────────────
const BulkMarkPanel = ({ apps, onMarked }) => {
    const [date, setDate]       = useState(today());
    const [entries, setEntries] = useState({});
    const [saving, setSaving]   = useState(false);
    const [msg, setMsg]         = useState('');

    const activeApps = apps.filter(a => ['HIRED', 'ONGOING', 'SELECTED', 'DOCUMENTS_VERIFIED'].includes(a.status));

    const toggle = (appId, field, val) =>
        setEntries(prev => ({ ...prev, [appId]: { present: true, hours: 8, ...prev[appId], [field]: val } }));

    const handleBulk = async () => {
        const payload = activeApps.map(a => ({
            applicationId: a.id,
            present:  entries[a.id]?.present ?? true,
            hours:    entries[a.id]?.hours   ?? 8,
        }));
        setSaving(true);
        setMsg('');
        try {
            await api.post('/mentor/attendance/bulk', { date, entries: payload });
            setMsg(`Attendance saved for ${payload.length} interns ✓`);
            setEntries({});
            onMarked();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (activeApps.length === 0) return null;

    return (
        <div className="border border-primary/20 dark:border-primary/30 rounded-2xl overflow-hidden bg-primary/5 dark:bg-primary/10">
            <div className="px-5 py-4 border-b border-primary/10 dark:border-primary/20 flex flex-wrap items-center gap-4">
                <ClipboardList size={16} className="text-primary shrink-0" />
                <span className="text-sm font-black text-primary">Bulk Attendance</span>
                <input type="date" value={date} max={today()}
                    onChange={e => setDate(e.target.value)}
                    className="ml-auto text-xs font-bold border border-primary/20 dark:border-primary/30 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <div className="divide-y divide-primary/10 dark:divide-primary/20">
                {activeApps.map(a => {
                    const e = entries[a.id] || { present: true, hours: 8 };
                    return (
                        <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{a.student?.fullName}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate">{a.student?.collegeName}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                    <button onClick={() => toggle(a.id, 'present', true)}
                                        className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase transition-colors ${e.present ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                        <Check size={10} /> P
                                    </button>
                                    <button onClick={() => toggle(a.id, 'present', false)}
                                        className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase transition-colors ${!e.present ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                        <X size={10} /> A
                                    </button>
                                </div>
                                {e.present && (
                                    <input type="number" min={1} max={12} value={e.hours}
                                        onChange={ev => toggle(a.id, 'hours', parseInt(ev.target.value) || 8)}
                                        className="w-14 text-[11px] font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 text-center focus:outline-none" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="px-5 py-3 border-t border-primary/10 dark:border-primary/20 flex items-center gap-4">
                <button onClick={handleBulk} disabled={saving}
                    className="px-5 py-2 bg-primary text-white text-xs font-black uppercase rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {saving ? 'Saving…' : `Save All (${activeApps.length})`}
                </button>
                {msg && <span className={`text-[11px] font-bold ${msg.includes('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</span>}
            </div>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const MentorApplications = () => {
    const { user } = useAuth();
    const [apps, setApps]         = useState([]);
    const [attendances, setAttendances] = useState({});
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');

    const fetchData = useCallback(async () => {
        try {
            // Fetch applications assigned to this mentor
            const intRes = await api.get('/admin/internships');
            const allApps = (intRes.data.data || [])
                .flatMap(i => (i.departmentGroups || []).flatMap(g => g.applications || []).concat(i.applications || []))
                .filter(Boolean);

            // Use the dedicated mentor route instead — cleaner
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
        a.student?.collegeName?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPresent = Object.values(attendances).reduce((s, a) => s + (a.daysAttended || 0), 0);
    const totalDays    = Object.values(attendances).reduce((s, a) => s + (a.totalDays || 0), 0);
    const metMinimum   = Object.values(attendances).filter(a => a.meetsMinimum).length;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 px-2 py-8">
            {/* Header */}
            <div>
                <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">Mentor Portal</span>
                <h2 className="text-3xl font-bold text-primary tracking-tight">My Interns</h2>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Interns',    val: apps.length,    icon: <Users size={15} className="text-primary" />,              color: 'border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10' },
                    { label: 'Days Logged',       val: `${totalPresent}/${totalDays}`, icon: <Calendar size={15} className="text-blue-500" />,   color: 'border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/20' },
                    { label: 'Meet Requirement',  val: `${metMinimum}/${apps.length}`, icon: <CheckCircle size={15} className="text-emerald-500" />, color: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/20' },
                ].map((k, i) => (
                    <div key={i} className={`rounded-2xl border p-4 flex items-center gap-3 ${k.color}`}>
                        {k.icon}
                        <div>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{k.val}</p>
                            <p className="text-[10px] font-bold text-outline dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {apps.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <Users size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 dark:text-slate-500 text-sm uppercase tracking-widest">No interns assigned to you yet.</p>
                </div>
            ) : (<>
                {/* Bulk mark panel */}
                <BulkMarkPanel apps={filtered} onMarked={fetchData} />

                {/* Search */}
                <div className="relative max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or college…"
                        className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                {/* Per-intern cards */}
                <div className="space-y-3">
                    {filtered.map(app => (
                        <InternCard
                            key={app.id}
                            app={app}
                            attendance={attendances[app.id]}
                            onMarked={fetchData}
                        />
                    ))}
                </div>
            </>)}
        </div>
    );
};

export default MentorApplications;
