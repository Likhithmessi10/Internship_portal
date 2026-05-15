import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
    Download, FileSpreadsheet, Users, CheckCircle, Award,
    GraduationCap, Calendar, ClipboardList, BarChart3,
    Filter, Loader2, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

// ── Excel helpers ─────────────────────────────────────────────────────────────
const newBook = () => XLSX.utils.book_new();

const addSheet = (wb, rows, sheetName) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // bold + color for header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_col(C) + '1';
        if (ws[addr]) ws[addr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '1e3a5f' } },
            alignment: { horizontal: 'center' }
        };
    }
    // auto column widths
    const colWidths = rows[0]?.map((_, ci) => ({
        wch: Math.min(40, Math.max(12, ...rows.map(r => String(r[ci] ?? '').length)))
    }));
    if (colWidths) ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
};

const saveBook = (wb, filename) =>
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);

// ── Row builders ──────────────────────────────────────────────────────────────
const applicationRow = (app, idx) => {
    const s = app.student || {};
    return [
        idx + 1,
        s.rollNumber || '',
        s.fullName || '',
        s.user?.email || '',
        s.phone || '',
        s.collegeName || '',
        s.branch || '',
        s.yearOfStudy || '',
        s.cgpa ?? '',
        s.collegeCategory || '',
        app.internship?.title || '',
        app.departmentGroup?.department || app.internship?.department || '',
        app.field?.fieldName || '',
        app.preferredLocation || '',
        app.status || '',
        app.assignedRole || '',
        app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : '',
        app.joiningDate ? new Date(app.joiningDate).toLocaleDateString('en-IN') : '',
        app.endDate ? new Date(app.endDate).toLocaleDateString('en-IN') : '',
        app.mentor?.name || '',
        app.isHeldSeat ? 'Yes' : 'No',
    ];
};

const appHeaders = [
    'S.No', 'Roll Number', 'Name', 'Email', 'Phone', 'College', 'Branch',
    'Year', 'CGPA', 'Tier', 'Internship', 'Department', 'Field', 'Location',
    'Status', 'Assigned Role', 'Applied On', 'Joining Date', 'End Date', 'Mentor', 'Hold Seat'
];

const attendanceRow = (rec, idx) => {
    const app = rec.application || {};
    const s   = app.student || {};
    const pct = rec.totalDays > 0 ? Math.round((rec.daysAttended / rec.totalDays) * 100) : 0;
    return [
        idx + 1,
        s.fullName || '',
        s.rollNumber || '',
        s.collegeName || '',
        app.internship?.title || '',
        app.field?.fieldName || app.assignedRole || '',
        rec.daysAttended || 0,
        rec.totalDays || 0,
        `${pct}%`,
        rec.minimumDays || 20,
        rec.meetsMinimum ? 'Yes' : 'No',
        rec.mentorReview || '',
    ];
};

const attHeaders = [
    'S.No', 'Name', 'Roll Number', 'College', 'Internship', 'Field',
    'Days Present', 'Total Days', 'Attendance %', 'Min Required', 'Meets Minimum', 'Mentor Review'
];

const taskRow = (task, idx) => {
    const submitted = task.submissions?.length > 0;
    const rating = task.submissions?.find(s => s.mentorRating)?.mentorRating;
    return [
        idx + 1,
        task.student?.fullName || '',
        task.student?.rollNumber || '',
        task.application?.internship?.title || '',
        task.title || '',
        task.description || '',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '',
        task.status || '',
        submitted ? 'Yes' : 'No',
        task.submissions?.[0]?.submissionDate ? new Date(task.submissions[0].submissionDate).toLocaleDateString('en-IN') : '',
        rating ?? '',
        task.submissions?.[0]?.mentorFeedback || '',
    ];
};

const taskHeaders = [
    'S.No', 'Intern Name', 'Roll Number', 'Internship', 'Task Title', 'Description',
    'Due Date', 'Task Status', 'Submitted', 'Submitted On', 'Rating (1-5)', 'Mentor Feedback'
];

const workLogRow = (log, idx) => {
    const d = new Date(log.date);
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return [
        idx + 1,
        log.student?.rollNumber || '',
        log.student?.fullName || '',
        log._internTitle || '',
        log._fieldName || '',
        log._mentorName || '',
        d.toLocaleDateString('en-IN'),
        DAYS[d.getDay()],
        log.description || '',
        log.hoursWorked ?? '',
    ];
};

const workLogHeaders = [
    'S.No', 'Roll Number', 'Intern Name', 'Internship', 'Field', 'Mentor',
    'Date', 'Day', 'Work Description', 'Hours Worked'
];

// ── Report definitions ────────────────────────────────────────────────────────
const REPORT_DEFS = [
    {
        id: 'all-applications',
        label: 'All Applications',
        description: 'Every application with full candidate profile, status and internship details.',
        icon: Users,
        color: 'border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10',
        iconColor: 'text-primary',
        statuses: null, // no status filter — fetch all
    },
    {
        id: 'shortlisted',
        label: 'Shortlisted',
        description: 'Candidates who passed the initial screening and are awaiting further review.',
        icon: Award,
        color: 'border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/20',
        iconColor: 'text-blue-500',
        statuses: ['SHORTLISTED'],
    },
    {
        id: 'selected',
        label: 'Selected',
        description: 'Candidates selected — in the document collection / verification stage.',
        icon: CheckCircle,
        color: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/20',
        iconColor: 'text-emerald-500',
        statuses: ['SELECTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED'],
    },
    {
        id: 'hired',
        label: 'Hired & Active',
        description: 'Confirmed interns with joining dates, mentors and roll numbers.',
        icon: GraduationCap,
        color: 'border-violet-200 bg-violet-50/50 dark:border-violet-800/50 dark:bg-violet-900/20',
        iconColor: 'text-violet-500',
        statuses: ['HIRED', 'ONGOING', 'COMPLETED'],
    },
    {
        id: 'attendance',
        label: 'Attendance',
        description: 'Day-by-day attendance for every active intern, with minimum-days compliance.',
        icon: Calendar,
        color: 'border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-900/20',
        iconColor: 'text-amber-500',
        statuses: null,
        type: 'attendance',
    },
    {
        id: 'tasks',
        label: 'Task Performance',
        description: 'Work assignments, submission rates and mentor ratings per intern.',
        icon: ClipboardList,
        color: 'border-rose-200 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-900/20',
        iconColor: 'text-rose-500',
        statuses: null,
        type: 'tasks',
    },
    {
        id: 'worklogs',
        label: 'Daily Work Logs',
        description: 'Day-wise work descriptions submitted by interns to their mentor.',
        icon: BarChart3,
        color: 'border-teal-200 bg-teal-50/50 dark:border-teal-800/50 dark:bg-teal-900/20',
        iconColor: 'text-teal-500',
        statuses: null,
        type: 'worklogs',
    },
];

// ── Main component ─────────────────────────────────────────────────────────────
const ReportsPage = () => {
    const { user } = useAuth();
    const role = user?.role;
    const isMentor    = role === 'MENTOR';
    const isHod       = role === 'HOD';
    const isPrti      = role === 'CE_PRTI' || role === 'ADMIN';
    const canExport   = isPrti || isHod;   // PRTI + HOD can preview & export
    const canPreview  = isPrti || isHod;   // Mentor cannot preview

    // Filter state
    const [activeReport, setActiveReport] = useState(null);
    const [dateFrom, setDateFrom]         = useState('');
    const [dateTo, setDateTo]             = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Data state
    const [rows, setRows]           = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);

    // ── Fetch application-type data based on role ───────────────────────────
    const fetchApplications = useCallback(async (statuses) => {
        let apps = [];
        if (isMentor) {
            const res = await api.get('/admin/interns/all');
            apps = res.data.data || [];
        } else if (isHod) {
            const res = await api.get('/admin/hod/learning-applications');
            apps = res.data.data || [];
        } else {
            // PRTI / ADMIN — fetch all internships then all applications
            const intRes = await api.get('/admin/internships?limit=100');
            const internships = intRes.data.data || [];
            const settled = await Promise.allSettled(
                internships.map(i => api.get(`/admin/internships/${i.id}/applications`))
            );
            apps = settled
                .filter(r => r.status === 'fulfilled')
                .flatMap(r => r.value.data.data || []);
        }

        // Status filter
        if (statuses?.length) apps = apps.filter(a => statuses.includes(a.status));

        // Date filter
        if (dateFrom) apps = apps.filter(a => new Date(a.createdAt) >= new Date(dateFrom));
        if (dateTo) {
            const end = new Date(dateTo); end.setHours(23, 59, 59);
            apps = apps.filter(a => new Date(a.createdAt) <= end);
        }

        return apps;
    }, [isMentor, isHod, dateFrom, dateTo]);

    const fetchAttendance = useCallback(async () => {
        const endpoint = isMentor ? '/mentor/attendance' : '/admin/attendance';
        const res = await api.get(endpoint);
        return res.data.data || [];
    }, [isMentor]);

    const fetchTasks = useCallback(async () => {
        const res = await api.get('/mentor/tasks');
        return res.data.data || [];
    }, []);

    const fetchWorkLogs = useCallback(async () => {
        // Get all hired/ongoing/completed applications first
        const apps = await fetchApplications(['HIRED', 'ONGOING', 'COMPLETED']);
        const allLogs = [];
        await Promise.allSettled(apps.map(async (app) => {
            try {
                const res = await api.get(`/admin/applications/${app.id}/work-logs`);
                const logs = res.data.data || [];
                logs.forEach(log => {
                    log._internTitle = app.internship?.title || '';
                    log._fieldName   = app.field?.fieldName || '';
                    log._mentorName  = app.mentor?.name || '';
                });
                allLogs.push(...logs);
            } catch { /* skip app if logs unavailable */ }
        }));
        allLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
        return allLogs;
    }, [fetchApplications]);

    // ── Generate report ─────────────────────────────────────────────────────
    const generate = async (def) => {
        setLoading(true);
        setError('');
        setRows([]);
        setActiveReport(def.id);
        try {
            let data = [];
            if (def.type === 'attendance') {
                data = await fetchAttendance();
            } else if (def.type === 'tasks') {
                if (!isMentor) { setError('Task reports are only available for Mentors.'); setLoading(false); return; }
                data = await fetchTasks();
            } else if (def.type === 'worklogs') {
                data = await fetchWorkLogs();
            } else {
                data = await fetchApplications(def.statuses);
            }
            setRows(data);
            setPreviewOpen(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch report data.');
        } finally {
            setLoading(false);
        }
    };

    // ── Export a single sheet ───────────────────────────────────────────────
    const exportSheet = (def) => {
        if (!rows.length) return;
        const wb = newBook();
        let sheetRows, headers, sheetName;

        if (def.type === 'attendance') {
            headers  = attHeaders;
            sheetRows = [headers, ...rows.map((r, i) => attendanceRow(r, i))];
            sheetName = 'Attendance';
        } else if (def.type === 'tasks') {
            headers  = taskHeaders;
            sheetRows = [headers, ...rows.map((r, i) => taskRow(r, i))];
            sheetName = 'Tasks';
        } else if (def.type === 'worklogs') {
            headers   = workLogHeaders;
            sheetRows = [headers, ...rows.map((r, i) => workLogRow(r, i))];
            sheetName = 'Daily Work Logs';
        } else {
            headers  = appHeaders;
            sheetRows = [headers, ...rows.map((r, i) => applicationRow(r, i))];
            sheetName = def.label;
        }
        addSheet(wb, sheetRows, sheetName);

        // Summary sheet
        const summary = [
            ['APTRANSCO Internship Portal — Report'],
            ['Generated By', user?.name || user?.email || ''],
            ['Generated On', new Date().toLocaleString('en-IN')],
            ['Report Type', def.label],
            ['Role', role],
            [],
            ['Total Records', rows.length],
        ];
        addSheet(wb, summary, 'Summary');
        saveBook(wb, `APTRANSCO_${def.id}`);
    };

    // ── Comprehensive export (all report types in one file) ─────────────────
    const exportAll = async () => {
        setLoading(true);
        setError('');
        try {
            const wb = newBook();

            // Applications sheets
            for (const statuses of [null, ['SHORTLISTED'], ['SELECTED','DOCUMENTS_PENDING','DOCUMENTS_VERIFIED'], ['HIRED','ONGOING','COMPLETED']]) {
                const label = !statuses ? 'All Applications'
                    : statuses[0] === 'SHORTLISTED' ? 'Shortlisted'
                    : statuses.includes('SELECTED') ? 'Selected'
                    : 'Hired & Active';
                const apps = await fetchApplications(statuses);
                if (apps.length) addSheet(wb, [appHeaders, ...apps.map((r, i) => applicationRow(r, i))], label);
            }

            // Attendance
            const atts = await fetchAttendance();
            if (atts.length) addSheet(wb, [attHeaders, ...atts.map((r, i) => attendanceRow(r, i))], 'Attendance');

            // Tasks (mentor only)
            if (isMentor) {
                const tasks = await fetchTasks();
                if (tasks.length) addSheet(wb, [taskHeaders, ...tasks.map((r, i) => taskRow(r, i))], 'Tasks');
            }

            // Daily work logs
            const wlogs = await fetchWorkLogs();
            if (wlogs.length) addSheet(wb, [workLogHeaders, ...wlogs.map((r, i) => workLogRow(r, i))], 'Daily Work Logs');

            // Summary
            addSheet(wb, [
                ['APTRANSCO Internship Portal — Comprehensive Report'],
                ['Generated By', user?.name || user?.email || ''],
                ['Generated On', new Date().toLocaleString('en-IN')],
                ['Role', role],
                ['Sheets included', wb.SheetNames.join(', ')],
            ], 'Summary');

            saveBook(wb, 'APTRANSCO_Comprehensive_Report');
        } catch (err) {
            setError('Comprehensive export failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const activeDef = REPORT_DEFS.find(d => d.id === activeReport);

    // Preview columns based on active report type
    const previewHeaders = activeDef?.type === 'attendance' ? attHeaders
        : activeDef?.type === 'tasks' ? taskHeaders
        : activeDef?.type === 'worklogs' ? workLogHeaders
        : appHeaders;

    const previewRows = rows.slice(0, 8).map((r, i) =>
        activeDef?.type === 'attendance' ? attendanceRow(r, i)
        : activeDef?.type === 'tasks' ? taskRow(r, i)
        : activeDef?.type === 'worklogs' ? workLogRow(r, i)
        : applicationRow(r, i)
    );

    // Visible reports: hide tasks for non-mentor roles
    const visibleReports = REPORT_DEFS.filter(d => d.type !== 'tasks' || isMentor);

    if (!canPreview) return (
        <div className="max-w-6xl mx-auto px-2 py-24 text-center">
            <FileSpreadsheet size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Reports Not Available</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500">Report access is restricted to PRTI and HOD roles.</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 px-2 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">Analytics & Export</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Reports</h2>
                </div>
                {canExport && (
                    <button onClick={exportAll} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                        Export All Sheets
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm font-bold text-red-600 dark:text-red-400">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
            )}

            {/* Date filters (global) */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-surface-container-low dark:bg-slate-800/50 rounded-2xl border border-outline-variant/10 dark:border-slate-700">
                <Filter size={14} className="text-outline dark:text-slate-400 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-400">Global Filters</span>
                <div className="flex flex-wrap items-center gap-3 ml-auto">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-outline dark:text-slate-400 uppercase">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-outline dark:text-slate-400 uppercase">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="text-xs font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                            className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">Clear</button>
                    )}
                </div>
            </div>

            {/* Report type cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleReports.map(def => {
                    const Icon = def.icon;
                    const isActive = activeReport === def.id;
                    return (
                        <div key={def.id}
                            className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all ${def.color} ${isActive ? 'ring-2 ring-primary/30' : ''}`}>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/40 shrink-0">
                                    <Icon size={18} className={def.iconColor} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{def.label}</p>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{def.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <button onClick={() => generate(def)} disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider border border-white/80 dark:border-slate-700 transition-colors disabled:opacity-50">
                                    {loading && isActive ? <Loader2 size={12} className="animate-spin" /> : <BarChart3 size={12} />}
                                    Preview
                                </button>
                                {canExport && (
                                    <button
                                        onClick={isActive && rows.length ? () => exportSheet(def) : () => generate(def)}
                                        disabled={loading}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider border border-white/80 dark:border-slate-700 transition-colors disabled:opacity-50">
                                        <Download size={12} />
                                        {isActive && rows.length ? 'Download' : 'Export'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview panel */}
            {activeReport && rows.length > 0 && (
                <div className="border border-outline-variant/10 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    <button type="button" onClick={() => setPreviewOpen(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet size={16} className="text-primary" />
                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                                {activeDef?.label} — {rows.length} records
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">(showing first 8)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {canExport && (
                                <button onClick={e => { e.stopPropagation(); exportSheet(activeDef); }}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-[11px] font-black uppercase rounded-xl hover:bg-primary/90 transition-colors">
                                    <Download size={12} /> Download {activeDef?.label}
                                </button>
                            )}
                            {previewOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                    </button>

                    {previewOpen && (
                        <div className="border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                                        {previewHeaders.map(h => (
                                            <th key={h} className="px-4 py-2.5 text-[9px] font-black text-outline dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {previewRows.map((row, ri) => (
                                        <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                                                    {String(cell ?? '—')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {rows.length > 8 && (
                                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                        … and {rows.length - 8} more rows — download the Excel file to see all records.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeReport && !loading && rows.length === 0 && (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <BarChart3 size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 dark:text-slate-500 text-sm uppercase tracking-widest">No records found for the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
