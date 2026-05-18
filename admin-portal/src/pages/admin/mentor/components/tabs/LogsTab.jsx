import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../../../utils/api';
import {
    Users, BookOpen, Calendar, Download, Search, Clock,
    FileSpreadsheet, Loader2, ChevronRight
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LogsTab = ({ internshipId }) => {
    const [interns, setInterns] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInternId, setSelectedInternId] = useState('all');
    const [search, setSearch] = useState('');
    const [exporting, setExporting] = useState(false);

    const fetchInternsAndLogs = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch interns assigned to this internship
            const internsRes = await api.get(`/mentor/internships/${internshipId}/interns?limit=100`);
            const internList = internsRes.data.data || [];
            setInterns(internList);

            // 2. Fetch logs for all interns
            const settled = await Promise.allSettled(
                internList.map(intern => api.get(`/admin/applications/${intern.id}/work-logs`))
            );
            
            const allLogs = [];
            internList.forEach((intern, idx) => {
                if (settled[idx].status === 'fulfilled') {
                    const studentLogs = settled[idx].value.data.data || [];
                    studentLogs.forEach(log => {
                        allLogs.push({
                            ...log,
                            student: intern.student,
                            applicationId: intern.id
                        });
                    });
                }
            });

            // Sort all logs by date descending
            allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            setLogs(allLogs);
        } catch (err) {
            console.error('Failed to fetch interns or work logs:', err);
        } finally {
            setLoading(false);
        }
    }, [internshipId]);

    useEffect(() => {
        fetchInternsAndLogs();
    }, [fetchInternsAndLogs]);

    // Filtering logic
    const filteredLogs = logs.filter(log => {
        // Filter by selected student
        if (selectedInternId !== 'all' && log.applicationId !== selectedInternId) {
            return false;
        }
        // Filter by search query
        if (search.trim()) {
            const q = search.toLowerCase();
            return (
                log.student?.fullName?.toLowerCase().includes(q) ||
                log.student?.rollNumber?.toLowerCase().includes(q) ||
                log.description?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const url = selectedInternId === 'all'
                ? `/admin/internships/${internshipId}/work-logs/export`
                : `/admin/applications/${selectedInternId}/work-logs/export`;
            
            const response = await api.get(url, { responseType: 'blob' });
            
            // Create a temporary link to download the blob
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            
            const filename = selectedInternId === 'all'
                ? `worklogs_internship_${internshipId}.xlsx`
                : `worklog_intern_${selectedInternId}.xlsx`;
                
            link.setAttribute('download', filename);
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

    // Calculate dynamic stats
    const totalHours = filteredLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
    const uniqueDaysCount = new Set(filteredLogs.map(l => l.date?.split('T')[0])).size;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading daily work logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter and Search Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    {/* Intern Dropdown */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">Intern:</span>
                        <select
                            value={selectedInternId}
                            onChange={e => setSelectedInternId(e.target.value)}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                        >
                            <option value="all">All Interns</option>
                            {interns.map(i => (
                                <option key={i.id} value={i.id}>
                                    {i.student.fullName} ({i.student.rollNumber || 'No Roll No'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search logs or roll number..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>

                {/* Export Excel Button */}
                {filteredLogs.length > 0 && (
                    <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-98"
                    >
                        {exporting ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <FileSpreadsheet size={14} />
                        )}
                        {exporting ? 'Exporting...' : 'Export to Excel'}
                    </button>
                )}
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/10 p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600 dark:text-indigo-400">
                        <BookOpen size={16} />
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{filteredLogs.length}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total Log Entries</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-emerald-600 dark:text-emerald-400">
                        <Clock size={16} />
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{totalHours} hrs</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total Hours Logged</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/10 p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{uniqueDaysCount} days</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Unique Work Days</p>
                    </div>
                </div>
            </div>

            {/* Logs Timeline List */}
            {filteredLogs.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40">
                    <BookOpen size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">
                        No work logs found matching criteria.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/80">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[180px]">Date / Day</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[200px]">Student Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Work Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right w-[120px]">Hours Worked</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {filteredLogs.map((log, idx) => {
                                const d = new Date(log.date);
                                const dateStr = d.toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                });
                                const dayStr = DAYS[d.getDay()];

                                return (
                                    <tr
                                        key={log.id}
                                        className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                                            idx % 2 !== 0 ? 'bg-slate-50/20 dark:bg-slate-800/5' : ''
                                        }`}
                                    >
                                        {/* Date and Day */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{dateStr}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{dayStr}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Student Details */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                                                    {log.student?.fullName?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{log.student?.fullName}</p>
                                                    {log.student?.rollNumber && (
                                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                                            {log.student.rollNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Work Description */}
                                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-lg">
                                            {log.description}
                                        </td>

                                        {/* Hours Worked */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {log.hoursWorked != null ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                                                    <Clock size={10} /> {log.hoursWorked} hrs
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">—</span>
                                            )}
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

export default LogsTab;
