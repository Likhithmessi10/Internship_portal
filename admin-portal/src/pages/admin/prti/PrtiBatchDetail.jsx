import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../utils/api';
import {
    ArrowLeft, ChevronDown, ChevronUp, CheckCircle, Clock,
    Search, Users, Briefcase, MapPin, AlertCircle, ChevronsDownUp, Rocket, Loader2,
    Plus, X, BookOpen
} from 'lucide-react';

// ── Field card for GROUP NON_STIPEND dept groups ──────────────────────────────
const FieldManager = ({ internshipId, group, onRefresh }) => {
    const [fields, setFields]       = useState(group.fields || []);
    const [showForm, setShowForm]   = useState(false);
    const [form, setForm]           = useState({ fieldName: '', vacancies: '', locations: [] });
    const [locInput, setLocInput]   = useState('');
    const [saving, setSaving]       = useState(false);

    const addLoc = () => {
        const v = locInput.trim();
        if (v && !form.locations.includes(v)) setForm(f => ({ ...f, locations: [...f.locations, v] }));
        setLocInput('');
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.fieldName || !form.vacancies) return;
        setSaving(true);
        try {
            const res = await api.post(`/admin/internships/${internshipId}/groups/${group.id}/fields`, {
                fieldName: form.fieldName,
                vacancies: parseInt(form.vacancies),
                locations: form.locations
            });
            setFields(prev => [...prev, res.data.data]);
            setForm({ fieldName: '', vacancies: '', locations: [] });
            setShowForm(false);
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add field');
        } finally { setSaving(false); }
    };

    const handleDelete = async (fieldId) => {
        if (!window.confirm('Delete this field?')) return;
        try {
            await api.delete(`/admin/internships/${internshipId}/groups/${group.id}/fields/${fieldId}`);
            setFields(prev => prev.filter(f => f.id !== fieldId));
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="space-y-3">
            {/* Existing fields */}
            {fields.map(field => (
                <div key={field.id} className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <BookOpen size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{field.fieldName}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase">
                            <span>{field.vacancies} {field.vacancies === 1 ? 'vacancy' : 'vacancies'}</span>
                            {Array.isArray(field.locations) && field.locations.length > 0 && (
                                <span className="flex items-center gap-1"><MapPin size={9} /> {field.locations.join(', ')}</span>
                            )}
                        </div>
                    </div>
                    <button onClick={() => handleDelete(field.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            ))}

            {fields.length === 0 && !showForm && (
                <div className="py-4 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No fields defined yet</p>
                </div>
            )}

            {/* Add field form */}
            {showForm ? (
                <form onSubmit={handleAdd} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Field</p>
                    <div className="grid grid-cols-2 gap-3">
                        <input required value={form.fieldName} onChange={e => setForm(f => ({ ...f, fieldName: e.target.value }))}
                            placeholder="Field name (e.g. Electrical)"
                            className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <input required type="number" min="1" value={form.vacancies} onChange={e => setForm(f => ({ ...f, vacancies: e.target.value }))}
                            placeholder="Vacancies"
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <div className="flex gap-2">
                            <input value={locInput} onChange={e => setLocInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLoc())}
                                placeholder="Add location"
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            <button type="button" onClick={addLoc} className="px-3 bg-primary/10 text-primary rounded-lg font-bold text-[10px] hover:bg-primary/20">Add</button>
                        </div>
                    </div>
                    {form.locations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {form.locations.map((loc, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">
                                    {loc} <button type="button" onClick={() => setForm(f => ({ ...f, locations: f.locations.filter((_, idx) => idx !== i) }))}><X size={9} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Field
                        </button>
                    </div>
                </form>
            ) : (
                <button onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-primary/30 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-colors">
                    <Plus size={12} /> Add Field
                </button>
            )}
        </div>
    );
};

// ─── tiny helpers ────────────────────────────────────────────────────────────

const pill = (color, text) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${color}`}>
        {text}
    </span>
);

const publishPill = (status) => {
    if (status === 'LIVE')               return pill('bg-emerald-100 text-emerald-700', 'Live');
    if (status === 'PENDING_HOD_INPUTS') return pill('bg-amber-100 text-amber-700', 'Awaiting HODs');
    return pill('bg-slate-100 text-slate-500', 'Draft');
};

const MetricCard = ({ icon, value, label, accent }) => (
    <div className={`p-5 rounded-2xl border ${accent} flex items-center gap-4`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent.replace('border-', 'bg-').replace('/30', '/10')}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{label}</p>
        </div>
    </div>
);

// ─── Problem Statement row ────────────────────────────────────────────────────

const PsRow = ({ ps }) => (
    <div className="flex items-start gap-3 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[11px] shrink-0 mt-0.5">
            {ps.problemStatementNumber}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">{ps.title}</p>
            {ps.description && (
                <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">{ps.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <span className="flex items-center gap-1">
                    <Users size={10} /> {ps.vacancies} {ps.vacancies === 1 ? 'vacancy' : 'vacancies'}
                </span>
                {ps.requirements && (
                    <span className="flex items-center gap-1">
                        <Briefcase size={10} /> {ps.requirements}
                    </span>
                )}
                {Array.isArray(ps.locations) && ps.locations.length > 0 && (
                    <span className="flex items-center gap-1">
                        <MapPin size={10} /> {ps.locations.join(', ')}
                    </span>
                )}
                <span className="text-slate-300">
                    {new Date(ps.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            </div>
        </div>
        <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-1" />
    </div>
);

// ─── Department Group accordion card ─────────────────────────────────────────

const DeptCard = ({ group }) => {
    const [open, setOpen] = useState(!group.hodSubmitted);
    const psCount = group.problemStatements?.length ?? 0;

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${group.hodSubmitted ? 'border-emerald-200' : 'border-amber-200'}`}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${group.hodSubmitted ? 'bg-emerald-50 hover:bg-emerald-100/60' : 'bg-amber-50 hover:bg-amber-100/60'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${group.hodSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {group.hodSubmitted ? <CheckCircle size={17} /> : <Clock size={17} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-wide">{group.department}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            {group.hodSubmitted
                                ? `${psCount} problem statement${psCount !== 1 ? 's' : ''} submitted${group.hodSubmittedAt ? ' · ' + new Date(group.hodSubmittedAt).toLocaleDateString('en-IN') : ''}`
                                : 'Waiting for HOD submission'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {group.hodSubmitted
                        ? pill('bg-emerald-100 text-emerald-700', 'Submitted')
                        : pill('bg-amber-100 text-amber-700', 'Pending')}
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="px-5 py-4 space-y-2 bg-white animate-in fade-in duration-150">
                    {psCount === 0 ? (
                        <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl">
                            <Clock size={22} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Waiting for HOD to submit problem statements
                            </p>
                        </div>
                    ) : (
                        group.problemStatements.map(ps => <PsRow key={ps.id} ps={ps} />)
                    )}
                    {group.applicationsCount > 0 && (
                        <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider pt-1">
                            {group.applicationsCount} application{group.applicationsCount !== 1 ? 's' : ''} received
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Internship section ───────────────────────────────────────────────────────

const InternshipSection = ({ internship, defaultOpen, onLaunch, launching }) => {
    const [open, setOpen] = useState(defaultOpen);
    const isGroup = internship.internshipMode === 'GROUP';
    const isCollaborative = internship.internshipType === 'COLLABORATIVE';

    // Submission progress is only tracked for COLLABORATIVE GROUP internships
    const deptSubmitted = (isGroup && isCollaborative)
        ? internship.departmentGroups.filter(g => g.hodSubmitted).length
        : null;
    const deptTotal = (isGroup && isCollaborative) ? internship.departmentGroups.length : null;
    const pct = deptTotal > 0 ? Math.round((deptSubmitted / deptTotal) * 100) : 0;
    const allSubmitted = isCollaborative
        ? (deptTotal > 0 && deptSubmitted === deptTotal)
        : true; // NON_STIPEND doesn't need HOD submission to launch
    const isLive = internship.publishStatus === 'LIVE';
    const isLaunching = launching;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Internship header */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-start justify-between p-6 text-left hover:bg-slate-50/60 transition-colors"
            >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isGroup ? 'bg-indigo-100 text-indigo-600' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined text-xl">{isGroup ? 'hub' : 'corporate_fare'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-black text-slate-900 leading-tight">{internship.title}</h3>
                            {publishPill(internship.publishStatus)}
                            {isGroup
                                ? pill('bg-indigo-100 text-indigo-700', 'Master')
                                : pill('bg-slate-100 text-slate-600', 'Single Dept')}
                        </div>
                        <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-500 uppercase">
                            <span>{internship.department === 'ALL' ? 'Multi-dept' : internship.department}</span>
                            <span>{internship.duration}</span>
                            <span>{isCollaborative ? 'Collaborative' : 'Non-Collaborative'}</span>
                            {isGroup && isCollaborative && <span>{deptSubmitted}/{deptTotal} depts submitted</span>}
                            {!isGroup && <span>{internship.applicationsCount ?? 0} applications</span>}
                        </div>

                        {/* Submission progress bar — COLLABORATIVE GROUP only */}
                        {isGroup && isCollaborative && deptTotal > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 shrink-0">{pct}%</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="shrink-0 ml-2 mt-1 flex items-center gap-2">
                    {/* Launch button — shown when not yet LIVE */}
                    {!isLive && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onLaunch(internship.id); }}
                            disabled={isLaunching}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm
                                ${allSubmitted
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                                    : 'bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-700'}
                                disabled:opacity-60 disabled:cursor-not-allowed`}
                            title={allSubmitted ? 'All HODs submitted — click to go LIVE' : 'Some HODs have not submitted yet — launch anyway?'}
                        >
                            {isLaunching
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Rocket size={12} />}
                            {isLaunching ? 'Launching…' : 'Launch'}
                        </button>
                    )}
                    {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
            </button>

            {/* Body */}
            {open && (
                <div className="border-t border-slate-100 p-6 space-y-3 animate-in fade-in duration-200">
                    {isGroup && isCollaborative ? (
                        internship.departmentGroups.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                                <AlertCircle size={24} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    No department groups added yet
                                </p>
                            </div>
                        ) : (
                            internship.departmentGroups.map(g => <DeptCard key={g.id} group={g} />)
                        )
                    ) : isGroup && !isCollaborative ? (
                        <>
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-3">
                                <BookOpen size={15} className="text-emerald-600 shrink-0" />
                                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                    Learning Internship — define fields per department below
                                </p>
                            </div>
                            {internship.departmentGroups.map(g => (
                                <div key={g.id} className="border border-slate-200 rounded-xl overflow-hidden mb-2">
                                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                        <Briefcase size={13} className="text-slate-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{g.department}</span>
                                        <span className="ml-auto text-[10px] font-bold text-slate-400">{(g.fields || []).length} field{(g.fields || []).length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="p-4">
                                        <FieldManager internshipId={internship.id} group={g} onRefresh={fetchData} />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-600">
                            {internship.description || 'No description provided.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const PrtiBatchDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [allExpanded, setAllExpanded] = useState(null);
    const [launchingId, setLaunchingId] = useState(null);

    const fetchData = async () => {
        try {
            const res = await api.get(`/admin/batches/${id}/details`);
            setData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load batch details.');
            console.error('[PrtiBatchDetail]', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleLaunch = async (internshipId) => {
        const internship = data?.internships?.find(i => i.id === internshipId);
        const isGroup = internship?.internshipMode === 'GROUP';
        const allSubmitted = isGroup
            ? internship.departmentGroups.every(g => g.hodSubmitted)
            : true;

        const confirmMsg = allSubmitted
            ? `Launch "${internship.title}"? It will become visible to students immediately.`
            : `Some departments haven't submitted yet. Launch "${internship.title}" anyway?`;
        if (!window.confirm(confirmMsg)) return;

        setLaunchingId(internshipId);
        try {
            await api.post(`/prti/internships/${internshipId}/publish`);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to launch internship.');
        } finally {
            setLaunchingId(null);
        }
    };

    const filteredInternships = useMemo(() => {
        if (!data?.internships) return [];
        const q = search.toLowerCase().trim();
        if (!q) return data.internships;
        return data.internships.filter(i => {
            const inTitle = i.title.toLowerCase().includes(q);
            const inDept  = i.department?.toLowerCase().includes(q);
            const inGroup = i.departmentGroups?.some(
                g => g.department.toLowerCase().includes(q) ||
                     g.problemStatements?.some(ps => ps.title.toLowerCase().includes(q))
            );
            return inTitle || inDept || inGroup;
        });
    }, [data, search]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto mt-16 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
    );

    const { batch, internships, summary } = data;

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-8">

            {/* ── Header ── */}
            <header>
                <button
                    onClick={() => navigate('/prti/batches')}
                    className="flex items-center gap-2 text-slate-400 hover:text-primary font-bold text-xs uppercase tracking-wider mb-5 transition-colors"
                >
                    <ArrowLeft size={15} /> Back to Master Programs
                </button>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">
                            Master Program
                        </span>
                        <h1 className="text-3xl font-black text-primary tracking-tight leading-tight">
                            {batch.title}
                        </h1>
                        {batch.description && (
                            <p className="text-sm text-slate-500 font-medium mt-1">{batch.description}</p>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            Created {new Date(batch.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <Link
                        to="/internships/new"
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Add Internship
                    </Link>
                </div>
            </header>

            {/* ── Summary metrics ── */}
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard
                    icon={<span className="material-symbols-outlined text-xl text-primary">description</span>}
                    value={summary.totalInternships}
                    label="Internships"
                    accent="border-primary/20"
                />
                <MetricCard
                    icon={<span className="material-symbols-outlined text-xl text-slate-500">domain</span>}
                    value={summary.totalGroups}
                    label="Departments"
                    accent="border-slate-200"
                />
                <MetricCard
                    icon={<CheckCircle size={20} className="text-emerald-600" />}
                    value={summary.submittedGroups}
                    label="Submitted"
                    accent="border-emerald-200"
                />
                <MetricCard
                    icon={<Clock size={20} className="text-amber-500" />}
                    value={summary.pendingGroups}
                    label="Pending"
                    accent="border-amber-200"
                />
                <MetricCard
                    icon={<span className="material-symbols-outlined text-xl text-indigo-500">assignment</span>}
                    value={summary.totalProblemStmts}
                    label="Problem Stmts"
                    accent="border-indigo-200"
                />
                <MetricCard
                    icon={<Users size={20} className="text-sky-500" />}
                    value={summary.totalVacancies}
                    label="Total Vacancies"
                    accent="border-sky-200"
                />
            </section>

            {/* ── Progress banner (only when there are GROUP internships pending) ── */}
            {summary.pendingGroups > 0 && summary.totalGroups > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
                    <Clock size={18} className="text-amber-600 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-black text-amber-800">
                            {summary.pendingGroups} department{summary.pendingGroups > 1 ? 's' : ''} yet to submit problem statements
                        </p>
                        <div className="mt-1.5 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.round((summary.submittedGroups / summary.totalGroups) * 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1">
                            {summary.submittedGroups} / {summary.totalGroups} completed
                        </p>
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search departments or problem statements…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                </div>
                <button
                    onClick={() => setAllExpanded(v => v === true ? false : true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
                >
                    <ChevronsDownUp size={14} />
                    {allExpanded === false ? 'Expand All' : 'Collapse All'}
                </button>
            </div>

            {/* ── Internship list ── */}
            {filteredInternships.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">folder_open</span>
                    <p className="text-slate-400 font-bold uppercase text-sm tracking-wide">
                        {internships.length === 0 ? 'No internships in this program yet.' : 'No results match your search.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInternships.map((internship, idx) => (
                        <InternshipSection
                            key={internship.id}
                            internship={internship}
                            defaultOpen={allExpanded !== null ? allExpanded : idx === 0}
                            onLaunch={handleLaunch}
                            launching={launchingId === internship.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrtiBatchDetail;
