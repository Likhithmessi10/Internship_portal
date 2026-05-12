import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import ApplicationProfileModal from '../ApplicationProfileModal';
import {
    Search, ChevronDown, ChevronUp, Award, Users, CheckCircle,
    XCircle, Check, X, Eye, ClipboardList, Briefcase, Clock, Star,
    BookOpen, MapPin, Layers
} from 'lucide-react';

const STATUS_COLOR = {
    SUBMITTED:              'bg-slate-100 text-slate-600 border-slate-200',
    SHORTLISTED:            'bg-blue-50 text-blue-700 border-blue-200',
    UNDER_COMMITTEE_REVIEW: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SELECTED:               'bg-emerald-50 text-emerald-700 border-emerald-200',
    APPROVED:               'bg-emerald-50 text-emerald-700 border-emerald-200',
    DOCUMENTS_PENDING:      'bg-amber-50 text-amber-700 border-amber-200',
    DOCUMENTS_VERIFIED:     'bg-teal-50 text-teal-700 border-teal-200',
    HIRED:                  'bg-emerald-100 text-emerald-800 border-emerald-300',
    REJECTED:               'bg-red-50 text-red-700 border-red-200',
    ONGOING:                'bg-indigo-50 text-indigo-700 border-indigo-200',
    COMPLETED:              'bg-purple-50 text-purple-700 border-purple-200',
};

// ── Learning Internships tab ──────────────────────────────────────────────────
const LearningTab = () => {
    const [apps, setApps]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [selected, setSelected] = useState(null);

    const fetchApps = useCallback(async (bg = false) => {
        if (!bg) setLoading(true);
        try {
            const res = await api.get('/admin/hod/learning-applications');
            setApps(res.data.data || []);
        } catch { /* silent */ }
        finally { if (!bg) setLoading(false); }
    }, []);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const handleAction = async (appId, newStatus) => {
        try {
            await api.put(`/admin/applications/${appId}`, { status: newStatus });
            fetchApps(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    // Group by internship → field
    const grouped = {};
    apps.forEach(app => {
        const intId    = app.internship?.id || 'unknown';
        const intTitle = app.internship?.title || 'Unknown';
        if (!grouped[intId]) grouped[intId] = { title: intTitle, fields: {} };
        const fieldKey   = app.field?.id || app.fieldId || 'no-field';
        const fieldLabel = app.field?.fieldName || 'General';
        if (!grouped[intId].fields[fieldKey]) {
            grouped[intId].fields[fieldKey] = {
                label: fieldLabel,
                locations: app.field?.locations || [],
                vacancies: app.field?.vacancies || 0,
                apps: []
            };
        }
        grouped[intId].fields[fieldKey].apps.push(app);
    });

    const internships = Object.entries(grouped);
    const q = search.toLowerCase();
    const filtered = internships.map(([id, data]) => ({
        id,
        title: data.title,
        fields: Object.entries(data.fields).filter(([, f]) =>
            !q || f.label.toLowerCase().includes(q) ||
            f.apps.some(a => a.student?.fullName?.toLowerCase().includes(q) || a.student?.collegeName?.toLowerCase().includes(q))
        )
    })).filter(i => i.fields.length > 0 || !q);

    const totalApps = apps.length;
    const selectionCount = apps.filter(a => ['SELECTED', 'HIRED', 'ONGOING'].includes(a.status)).length;
    const rejected  = apps.filter(a => a.status === 'REJECTED').length;

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Applied', value: totalApps, color: 'border-primary/20 bg-primary/5', icon: <Users size={16} className="text-primary" /> },
                    { label: 'Selected / Hired', value: selectionCount, color: 'border-emerald-200 bg-emerald-50/50', icon: <CheckCircle size={16} className="text-emerald-500" /> },
                    { label: 'Rejected',      value: rejected,  color: 'border-red-200 bg-red-50/50', icon: <XCircle size={16} className="text-red-500" /> },
                ].map((k, i) => (
                    <div key={i} className={`rounded-2xl border p-4 flex items-center gap-3 ${k.color}`}>
                        {k.icon}
                        <div>
                            <p className="text-2xl font-black text-slate-800">{k.value}</p>
                            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, college or field…"
                    className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            {filtered.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-outline-variant/30 rounded-2xl">
                    <BookOpen size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 uppercase text-sm tracking-widest">No Learning Internship applications yet.</p>
                </div>
            ) : filtered.map(({ id, title, fields }) => (
                <div key={id} className="border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
                    {/* Internship header */}
                    <div className="px-5 py-3 bg-surface-container flex items-center gap-3 border-b border-outline-variant/10">
                        <BookOpen size={15} className="text-emerald-600 shrink-0" />
                        <span className="text-sm font-black text-primary">{title}</span>
                        <span className="ml-auto text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            Learning Internship
                        </span>
                    </div>

                    {/* Fields */}
                    <div className="divide-y divide-outline-variant/10 bg-white">
                        {fields.map(([fieldKey, fieldData]) => (
                            <FieldSection
                                key={fieldKey}
                                fieldData={fieldData}
                                searchQ={q}
                                onAction={handleAction}
                                onView={setSelected}
                                department={fieldData.apps[0]?.departmentGroup?.department || fieldData.apps[0]?.internship?.department || ''}
                                onRefresh={() => fetchApps(true)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {selected && (
                <ApplicationProfileModal
                    application={selected}
                    internship={selected.internship}
                    allApplications={apps}
                    onClose={() => setSelected(null)}
                    updateStatus={async (newStatus, extra) => {
                        try {
                            await api.put(`/admin/applications/${selected.id}`, { status: newStatus, ...extra });
                            fetchApps(true);
                            setSelected(null);
                        } catch { alert('Failed to update.'); }
                    }}
                />
            )}
        </div>
    );
};

// ── Inline mentor assignment cell for HIRED learning interns ─────────────────
const AssignMentorCell = ({ app, department, onAssigned }) => {
    const [mentors, setMentors]   = useState([]);
    const [picked, setPicked]     = useState(app.mentorId || '');
    const [saving, setSaving]     = useState(false);
    const [open, setOpen]         = useState(false);

    const load = async () => {
        if (mentors.length) { setOpen(true); return; }
        try {
            const res = await api.get(`/admin/users?role=MENTOR&department=${encodeURIComponent(department)}`);
            setMentors((res.data.data || []).filter(m => m.department === department));
        } catch { /* silent */ }
        setOpen(true);
    };

    const handleSave = async () => {
        if (!picked) return;
        setSaving(true);
        try {
            await api.put(`/admin/applications/${app.id}/mentor`, { mentorId: picked });
            onAssigned();
            setOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to assign mentor');
        } finally { setSaving(false); }
    };

    const assignedMentorName = app.mentor?.name || mentors.find(m => m.id === picked)?.name;

    if (!open) {
        return (
            <button onClick={load}
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border transition-colors ${
                    app.mentorId
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}>
                {app.mentorId ? (assignedMentorName || 'Mentor Set ✓') : '+ Assign Mentor'}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <select value={picked} onChange={e => setPicked(e.target.value)}
                className="text-xs font-bold border border-outline-variant/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[160px]">
                <option value="">-- Select Mentor --</option>
                {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
            <button onClick={handleSave} disabled={saving || !picked}
                className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {saving ? '…' : 'Save'}
            </button>
            <button onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors px-1">✕</button>
        </div>
    );
};

// ── Field section inside a Learning Internship ────────────────────────────────
const FieldSection = ({ fieldData, searchQ, onAction, onView, department, onRefresh }) => {
    const [open, setOpen] = useState(true);
    const filtered = fieldData.apps.filter(app => {
        if (!searchQ) return true;
        return app.student?.fullName?.toLowerCase().includes(searchQ) ||
               app.student?.collegeName?.toLowerCase().includes(searchQ);
    }).sort((a, b) => (b.student?.cgpa || 0) - (a.student?.cgpa || 0));

    const hired    = fieldData.apps.filter(a => a.status === 'HIRED').length;
    const vacancies = fieldData.vacancies;

    return (
        <div>
            <button type="button" onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-sm font-black text-slate-800">{fieldData.label}</span>
                {fieldData.locations?.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                        <MapPin size={10} /> {fieldData.locations.join(', ')}
                    </span>
                )}
                <span className="ml-auto text-[10px] font-bold text-slate-500 shrink-0">
                    {hired}/{vacancies} hired · {fieldData.apps.length} applied
                </span>
                {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
            </button>

            {open && (
                <div className="border-t border-slate-100 overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="py-8 text-center text-sm font-bold text-slate-400">No applicants match the search.</div>
                    ) : (
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    {['Candidate', 'College', 'CGPA', 'Location', 'Status', 'Mentor', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-2.5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-slate-100">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(app => (
                                    <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-bold text-slate-800">{app.student?.fullName}</p>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">{app.student?.branch}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-xs font-semibold text-slate-700 max-w-[160px] truncate">{app.student?.collegeName}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{app.student?.collegeCategory}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-black text-slate-700">{app.student?.cgpa?.toFixed(2) ?? '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-bold text-slate-500">{app.preferredLocation || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${STATUS_COLOR[app.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {['HIRED', 'ONGOING', 'COMPLETED', 'DOCUMENTS_VERIFIED'].includes(app.status) ? (
                                                <AssignMentorCell app={app} department={department} onAssigned={onRefresh} />
                                            ) : (
                                                <span className="text-[10px] text-slate-300 font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* HOD actions: up to SELECTED only */}
                                                {app.status === 'SUBMITTED' && (
                                                    <button onClick={() => onAction(app.id, 'SHORTLISTED')}
                                                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors" title="Shortlist">
                                                        <Award size={13} />
                                                    </button>
                                                )}
                                                {['SUBMITTED', 'SHORTLISTED'].includes(app.status) && (
                                                    <button onClick={() => onAction(app.id, 'SELECTED')}
                                                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors" title="Select (PRTI verifies docs next)">
                                                        <Check size={13} />
                                                    </button>
                                                )}
                                                {['SUBMITTED', 'SHORTLISTED', 'SELECTED'].includes(app.status) && (
                                                    <button onClick={() => onAction(app.id, 'REJECTED')}
                                                        className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors" title="Reject">
                                                        <X size={13} />
                                                    </button>
                                                )}
                                                {/* Show doc status for post-SELECTED stages */}
                                                {['DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'HIRED'].includes(app.status) && (
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                                        PRTI Handling
                                                    </span>
                                                )}
                                                <button onClick={() => onView(app)}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-colors flex items-center gap-1">
                                                    <Eye size={11} /> View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

// ── College tier classification ───────────────────────────────────────────────
const TOP_CATEGORIES = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];

const classifyApp = (app, preferredColleges = []) => {
    const name = (app.student?.collegeName || '').toLowerCase();
    const cat  = app.student?.collegeCategory || '';
    const isPreferred = preferredColleges.some(pc =>
        name.includes(pc.toLowerCase()) || pc.toLowerCase().includes(name)
    );
    if (isPreferred) return 'PREFERRED';
    if (TOP_CATEGORIES.includes(cat)) return 'TOP';
    return 'REGULAR';
};

const TIER_META = {
    PREFERRED: {
        label: 'Preferred Colleges',
        headerCls: 'bg-amber-50 border-amber-200 hover:bg-amber-100/60',
        badgeCls:  'bg-amber-100 text-amber-700 border-amber-200',
        barCls:    'bg-amber-400',
        dotCls:    'bg-amber-400',
    },
    TOP: {
        label: 'Top Universities',
        headerCls: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100/60',
        badgeCls:  'bg-indigo-100 text-indigo-700 border-indigo-200',
        barCls:    'bg-indigo-500',
        dotCls:    'bg-indigo-500',
    },
    REGULAR: {
        label: 'Regular Colleges',
        headerCls: 'bg-slate-50 border-slate-200 hover:bg-slate-100/60',
        badgeCls:  'bg-slate-100 text-slate-600 border-slate-200',
        barCls:    'bg-slate-400',
        dotCls:    'bg-slate-400',
    },
};



// ── Single tier accordion ─────────────────────────────────────────────────────
const TierAccordion = ({ tier, apps, suggested, ps, onShortlist, onAction, onView }) => {
    const [open, setOpen]   = useState(apps.length > 0);
    const [search, setSearch] = useState('');
    const meta       = TIER_META[tier];
    const shortlisted = apps.filter(a => a.status === 'SHORTLISTED').length;
    const pct         = suggested > 0 ? Math.min(100, Math.round((shortlisted / suggested) * 100)) : 0;
    const done        = shortlisted >= suggested && suggested > 0;

    const filtered = apps
        .filter(app => {
            const q = search.toLowerCase();
            return !q ||
                app.student?.fullName?.toLowerCase().includes(q) ||
                app.student?.collegeName?.toLowerCase().includes(q);
        })
        .sort((a, b) => (b.student?.cgpa || 0) - (a.student?.cgpa || 0));

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${meta.headerCls.split(' ')[1]}`}>
            {/* Tier header (always visible) */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${meta.headerCls}`}
            >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dotCls}`} />

                {/* Label + badge */}
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border ${meta.badgeCls}`}>
                    {meta.label}
                </span>

                {/* Progress */}
                <div className="flex-1 min-w-0 hidden sm:block">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/60 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : meta.barCls}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 shrink-0 whitespace-nowrap">
                            {shortlisted}/{suggested} shortlisted
                        </span>
                    </div>
                </div>

                {/* Count chip */}
                <span className="shrink-0 text-[10px] font-black text-slate-500 whitespace-nowrap">
                    {apps.length} applied
                </span>
                {done && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black border border-emerald-200">
                        ✓ Done
                    </span>
                )}
                {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
            </button>

            {/* Applications inside this tier */}
            {open && (
                <div className="bg-white border-t border-slate-100">
                    {apps.length === 0 ? (
                        <div className="py-8 text-center text-sm font-bold text-slate-400">
                            No applications from {meta.label.toLowerCase()} yet.
                        </div>
                    ) : (
                        <>
                            {/* Search within tier */}
                            {apps.length > 4 && (
                                <div className="p-3 border-b border-slate-100">
                                    <div className="relative max-w-xs">
                                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Filter by name or college…"
                                            className="w-full pl-8 pr-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[640px]">
                                    <thead>
                                        <tr>
                                            {['Candidate', 'College', 'CGPA', 'Status', 'Actions'].map(h => (
                                                <th key={h} className="px-5 py-2.5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map(app => (
                                            <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm font-bold text-slate-800">{app.student?.fullName}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{app.student?.branch}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-xs font-semibold text-slate-700 max-w-[180px] truncate" title={app.student?.collegeName}>
                                                        {app.student?.collegeName}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {app.student?.collegeCategory}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-sm font-black text-slate-700">
                                                        {app.student?.cgpa?.toFixed(2) ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${STATUS_COLOR[app.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                        {app.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {app.status === 'SUBMITTED' && (
                                                            <button
                                                                onClick={() => onShortlist(app, ps)}
                                                                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                                                                title={ps?.mentor ? `Shortlist — Mentor: ${ps.mentor.name || ps.mentor.email}` : 'Set PS mentor first via Committees'}
                                                            >
                                                                <Award size={13} />
                                                            </button>
                                                        )}
                                                        {app.status === 'SHORTLISTED' && (
                                                            <button
                                                                onClick={() => onAction(app.id, 'SELECTED')}
                                                                className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"
                                                                title="Select"
                                                            >
                                                                <Check size={13} />
                                                            </button>
                                                        )}
                                                        {['SUBMITTED', 'SHORTLISTED'].includes(app.status) && (
                                                            <button
                                                                onClick={() => onAction(app.id, 'REJECTED')}
                                                                className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                                                title="Reject"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => onView(app)}
                                                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                                                        >
                                                            <Eye size={11} /> View
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-sm font-bold text-slate-400">
                                                    No results match your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Problem Statement section ─────────────────────────────────────────────────
const PsSection = ({ ps, internshipTitle, preferredColleges, shortlistingRatio, onShortlist, onAction, onView }) => {
    const [open, setOpen] = useState(true);
    const ratio     = shortlistingRatio || 2;
    const suggested = Math.max(1, (ps.vacancies || 0) * ratio);

    // Bucket applications by tier
    const byTier = { PREFERRED: [], TOP: [], REGULAR: [] };
    ps.applications.forEach(app => {
        byTier[classifyApp(app, preferredColleges)].push(app);
    });

    const shortlisted = ps.applications.filter(a => a.status === 'SHORTLISTED').length;
    const tierRows = ps.applications.length > 0 ? [
        // Only show PREFERRED tier if preferred colleges are configured
        ...(preferredColleges.length > 0 ? [{ tier: 'PREFERRED', apps: byTier.PREFERRED }] : []),
        { tier: 'TOP',     apps: byTier.TOP },
        { tier: 'REGULAR', apps: byTier.REGULAR },
    ] : [];

    return (
        <div className="border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
            {/* PS header */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-5 bg-surface-container-low hover:bg-surface-container transition-colors text-left"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                        {ps.problemStatementNumber}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-primary leading-tight truncate">{ps.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-outline/50">
                                {internshipTitle} · {ps.vacancies} {ps.vacancies === 1 ? 'vacancy' : 'vacancies'}
                            </p>
                            {ps.mentor ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    ✓ Mentor: {ps.mentor.name || ps.mentor.email}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                    ⚠ No mentor set — assign via Committees
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-outline/60 uppercase tracking-wider">
                        {ps.applications.length} applied
                    </span>
                    {shortlisted > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200">
                            {shortlisted} shortlisted
                        </span>
                    )}
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-outline-variant/10">
                    {/* Shortlist guide header strip */}
                    <div className="px-5 py-2.5 bg-surface-container flex items-center gap-2 border-b border-outline-variant/10">
                        <Star size={12} className="text-amber-500 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-outline">
                            Shortlist Guide · Ratio 1:{ratio} · {ps.vacancies} {ps.vacancies === 1 ? 'vacancy' : 'vacancies'} → suggest {suggested} per tier
                        </span>
                    </div>

                    {ps.applications.length === 0 ? (
                        <div className="py-12 text-center bg-white">
                            <Users size={28} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-400">No applications yet for this problem statement.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-2 bg-white">
                            {tierRows.map(({ tier, apps }) => (
                                <TierAccordion
                                    key={tier}
                                    tier={tier}
                                    apps={apps}
                                    suggested={suggested}
                                    ps={ps}
                                    onShortlist={onShortlist}
                                    onAction={onAction}
                                    onView={onView}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main page (tabbed) ────────────────────────────────────────────────────────
const HodApplications = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('collaborative'); // 'collaborative' | 'learning'
    const [groups, setGroups]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selected, setSelected]       = useState(null);
    const [activeGroup, setActiveGroup] = useState(null);

    const fetchData = useCallback(async (background = false) => {
        if (!background) setLoading(true);
        try {
            const res  = await api.get('/admin/hod/ps-applications');
            const data = res.data.data || [];
            setGroups(data);
            if (!activeGroup && data.length > 0) setActiveGroup(data[0].id);
        } catch {
            // silent
        } finally {
            if (!background) setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (appId, newStatus) => {
        try {
            await api.put(`/admin/applications/${appId}`, { status: newStatus });
            fetchData(true);
        } catch {
            alert('Failed to update status.');
        }
    };

    // Shortlist using the PS's pre-assigned mentor — no dialog needed
    const handleShortlist = async (app, ps) => {
        if (!ps?.mentor?.id) {
            alert(`No mentor assigned for PS-${ps?.problemStatementNumber}: "${ps?.title}".\n\nPlease assign a mentor via the Committees page first.`);
            return;
        }
        try {
            await api.put(`/admin/applications/${app.id}`, {
                status: 'SHORTLISTED',
                mentorId: ps.mentor.id
            });
            fetchData(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to shortlist.');
        }
    };

    const allApps = groups.flatMap(g => g.problemStatements.flatMap(ps => ps.applications));
    const stats = {
        total:      allApps.length,
        shortlisted: allApps.filter(a => a.status === 'SHORTLISTED').length,
        selected:    allApps.filter(a => ['SELECTED', 'APPROVED'].includes(a.status)).length,
        rejected:    allApps.filter(a => a.status === 'REJECTED').length,
    };

    const currentGroup       = groups.find(g => g.id === activeGroup);
    const preferredColleges  = Array.isArray(currentGroup?.internship?.preferredColleges)
        ? currentGroup.internship.preferredColleges
        : [];
    const shortlistingRatio  = currentGroup?.internship?.shortlistingRatio || 2;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">Recruitment Oversight</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Applications</h2>
                </div>
                {/* Tab switcher */}
                <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-outline-variant/10 w-fit">
                    <button
                        onClick={() => setActiveTab('collaborative')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'collaborative' ? 'bg-primary text-white shadow-sm' : 'text-outline hover:text-primary'}`}
                    >
                        <ClipboardList size={13} /> Collaborative
                    </button>
                    <button
                        onClick={() => setActiveTab('learning')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'learning' ? 'bg-emerald-600 text-white shadow-sm' : 'text-outline hover:text-emerald-600'}`}
                    >
                        <BookOpen size={13} /> Learning
                    </button>
                </div>
            </div>

            {/* Learning Internships tab */}
            {activeTab === 'learning' && <LearningTab />}

            {/* Collaborative tab content below (KPI strip etc.) */}
            {activeTab === 'collaborative' && <>

            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Applied',  value: stats.total,       icon: <Users size={18} className="text-primary" />,          color: 'border-primary/20 bg-primary/5' },
                    { label: 'Shortlisted',    value: stats.shortlisted,  icon: <Award size={18} className="text-blue-500" />,          color: 'border-blue-200 bg-blue-50/50' },
                    { label: 'Selected',       value: stats.selected,     icon: <CheckCircle size={18} className="text-emerald-500" />, color: 'border-emerald-200 bg-emerald-50/50' },
                    { label: 'Rejected',       value: stats.rejected,     icon: <XCircle size={18} className="text-red-500" />,         color: 'border-red-200 bg-red-50/50' },
                ].map((kpi, i) => (
                    <div key={i} className={`rounded-2xl border p-5 flex flex-col gap-2 ${kpi.color}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{kpi.label}</span>
                            {kpi.icon}
                        </div>
                        <span className="text-3xl font-black text-slate-800">{kpi.value}</span>
                    </div>
                ))}
            </div>

            {groups.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-outline-variant/30 rounded-3xl bg-surface-container-low">
                    <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">
                        No collaborative problem statements for your department yet.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: internship selector */}
                    <div className="lg:w-64 shrink-0 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-3">Internship Programs</p>
                        {groups.map(g => {
                            const appsCount = g.problemStatements.reduce((s, ps) => s + ps.applications.length, 0);
                            const isActive  = g.id === activeGroup;
                            const ratio     = g.internship?.shortlistingRatio || 2;
                            return (
                                <button
                                    key={g.id}
                                    onClick={() => setActiveGroup(g.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${isActive
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-outline-variant/10 bg-surface-container-low hover:border-primary/30'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase size={13} className={isActive ? 'text-primary' : 'text-slate-400'} />
                                        <p className={`text-xs font-black truncate ${isActive ? 'text-primary' : 'text-slate-700'}`}>
                                            {g.internship?.title}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 flex-wrap mt-1">
                                        <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                                            {g.problemStatements.length} PS · {appsCount} apps
                                        </span>
                                        <span className="text-[9px] font-black text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                                            1:{ratio} ratio
                                        </span>
                                    </div>
                                    {g.internship?.publishStatus === 'LIVE'
                                        ? <span className="mt-1.5 inline-block text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">LIVE</span>
                                        : <span className="mt-1.5 inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                            <Clock size={9} /> Pending
                                          </span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: PS list */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Ratio + preferred colleges info */}
                        {currentGroup && (
                            <div className="flex flex-wrap items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/10">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-wider">
                                    <Star size={12} className="text-amber-500 shrink-0" />
                                    Shortlisting ratio:
                                    <span className="font-black text-primary">1 : {shortlistingRatio}</span>
                                </div>
                                <span className="text-outline/30">·</span>
                                {preferredColleges.length > 0 ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                            Preferred:
                                        </span>
                                        {preferredColleges.map((pc, i) => (
                                            <span key={i} className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                {pc}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-outline/40 uppercase tracking-wider italic">
                                        No preferred colleges set — showing Top Univ. + Regular tiers only
                                    </span>
                                )}
                            </div>
                        )}

                        {currentGroup?.problemStatements.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-outline-variant/30 rounded-2xl">
                                <ClipboardList size={32} className="text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-400">
                                    No problem statements submitted for this internship yet.
                                </p>
                            </div>
                        ) : (
                            currentGroup?.problemStatements.map(ps => (
                                <PsSection
                                    key={ps.id}
                                    ps={ps}
                                    internshipTitle={currentGroup.internship?.title}
                                    preferredColleges={preferredColleges}
                                    shortlistingRatio={shortlistingRatio}
                                    onShortlist={handleShortlist}
                                    onAction={handleAction}
                                    onView={setSelected}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {selected && (
                <ApplicationProfileModal
                    application={selected}
                    internship={selected.internship ?? currentGroup?.internship}
                    allApplications={allApps}
                    onClose={() => setSelected(null)}
                    updateStatus={async (newStatus, extra) => {
                        try {
                            await api.put(`/admin/applications/${selected.id}`, { status: newStatus, ...extra });
                            fetchData(true);
                            setSelected(null);
                        } catch {
                            alert('Failed to update status.');
                        }
                    }}
                />
            )}
            </> /* end collaborative tab */}
        </div>
    );
};

export default HodApplications;
