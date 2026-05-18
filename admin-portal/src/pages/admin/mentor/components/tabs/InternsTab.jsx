import React, { useState, useEffect } from 'react';
import api from '../../../../../utils/api';
import { useAuth } from '../../../../../context/AuthContext';
import {
    Users, BookOpen, Mail, CheckCircle, Send, Eye,
    ChevronRight, X, ClipboardList, FileText, Star,
    BookMarked, Clock, Download, Loader2
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Daily Logs table inside the drawer ───────────────────────────────────────
const InternLogsPanel = ({ applicationId, internName }) => {
    const [logs, setLogs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        api.get(`/admin/applications/${applicationId}/work-logs`)
            .then(r => setLogs(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [applicationId]);

    const totalHours = logs.reduce((s, l) => s + (l.hoursWorked || 0), 0);

    const handleExport = async () => {
        try {
            setExporting(true);
            const response = await api.get(`/admin/applications/${applicationId}/work-logs/export`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `worklog_intern_${internName.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Failed to export work logs:', err);
            alert('Failed to export work logs. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-indigo-400" />
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {logs.length} entr{logs.length !== 1 ? 'ies' : 'y'}{totalHours > 0 ? ` · ${totalHours}h total` : ''}
                </p>
                {logs.length > 0 && (
                    <button onClick={handleExport} disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 disabled:opacity-50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors">
                        {exporting ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                )}
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No logs submitted yet.</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-wider">#</th>
                                <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-wider">Day</th>
                                <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-wider">Work Done</th>
                                <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-wider text-right">Hrs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {logs.map((log, i) => {
                                const d = new Date(log.date);
                                return (
                                    <tr key={log.id} className={i % 2 === 0 ? '' : 'bg-slate-50/60 dark:bg-slate-800/20'}>
                                        <td className="px-3 py-2.5 font-bold text-slate-400">{i + 1}</td>
                                        <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {d.toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{DAYS[d.getDay()]}</td>
                                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 max-w-[200px]">
                                            <p className="line-clamp-2">{log.description}</p>
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {log.hoursWorked != null ? `${log.hoursWorked}h` : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const InternsTab = ({ internshipId }) => {
    const { user } = useAuth();
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [drawerTab, setDrawerTab] = useState('tasks');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const fetchInterns = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/mentor/internships/${internshipId}/interns?page=${page}&limit=20`);
            setInterns(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to fetch interns:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterns();
    }, [internshipId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (interns.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Interns Assigned</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Interns will appear here once they are hired and assigned to you.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Interns Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Intern</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">College</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {interns.map(intern => (
                            <tr key={intern.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {intern.student.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{intern.student.fullName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Mail size={10} /> {intern.student.user?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{intern.student.collegeName}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{intern.student.rollNumber || 'N/A'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                        intern.status === 'ONGOING' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                        : intern.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                    }`}>
                                        {intern.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-2 min-w-[120px]">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Tasks</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{intern.progress.completedTasks}/{intern.progress.totalTasks}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                            <div
                                                className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${intern.progress.progressPct}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Attendance</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{intern.progress.attendancePct}%</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => { setSelectedIntern(intern); setDrawerTab('tasks'); }}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-xs font-semibold transition-all"
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => fetchInterns(p)}
                            className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                                p === pagination.page
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Profile Drawer */}
            {selectedIntern && (
                <div className="fixed inset-0 bg-black/50  z-[60] flex justify-end" onClick={() => setSelectedIntern(null)}>
                    <div
                        className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Intern Profile</h3>
                                <button
                                    onClick={() => setSelectedIntern(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-slate-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                                    {selectedIntern.student.fullName.charAt(0)}
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{selectedIntern.student.fullName}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedIntern.student.collegeName}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{selectedIntern.student.user?.email}</p>
                            </div>

                            {/* Details */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Roll Number</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedIntern.student.rollNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedIntern.status}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Branch</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedIntern.student.branch || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">CGPA</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedIntern.student.cgpa || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3">Progress</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedIntern.progress.progressPct}%</p>
                                        <p className="text-[10px] uppercase font-semibold text-indigo-600/60 dark:text-indigo-400/60 tracking-wider">Tasks Done</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedIntern.progress.attendancePct}%</p>
                                        <p className="text-[10px] uppercase font-semibold text-indigo-600/60 dark:text-indigo-400/60 tracking-wider">Attendance</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tab switcher */}
                            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                                {[
                                    { key: 'tasks', label: 'Tasks', icon: <ClipboardList size={13} /> },
                                    { key: 'logs',  label: 'Daily Logs', icon: <BookMarked size={13} /> },
                                ].map(t => (
                                    <button key={t.key} onClick={() => setDrawerTab(t.key)}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                                            drawerTab === t.key
                                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}>
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>

                            {drawerTab === 'tasks' && (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedIntern.workAssignments?.length === 0 ? (
                                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No tasks assigned yet</p>
                                    ) : (
                                        selectedIntern.workAssignments?.map(task => (
                                            <div key={task.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        task.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                {task.dueDate && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {drawerTab === 'logs' && (
                                <InternLogsPanel
                                    applicationId={selectedIntern.id}
                                    internName={selectedIntern.student.fullName}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternsTab;
