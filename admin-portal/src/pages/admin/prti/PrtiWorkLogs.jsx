import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import {
    Loader2, Download, Search, ChevronDown, ChevronUp,
    BookOpen, Users, Clock, Calendar, FileSpreadsheet
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_BADGE = {
    HIRED:     'bg-emerald-100 text-emerald-700 border-emerald-200',
    ONGOING:   'bg-indigo-100  text-indigo-700  border-indigo-200',
    COMPLETED: 'bg-purple-100  text-purple-700  border-purple-200',
};

// ── Inline log table ──────────────────────────────────────────────────────────
const LogTable = ({ applicationId }) => {
    const [logs, setLogs]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/admin/applications/${applicationId}/work-logs`)
            .then(r => setLogs(r.data.data || []))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, [applicationId]);

    const base = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

    if (loading) return (
        <tr><td colSpan={6} className="py-6 text-center">
            <Loader2 size={18} className="animate-spin text-indigo-400 mx-auto" />
        </td></tr>
    );

    if (!logs.length) return (
        <tr><td colSpan={6} className="py-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            No logs submitted yet
        </td></tr>
    );

    const totalHours = logs.reduce((s, l) => s + (l.hoursWorked || 0), 0);

    return (
        <>
            {/* sub-header */}
            <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                <td />
                <td colSpan={4} className="px-4 py-2 text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
                    Daily Log — {logs.length} entries · {totalHours}h total
                </td>
                <td className="px-4 py-2 text-right">
                    <a href={`${base}/admin/applications/${applicationId}/work-logs/export`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                        <Download size={10} /> Excel
                    </a>
                </td>
            </tr>
            {/* column headers */}
            <tr className="bg-slate-100/80 dark:bg-slate-800/60">
                <td />
                <td className="px-4 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">#</td>
                <td className="px-4 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</td>
                <td className="px-4 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Work Done</td>
                <td className="px-4 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Hours</td>
                <td />
            </tr>
            {/* log rows */}
            {logs.map((log, i) => {
                const d = new Date(log.date);
                return (
                    <tr key={log.id} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/20'}>
                        <td className="w-10" />
                        <td className="px-4 py-2 text-[11px] font-bold text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.toLocaleDateString('en-IN')}</p>
                            <p className="text-[9px] text-slate-400">{DAYS[d.getDay()]}</p>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 max-w-md">{log.description}</td>
                        <td className="px-4 py-2 text-right text-xs font-black text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {log.hoursWorked != null ? `${log.hoursWorked}h` : '—'}
                        </td>
                        <td />
                    </tr>
                );
            })}
            {/* spacer */}
            <tr className="h-2 bg-indigo-50/30 dark:bg-indigo-900/10">
                <td colSpan={6} />
            </tr>
        </>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PrtiWorkLogs = () => {
    const [internships, setInternships] = useState([]);
    const [appsByInt,   setAppsByInt]   = useState({});
    const [loading,     setLoading]     = useState(true);
    const [selectedInt, setSelectedInt] = useState('all');
    const [search,      setSearch]      = useState('');
    const [expandedId,  setExpandedId]  = useState(null);

    const ACTIVE = ['HIRED', 'ONGOING', 'COMPLETED'];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const intRes = await api.get('/admin/internships?limit=100');
            const ns = (intRes.data.data || []).filter(i => i.internshipType === 'NON_STIPEND');
            setInternships(ns);

            const settled = await Promise.allSettled(
                ns.map(i => api.get(`/admin/internships/${i.id}/applications?limit=500`))
            );
            const map = {};
            ns.forEach((int, idx) => {
                if (settled[idx].status === 'fulfilled') {
                    map[int.id] = (settled[idx].value.data.data || []).filter(a => ACTIVE.includes(a.status));
                }
            });
            setAppsByInt(map);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const allApps = Object.entries(appsByInt).flatMap(([intId, apps]) =>
        apps.map(a => ({ ...a, _intTitle: internships.find(i => i.id === intId)?.title || '—' }))
    );

    const filtered = allApps.filter(a => {
        if (selectedInt !== 'all' && a.internshipId !== selectedInt) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                a.student?.fullName?.toLowerCase().includes(q) ||
                a.student?.collegeName?.toLowerCase().includes(q) ||
                (a.student?.rollNumber || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    const base = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

    const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">PRTI Oversight</span>
                    <h1 className="text-3xl font-black text-primary tracking-tight">Intern Work Logs</h1>
                    <p className="text-sm text-outline/60 font-medium mt-1">
                        Daily activity submitted by hired interns
                    </p>
                </div>
                {selectedInt !== 'all' && (
                    <a href={`${base}/admin/internships/${selectedInt}/work-logs/export`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                        <FileSpreadsheet size={14} /> Export All as Excel
                    </a>
                )}
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-slate-900 border border-outline-variant/15 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">Internship</label>
                    <select
                        value={selectedInt}
                        onChange={e => { setSelectedInt(e.target.value); setExpandedId(null); }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">All Internships</option>
                        {internships.map(i => (
                            <option key={i.id} value={i.id}>{i.title}</option>
                        ))}
                    </select>
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Name, college or roll number…"
                        className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: <Users size={18} className="text-primary" />,   label: 'Total Hired',  value: allApps.length,      cls: 'border-primary/20 bg-primary/5' },
                    { icon: <BookOpen size={18} className="text-indigo-500" />, label: 'Showing', value: filtered.length,    cls: 'border-indigo-200 bg-indigo-50/50' },
                    { icon: <Calendar size={18} className="text-emerald-500" />, label: 'Internships', value: internships.length, cls: 'border-emerald-200 bg-emerald-50/50' },
                ].map(k => (
                    <div key={k.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${k.cls}`}>
                        {k.icon}
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{k.value}</p>
                            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-primary/30" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-outline-variant/30 rounded-2xl">
                    <Users size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">
                        {allApps.length === 0 ? 'No hired interns yet' : 'No results for this filter'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-outline-variant/10">
                                <th className="px-5 py-3.5 text-[10px] font-black text-outline uppercase tracking-widest">Intern</th>
                                <th className="px-5 py-3.5 text-[10px] font-black text-outline uppercase tracking-widest hidden md:table-cell">College</th>
                                <th className="px-5 py-3.5 text-[10px] font-black text-outline uppercase tracking-widest hidden sm:table-cell">Location</th>
                                <th className="px-5 py-3.5 text-[10px] font-black text-outline uppercase tracking-widest text-center">Status</th>
                                <th className="px-5 py-3.5 text-[10px] font-black text-outline uppercase tracking-widest text-center">Logs</th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((app, idx) => {
                                const isOpen = expandedId === app.id;
                                return (
                                    <>
                                        <tr
                                            key={app.id}
                                            onClick={() => toggle(app.id)}
                                            className={`cursor-pointer border-b border-outline-variant/5 transition-colors ${
                                                isOpen
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                                    : idx % 2 === 0
                                                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                                        : 'bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-100/60 dark:hover:bg-slate-700/30'
                                            }`}
                                        >
                                            {/* Intern */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm shrink-0">
                                                        {app.student?.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{app.student?.fullName}</p>
                                                        {app.student?.rollNumber && (
                                                            <p className="font-mono text-[10px] font-bold text-primary/60">{app.student.rollNumber}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* College */}
                                            <td className="px-5 py-3.5 hidden md:table-cell">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-[180px] truncate">{app.student?.collegeName}</p>
                                                <p className="text-[9px] text-slate-400 uppercase">{app._intTitle}</p>
                                            </td>
                                            {/* Location */}
                                            <td className="px-5 py-3.5 hidden sm:table-cell">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{app.preferredLocation || app.field?.fieldName || '—'}</p>
                                            </td>
                                            {/* Status */}
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${STATUS_BADGE[app.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            {/* Log count placeholder — lazy loaded */}
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-400">
                                                    <BookOpen size={12} />
                                                    View
                                                </div>
                                            </td>
                                            {/* Expand arrow */}
                                            <td className="pr-4 text-slate-400">
                                                {isOpen
                                                    ? <ChevronUp size={15} />
                                                    : <ChevronDown size={15} />}
                                            </td>
                                        </tr>

                                        {/* Expanded log rows */}
                                        {isOpen && (
                                            <LogTable applicationId={app.id} />
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PrtiWorkLogs;
