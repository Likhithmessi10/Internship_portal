import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { CheckCircle, XCircle, FileText, Loader2, AlertCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const MEDIA_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

const STATUS_STYLE = {
    SELECTED:           'bg-indigo-100 text-indigo-700 border-indigo-200',
    DOCUMENTS_PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
    DOCUMENTS_VERIFIED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STAGE_LABEL = {
    SELECTED:           'Awaiting Doc Request',
    DOCUMENTS_PENDING:  'Docs Submitted — Pending Review',
    DOCUMENTS_VERIFIED: 'Docs Verified — Ready to Hire',
};

const DocLink = ({ doc }) => {
    if (!doc) return <span className="text-slate-400 text-[11px]">Not uploaded</span>;
    return (
        <a href={`${MEDIA_URL}/${doc.url}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
            <FileText size={12} /> {doc.type}
        </a>
    );
};

const CandidateCard = ({ app, onRefresh }) => {
    const [open, setOpen]         = useState(false);
    const [loading, setLoading]   = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showReject, setShowReject] = useState(false);
    const [hireOpen, setHireOpen] = useState(false);
    const [joiningDate, setJoiningDate] = useState('');
    const [endDate, setEndDate]   = useState('');

    const student   = app.student;
    const dept      = app.field?.fieldMaster?.department?.name || app.departmentGroup?.department || '—';
    const fieldName = app.field?.fieldName || '—';
    const docs      = app.documents || [];

    const joiningDocs = docs.filter(d => ['NOC', 'BOND', 'UNDERTAKING', 'INSURANCE', 'NOC_LETTER', 'PRINCIPAL_LETTER'].includes(d.type));
    const allDocsPresent = joiningDocs.length >= 3;

    const handleRequestDocs = async () => {
        setLoading(true);
        try {
            await api.post(`/admin/applications/${app.id}/request-documents`);
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        } finally { setLoading(false); }
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            await api.post(`/admin/applications/${app.id}/verify-documents`, { action: 'approve' });
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        } finally { setLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setLoading(true);
        try {
            await api.post(`/admin/applications/${app.id}/verify-documents`, { action: 'reject', reason: rejectReason });
            setShowReject(false);
            setRejectReason('');
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        } finally { setLoading(false); }
    };

    const handleHire = async () => {
        if (!joiningDate || !endDate) { alert('Set joining and end dates'); return; }
        setLoading(true);
        try {
            await api.put(`/admin/applications/${app.id}`, {
                status: 'HIRED',
                joiningDate,
                endDate,
                assignedRole: fieldName
            });
            setHireOpen(false);
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="border border-outline-variant/15 rounded-2xl overflow-hidden bg-white">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(v => !v)}>
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm shrink-0">
                        {student?.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-primary truncate">{student?.fullName || '—'}</p>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-wider truncate">
                            {student?.collegeName} · {dept} · {fieldName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {app.rollNumber && (
                        <span className="font-mono text-[10px] font-black text-primary/60 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                            {app.rollNumber}
                        </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${STATUS_STYLE[app.status] || 'bg-slate-100 text-slate-500'}`}>
                        {STAGE_LABEL[app.status] || app.status}
                    </span>
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded detail */}
            {open && (
                <div className="border-t border-outline-variant/10 px-5 py-5 space-y-5 bg-slate-50/50">
                    <div className="text-[10px] font-bold text-outline uppercase tracking-wider">
                        {student?.user?.email} · Roll: {student?.rollNumber || 'Not assigned'}
                    </div>

                    {/* Documents */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                            Joining Documents ({joiningDocs.length} uploaded)
                        </p>
                        {joiningDocs.length === 0 ? (
                            <p className="text-[11px] text-slate-400 font-bold">No joining documents uploaded yet.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {joiningDocs.map(doc => (
                                    <a key={doc.id} href={`${MEDIA_URL}/${doc.url}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 p-3 bg-white border border-outline-variant/15 rounded-xl hover:border-primary/30 transition-colors group">
                                        <FileText size={14} className="text-primary/50 shrink-0 group-hover:text-primary transition-colors" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-primary uppercase truncate">{doc.type.replace(/_/g, ' ')}</p>
                                            {doc.verified && (
                                                <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                                    <CheckCircle size={8} /> Verified
                                                </p>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/10">
                        {app.status === 'SELECTED' && (
                            <button onClick={handleRequestDocs} disabled={loading}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm">
                                {loading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                Request Documents from Student
                            </button>
                        )}

                        {app.status === 'DOCUMENTS_PENDING' && (
                            <>
                                {!allDocsPresent && (
                                    <div className="w-full flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-700">
                                        <AlertCircle size={13} /> Only {joiningDocs.length} document(s) uploaded. Minimum 3 expected.
                                    </div>
                                )}
                                <button onClick={handleVerify} disabled={loading}
                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm">
                                    {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                    Verify &amp; Approve Documents
                                </button>
                                {!showReject ? (
                                    <button onClick={() => setShowReject(true)}
                                        className="px-5 py-2.5 border border-red-300 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 flex items-center gap-2 transition-colors">
                                        <XCircle size={12} /> Reject Documents
                                    </button>
                                ) : (
                                    <div className="w-full flex items-center gap-2">
                                        <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Reason for rejection..."
                                            className="flex-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-200" />
                                        <button onClick={handleReject} disabled={loading || !rejectReason.trim()}
                                            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-red-700 disabled:opacity-50 flex items-center gap-1 transition-colors">
                                            {loading ? <Loader2 size={11} className="animate-spin" /> : 'Send'}
                                        </button>
                                        <button onClick={() => setShowReject(false)}
                                            className="px-3 py-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors">Cancel</button>
                                    </div>
                                )}
                            </>
                        )}

                        {app.status === 'DOCUMENTS_VERIFIED' && (
                            !hireOpen ? (
                                <button onClick={() => setHireOpen(true)}
                                    className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm">
                                    <CheckCircle size={12} /> Authorize &amp; Hire
                                </button>
                            ) : (
                                <div className="w-full space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1 block">Joining Date</label>
                                            <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)}
                                                className="w-full border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1 block">End Date</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                                className="w-full border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleHire} disabled={loading || !joiningDate || !endDate}
                                            className="flex-1 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest py-3 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
                                            {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                            Confirm Hire
                                        </button>
                                        <button onClick={() => setHireOpen(false)}
                                            className="px-5 py-3 text-slate-500 hover:text-slate-700 font-bold text-[10px] uppercase transition-colors">Cancel</button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const PrtiLearningInterns = () => {
    const [apps, setApps]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState('ALL');

    const fetchApps = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/learning/pending-docs');
            setApps(res.data.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const FILTERS = [
        { key: 'ALL', label: 'All' },
        { key: 'SELECTED', label: 'Awaiting Doc Request' },
        { key: 'DOCUMENTS_PENDING', label: 'Docs Submitted' },
        { key: 'DOCUMENTS_VERIFIED', label: 'Verified — Ready to Hire' },
    ];

    const visible = filter === 'ALL' ? apps : apps.filter(a => a.status === filter);

    const counts = {
        ALL: apps.length,
        SELECTED: apps.filter(a => a.status === 'SELECTED').length,
        DOCUMENTS_PENDING: apps.filter(a => a.status === 'DOCUMENTS_PENDING').length,
        DOCUMENTS_VERIFIED: apps.filter(a => a.status === 'DOCUMENTS_VERIFIED').length,
    };

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-8">
            <header>
                <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">Learning Internship Management</span>
                <h1 className="text-3xl font-black text-primary tracking-tight">Learning Intern Pipeline</h1>
                <p className="text-sm text-outline/60 font-medium mt-1">
                    Manage document collection and hiring for selected NON_STIPEND candidates.
                </p>
            </header>

            {/* Summary strip */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { key: 'SELECTED', label: 'Awaiting Request', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { key: 'DOCUMENTS_PENDING', label: 'Docs Submitted', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { key: 'DOCUMENTS_VERIFIED', label: 'Docs Verified', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { key: 'ALL', label: 'Total Pipeline', color: 'text-primary', bg: 'bg-primary/5' },
                ].map(s => (
                    <button key={s.key} onClick={() => setFilter(s.key)}
                        className={`p-4 rounded-2xl border transition-all text-left ${filter === s.key ? `${s.bg} border-current ring-2 ring-current/20` : 'bg-surface-container-low border-outline-variant/10 hover:border-outline-variant/30'}`}>
                        <p className={`text-2xl font-black ${s.color}`}>{counts[s.key]}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${filter === s.key ? s.color : 'text-outline'}`}>{s.label}</p>
                    </button>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {FILTERS.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f.key ? 'bg-primary text-white border-primary' : 'bg-white text-outline border-outline-variant/20 hover:border-primary/30'}`}>
                        {f.label} ({counts[f.key]})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-primary/30" />
                </div>
            ) : visible.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-outline-variant/30 rounded-2xl">
                    <CheckCircle size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">No candidates in this stage.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map(app => (
                        <CandidateCard key={app.id} app={app} onRefresh={fetchApps} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrtiLearningInterns;
