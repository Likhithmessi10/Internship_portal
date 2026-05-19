import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import {
    Server, Database, Activity, RefreshCw, CheckCircle, AlertTriangle,
    XCircle, Clock, Cpu, MemoryStick, Search, Filter, Download, ChevronLeft,
    ChevronRight, Shield, Zap, FileText, User, Target, Calendar,
    Terminal, Globe, Box, BarChart3, AlertCircle, X
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

function fmtDateShort(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
    });
}

const ACTION_CATEGORIES = {
    security:    { label: 'Security',     color: 'bg-red-100 text-red-700',      keys: ['LOGIN', 'FAILED_LOGIN', 'LOGOUT', 'SECURITY', 'UNAUTHORIZED', 'PASSWORD'] },
    application: { label: 'Applications', color: 'bg-blue-100 text-blue-700',    keys: ['APPLICATION', 'STATUS', 'SHORTLIST', 'SELECT', 'HIRE', 'REJECT', 'DOCUMENT', 'VERIFY'] },
    internship:  { label: 'Internships',  color: 'bg-purple-100 text-purple-700', keys: ['INTERNSHIP', 'BATCH', 'PROBLEM', 'COMMITTEE', 'MEETING'] },
    user:        { label: 'Users',        color: 'bg-amber-100 text-amber-700',   keys: ['USER', 'ROLE', 'PROFILE', 'PERMISSION'] },
    system:      { label: 'System',       color: 'bg-slate-100 text-slate-700',   keys: [] }, // catch-all
};

function categorize(action = '') {
    const up = action.toUpperCase();
    for (const [key, cat] of Object.entries(ACTION_CATEGORIES)) {
        if (cat.keys.some(k => up.includes(k))) return { key, ...cat };
    }
    return { key: 'system', ...ACTION_CATEGORIES.system };
}

function StatusDot({ status, pulse = false }) {
    const color = status === 'UP' || status === 'HEALTHY' ? 'bg-emerald-500'
        : status === 'DEGRADED' ? 'bg-amber-500'
        : 'bg-red-500';
    return <span className={`inline-block w-2 h-2 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />;
}

function StatusBadge({ status }) {
    const cfg = status === 'UP' || status === 'HEALTHY'
        ? { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle, label: status }
        : status === 'DEGRADED'
        ? { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle, label: 'DEGRADED' }
        : { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: status || 'DOWN' };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${cfg.color}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
}

// ── Sections ──────────────────────────────────────────────────────────────────

const ServerHealthSection = ({ health, loading, onRefresh, autoRefreshSecs }) => {
    if (loading && !health) return (
        <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw size={28} className="animate-spin text-primary" />
                <p className="text-sm font-bold text-outline uppercase tracking-widest">Running diagnostics…</p>
            </div>
        </div>
    );

    const mem = health?.memory;
    const services = health?.services || {};
    const dist = health?.distribution || {};
    const appTotal = Object.values(dist.applications || {}).reduce((a, b) => a + b, 0);
    const jobTotal = Object.values(dist.jobs || {}).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-8">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <StatusDot status={health?.status} pulse />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">System Status</p>
                        <p className="text-lg font-black text-primary">{health?.status || '—'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-outline">Auto-refreshes in {autoRefreshSecs}s</span>
                    <button onClick={onRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs font-bold text-primary hover:bg-surface-container-high transition-colors">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Now
                    </button>
                </div>
            </div>

            {/* Key metrics strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Clock, label: 'Uptime', value: health ? fmtUptime(health.uptime) : '—', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: Cpu,   label: 'Heap Used', value: mem ? `${mem.heapUsedMb} MB` : '—', color: 'text-blue-600', bg: 'bg-blue-50',
                      sub: mem ? `${mem.heapPct}% of ${mem.heapTotalMb} MB` : '' },
                    { icon: MemoryStick, label: 'RSS Memory', value: mem ? `${mem.rssMb} MB` : '—', color: 'text-purple-600', bg: 'bg-purple-50' },
                    { icon: Terminal, label: 'Node.js', value: health?.nodeVersion || '—', color: 'text-amber-600', bg: 'bg-amber-50',
                      sub: health?.environment || '' },
                ].map(({ icon: Icon, label, value, color, bg, sub }) => (
                    <div key={label} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5">
                        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                            <Icon size={18} className={color} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-0.5">{label}</p>
                        <p className="text-xl font-black text-primary tracking-tight">{value}</p>
                        {sub && <p className="text-[10px] font-bold text-outline/70 mt-0.5">{sub}</p>}
                    </div>
                ))}
            </div>

            {/* Memory bar */}
            {mem && (
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black uppercase tracking-widest text-outline">Heap Usage</p>
                        <p className="text-xs font-bold text-primary">{mem.heapUsedMb} / {mem.heapTotalMb} MB ({mem.heapPct}%)</p>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all ${mem.heapPct > 85 ? 'bg-red-500' : mem.heapPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${mem.heapPct}%` }} />
                    </div>
                </div>
            )}

            {/* Services */}
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-4 flex items-center gap-2">
                    <Box size={12} /> Docker Services
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(services).map(([key, svc]) => (
                        <div key={key} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                svc.status === 'UP' ? 'bg-emerald-50' : svc.status === 'DEGRADED' ? 'bg-amber-50' : 'bg-red-50'
                            }`}>
                                {key === 'database' ? <Database size={20} className={svc.status === 'UP' ? 'text-emerald-600' : 'text-red-600'} />
                                    : key === 'api' ? <Server size={20} className={svc.status === 'UP' ? 'text-emerald-600' : 'text-red-600'} />
                                    : <Globe size={20} className={svc.status === 'UP' ? 'text-emerald-600' : 'text-amber-600'} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-widest text-outline truncate">{svc.name || key}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <StatusDot status={svc.status} />
                                    <span className={`text-sm font-black ${svc.status === 'UP' ? 'text-emerald-700' : svc.status === 'DEGRADED' ? 'text-amber-700' : 'text-red-700'}`}>
                                        {svc.status}
                                    </span>
                                    {svc.latencyMs != null && (
                                        <span className="text-[10px] font-bold text-outline">· {svc.latencyMs}ms</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats: Jobs + Applications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SLO */}
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-5 flex items-center gap-2">
                        <Zap size={12} /> Job SLO Metrics
                    </p>
                    <div className="space-y-3">
                        {[
                            { label: 'Completed Jobs', value: health?.slo?.jobThroughput ?? '—' },
                            { label: 'Failure Rate',   value: health?.slo?.jobFailureRate ?? '0%' },
                            { label: 'Active Workers', value: health?.slo?.activeWorkers ?? 0 },
                            { label: 'Total Jobs Tracked', value: jobTotal },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant/5 last:border-0">
                                <span className="text-xs font-bold text-outline uppercase tracking-wider">{label}</span>
                                <span className="text-sm font-black text-primary">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Application pipeline */}
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-5 flex items-center gap-2">
                        <BarChart3 size={12} /> Application Pipeline · {appTotal} total
                    </p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {Object.entries(dist.applications || {}).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                            <div key={status} className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-wider text-outline w-32 shrink-0 truncate">{status}</span>
                                <div className="flex-1 bg-surface-container-high rounded-full h-2">
                                    <div className="h-2 rounded-full bg-primary transition-all"
                                        style={{ width: appTotal > 0 ? `${Math.round((count / appTotal) * 100)}%` : '0%' }} />
                                </div>
                                <span className="text-xs font-black text-primary w-8 text-right">{count}</span>
                            </div>
                        ))}
                        {!Object.keys(dist.applications || {}).length && (
                            <p className="text-xs text-outline font-bold text-center py-4">No applications yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Last check */}
            <p className="text-[10px] font-bold text-outline/60 text-right">
                Last checked: {health?.timestamp ? fmtDate(health.timestamp) : '—'}
            </p>
        </div>
    );
};

// ── Audit Log Section ─────────────────────────────────────────────────────────

const LIMIT = 50;

const AuditLogSection = () => {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState({ total: 0, limit: LIMIT, offset: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [catFilter, setCat]   = useState('');
    const [from, setFrom]       = useState('');
    const [to, setTo]           = useState('');
    const [page, setPage]       = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const debounceRef = useRef(null);

    const fetchLogs = useCallback(async (opts = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('limit', LIMIT);
            params.set('offset', opts.offset ?? page * LIMIT);
            if (opts.search  ?? search)    params.set('search', opts.search  ?? search);
            if (opts.catFilter ?? catFilter) params.set('action', opts.catFilter ?? catFilter);
            if (opts.from ?? from) params.set('from', new Date(opts.from ?? from).toISOString());
            if (opts.to   ?? to)   params.set('to',   new Date(opts.to   ?? to + 'T23:59:59').toISOString());
            const res = await api.get(`/admin/audit-logs?${params}`);
            setLogs(res.data.data || []);
            setMeta(res.data.meta || { total: 0, limit: LIMIT, offset: 0 });
        } catch (err) {
            console.error('Audit log fetch failed', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, catFilter, from, to]);

    useEffect(() => { fetchLogs(); }, [page]);

    const handleSearch = (v) => {
        setSearch(v);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(0);
            fetchLogs({ search: v, offset: 0 });
        }, 400);
    };

    const applyFilters = () => {
        setPage(0);
        fetchLogs({ offset: 0 });
    };

    const clearFilters = () => {
        setSearch(''); setCat(''); setFrom(''); setTo('');
        setPage(0);
        fetchLogs({ search: '', catFilter: '', from: '', to: '', offset: 0 });
    };

    const exportCSV = () => {
        const header = ['Time', 'Action', 'User', 'Details', 'Target'].join(',');
        const rows = logs.map(l => [
            `"${fmtDate(l.createdAt)}"`,
            `"${l.action}"`,
            `"${l.userEmail}"`,
            `"${(l.details || '').replace(/"/g, '""')}"`,
            `"${l.target || ''}"`,
        ].join(','));
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const totalPages = Math.ceil(meta.total / LIMIT);
    const hasFilters = search || catFilter || from || to;

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={15} />
                    <input value={search} onChange={e => handleSearch(e.target.value)}
                        placeholder="Search actions, users, details…"
                        className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <button onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${showFilters || hasFilters ? 'bg-primary text-white border-primary' : 'bg-surface-container-low border-outline-variant/20 text-primary hover:bg-surface-container-high'}`}>
                    <Filter size={14} /> Filters {hasFilters ? '•' : ''}
                </button>
                {hasFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border border-red-200">
                        <X size={14} /> Clear
                    </button>
                )}
                <button onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold text-primary hover:bg-surface-container-high transition-colors ml-auto">
                    <Download size={14} /> Export CSV
                </button>
                <button onClick={() => fetchLogs()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold text-primary hover:bg-surface-container-high transition-colors">
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-outline mb-1.5">Category</label>
                        <select value={catFilter} onChange={e => setCat(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="">All Categories</option>
                            {Object.entries(ACTION_CATEGORIES).map(([k, c]) => (
                                <option key={k} value={c.keys[0] || k}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-outline mb-1.5">From Date</label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-outline mb-1.5">To Date</label>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <button onClick={applyFilters}
                            className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Stats strip */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-outline">
                <span className="px-2 py-1 bg-surface-container-low rounded-lg">{meta.total} total entries</span>
                <span>·</span>
                <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
                {loading && <RefreshCw size={12} className="animate-spin ml-2" />}
            </div>

            {/* Log table */}
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-outline">Time</th>
                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-outline">Action</th>
                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-outline">User</th>
                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-outline hidden md:table-cell">Details</th>
                            <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-outline hidden lg:table-cell">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                        {loading && !logs.length ? (
                            <tr><td colSpan={5} className="py-16 text-center">
                                <RefreshCw size={24} className="animate-spin text-outline/40 mx-auto" />
                            </td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="py-16 text-center">
                                <p className="text-sm font-bold text-outline uppercase tracking-widest">No logs found</p>
                            </td></tr>
                        ) : logs.map(log => {
                            const cat = categorize(log.action);
                            const isExpanded = expanded === log.id;
                            return (
                                <React.Fragment key={log.id}>
                                    <tr onClick={() => setExpanded(isExpanded ? null : log.id)}
                                        className={`hover:bg-surface-container-low transition-colors cursor-pointer ${isExpanded ? 'bg-surface-container-low' : ''}`}>
                                        <td className="px-5 py-3 text-[11px] font-bold text-outline whitespace-nowrap">
                                            {fmtDateShort(log.createdAt)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${cat.color}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-[11px] font-bold text-primary truncate max-w-[140px]">
                                            {log.userEmail}
                                        </td>
                                        <td className="px-5 py-3 text-[11px] font-medium text-outline hidden md:table-cell max-w-xs truncate">
                                            {log.details || '—'}
                                        </td>
                                        <td className="px-5 py-3 text-[11px] font-mono text-outline hidden lg:table-cell">
                                            {log.target ? log.target.slice(0, 8) + '…' : '—'}
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-surface-container-low">
                                            <td colSpan={5} className="px-5 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <p className="font-black uppercase tracking-widest text-outline mb-1">Full Details</p>
                                                        <p className="font-medium text-primary break-words">{log.details || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase tracking-widest text-outline mb-1">Target Resource ID</p>
                                                        <p className="font-mono text-primary break-all">{log.target || '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase tracking-widest text-outline mb-1">Exact Timestamp</p>
                                                        <p className="font-medium text-primary">{fmtDate(log.createdAt)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase tracking-widest text-outline mb-1">Log ID</p>
                                                        <p className="font-mono text-outline break-all">{log.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-surface-container-high disabled:opacity-40 transition-colors">
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            const p = totalPages <= 7 ? i
                                : page < 4 ? i
                                : page > totalPages - 5 ? totalPages - 7 + i
                                : page - 3 + i;
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-black transition-colors ${p === page ? 'bg-primary text-white' : 'text-outline hover:bg-surface-container-high'}`}>
                                    {p + 1}
                                </button>
                            );
                        })}
                    </div>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-surface-container-high disabled:opacity-40 transition-colors">
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'health', label: 'Server Health', icon: Activity },
    { id: 'audit',  label: 'Audit Logs',    icon: Shield },
];

const AdminSystemPage = () => {
    const location = useLocation();
    const initialTab = location.pathname.endsWith('/audit') ? 'audit' : 'health';
    const [tab, setTab] = useState(initialTab);
    const [health, setHealth] = useState(null);
    const [healthLoading, setHealthLoading] = useState(true);
    const [autoRefreshSecs, setAutoRefreshSecs] = useState(30);

    const fetchHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const res = await api.get('/admin/system/health');
            setHealth(res.data.data);
            setAutoRefreshSecs(30);
        } catch (err) {
            console.error('Health fetch failed', err);
        } finally {
            setHealthLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    // Countdown timer
    useEffect(() => {
        const tick = setInterval(() => setAutoRefreshSecs(s => s > 0 ? s - 1 : 30), 1000);
        return () => clearInterval(tick);
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <header>
                <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase block mb-1">Administration</span>
                <h2 className="text-3xl font-extrabold text-primary tracking-tight">System Console</h2>
                <p className="text-sm text-outline font-medium mt-1">Monitor server health, Docker services, and audit every administrative action.</p>
            </header>

            {/* Quick status bar */}
            {health && (
                <div className="flex flex-wrap items-center gap-4 p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <StatusDot status={health.status} pulse />
                        <StatusBadge status={health.status} />
                    </div>
                    <div className="h-4 w-px bg-outline-variant/20" />
                    <span className="text-xs font-bold text-outline">Uptime: <span className="text-primary">{fmtUptime(health.uptime)}</span></span>
                    <span className="text-xs font-bold text-outline">Memory: <span className="text-primary">{health.memory?.heapUsedMb} MB</span></span>
                    <span className="text-xs font-bold text-outline">Node: <span className="text-primary">{health.nodeVersion}</span></span>
                    <div className="ml-auto flex gap-2">
                        {Object.entries(health.services || {}).map(([k, svc]) => (
                            <span key={k} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-surface-container-low">
                                <StatusDot status={svc.status} />
                                {svc.name?.split(' ')[0]}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-outline-variant/10">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-colors ${tab === id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-outline hover:text-primary'}`}>
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {tab === 'health' && (
                    <ServerHealthSection
                        health={health}
                        loading={healthLoading}
                        onRefresh={fetchHealth}
                        autoRefreshSecs={autoRefreshSecs}
                    />
                )}
                {tab === 'audit' && <AuditLogSection />}
            </div>
        </div>
    );
};

export default AdminSystemPage;
