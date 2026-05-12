import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, Clock, ChevronDown, ChevronUp, Plus, X, AlertTriangle, Lock, Zap } from 'lucide-react';

// ─── tiny helpers ────────────────────────────────────────────────────────────

const Badge = ({ submitted }) =>
    submitted ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
            <CheckCircle size={11} /> Submitted
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">
            <Clock size={11} /> Pending
        </span>
    );

const EMPTY_PS = { title: '', description: '', requirements: '', vacancies: '', locations: [] };

// ─── Problem-statement add form (inline) ─────────────────────────────────────

const PsForm = ({ group, onSuccess }) => {
    const [form, setForm] = useState(EMPTY_PS);
    const [locInput, setLocInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isNonStipend = group.internship?.internshipType === 'NON_STIPEND' ||
        group.internshipType === 'NON_STIPEND';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Problem statement title is required'); return; }
        if (!form.vacancies || parseInt(form.vacancies) < 1) { setError('At least 1 vacancy is required'); return; }
        if (isNonStipend && form.locations.length === 0) { setError('At least one location is required for non-stipend internships'); return; }

        setSubmitting(true);
        setError('');
        try {
            await api.post(
                `/admin/internships/${group.internshipId}/groups/${group.id}/problem-statements`,
                {
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    requirements: form.requirements.trim() || undefined,
                    vacancies: parseInt(form.vacancies),
                    locations: isNonStipend ? form.locations : []
                }
            );
            setForm(EMPTY_PS);
            setLocInput('');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit problem statement');
        } finally {
            setSubmitting(false);
        }
    };

    const addLoc = () => {
        const v = locInput.trim();
        if (v && !form.locations.includes(v)) {
            setForm(f => ({ ...f, locations: [...f.locations, v] }));
        }
        setLocInput('');
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Problem Statement</p>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700">
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Grid Monitoring Dashboard"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                        placeholder="Describe the problem statement..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Requirements / Skills</label>
                    <input
                        type="text"
                        value={form.requirements}
                        onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                        placeholder="e.g. Python, Power Systems"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">
                        Vacancies <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={form.vacancies}
                        onChange={e => setForm(f => ({ ...f, vacancies: e.target.value }))}
                        placeholder="0"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                </div>

                {isNonStipend && (
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">
                            Locations <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={locInput}
                                onChange={e => setLocInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLoc())}
                                placeholder="e.g. Vijayawada"
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                            <button type="button" onClick={addLoc}
                                className="px-4 bg-primary/10 text-primary rounded-lg font-bold text-[10px] uppercase hover:bg-primary/20 transition-colors">
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.locations.map((loc, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase">
                                    {loc}
                                    <button type="button" onClick={() => setForm(f => ({ ...f, locations: f.locations.filter((_, idx) => idx !== i) }))}>
                                        <X size={11} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                    {submitting
                        ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Submitting...</>
                        : <><Plus size={13} /> Submit Problem Statement</>}
                </button>
            </div>
        </form>
    );
};

// ─── Group card ───────────────────────────────────────────────────────────────

const GroupCard = ({ group, onRefresh }) => {
    const [expanded, setExpanded] = useState(!group.hodSubmitted);
    const isLive = group.internship?.publishStatus === 'LIVE';

    return (
        <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${
            isLive ? 'border-indigo-200' : group.hodSubmitted ? 'border-emerald-200' : 'border-amber-200'
        }`}>
            {/* Card header */}
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge submitted={group.hodSubmitted} />
                            {/* LIVE badge — shown when internship is live */}
                            {isLive && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                                    <Zap size={11} /> Live
                                </span>
                            )}
                            {group.internship?.batch && (
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 rounded px-2 py-0.5">
                                    {group.internship.batch.title}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">
                            {group.internship?.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-2">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
                                {group.department}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                                {group.internship?.duration}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-slate-400">payments</span>
                                {group.internship?.internshipType === 'COLLABORATIVE' ? 'With Stipend' : 'No Stipend'}
                            </span>
                            {group.internship?.applicationDeadline && (
                                <span className="flex items-center gap-1 text-red-500">
                                    <span className="material-symbols-outlined text-sm">event</span>
                                    Deadline: {new Date(group.internship.applicationDeadline).toLocaleDateString('en-IN')}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 shrink-0"
                    >
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div className="border-t border-slate-100 p-6 space-y-4 animate-in fade-in duration-200">
                    {/* Existing problem statements */}
                    {group.problemStatements?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Submitted Problem Statements ({group.problemStatements.length})
                            </p>
                            {group.problemStatements.map(ps => (
                                <div key={ps.id} className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                                        {ps.problemStatementNumber}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">{ps.title}</p>
                                        {ps.description && <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">{ps.description}</p>}
                                        <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                            <span>{ps.vacancies} {ps.vacancies === 1 ? 'vacancy' : 'vacancies'}</span>
                                            {Array.isArray(ps.locations) && ps.locations.length > 0 && (
                                                <span>{ps.locations.join(', ')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add / locked state */}
                    {isLive ? (
                        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                <Lock size={16} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-indigo-800">Submissions Locked</p>
                                <p className="text-[11px] font-medium text-indigo-600 mt-0.5">
                                    This internship is now <strong>LIVE</strong> and accepting student applications. Problem statements cannot be added or modified.
                                </p>
                            </div>
                        </div>
                    ) : !group.hodSubmitted || group.problemStatements?.length === 0 ? (
                        <PsForm group={group} onSuccess={onRefresh} />
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-2">Add Another Problem Statement</p>
                            <PsForm group={group} onSuccess={onRefresh} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const HodProblemStatements = () => {
    const { user } = useAuth(); // used for header copy only
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchGroups = async () => {
        setLoading(true);
        setError('');
        try {
            // Single endpoint: queries InternshipDepartmentGroup.department directly.
            // GET /admin/internships can't be used here because GROUP internships store
            // department='ALL' on the parent record, so the HOD dept-filter never matches
            // and submitted groups silently disappear after the first submission.
            const res = await api.get('/admin/hod/group-submissions');
            setGroups(res.data.data || []);
        } catch (err) {
            setError('Failed to load problem statement requests.');
            console.error('[HodProblemStatements] fetchGroups error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGroups(); }, []);

    const pendingCount = groups.filter(g => !g.hodSubmitted).length;
    const submittedCount = groups.filter(g => g.hodSubmitted).length;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <section>
                <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Group Internship Workflow</span>
                <h2 className="text-3xl font-bold text-primary tracking-tight">Problem Statement Submissions</h2>
                <p className="text-sm text-outline font-medium mt-1">
                    Submit problem statements for master internship programmes assigned to <strong>{user?.department}</strong>.
                </p>
            </section>

            {/* Summary row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Clock size={22} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-amber-700">{pendingCount}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pending</p>
                    </div>
                </div>
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle size={22} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-emerald-700">{submittedCount}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Submitted</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-700 flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {groups.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">assignment_turned_in</span>
                    <p className="text-slate-400 font-bold uppercase text-sm tracking-wide">No group internship requests yet.</p>
                    <p className="text-slate-400 text-xs mt-1">PRTI will notify you when problem statements are required.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Pending first */}
                    {groups.filter(g => !g.hodSubmitted).map(g => (
                        <GroupCard key={g.id} group={g} onRefresh={fetchGroups} />
                    ))}
                    {/* Submitted */}
                    {groups.filter(g => g.hodSubmitted).length > 0 && (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-2">Already Submitted</p>
                            {groups.filter(g => g.hodSubmitted).map(g => (
                                <GroupCard key={g.id} group={g} onRefresh={fetchGroups} />
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default HodProblemStatements;
