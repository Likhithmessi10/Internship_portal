import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { MONETARY_ENABLED } from '../../../config/features';
import ApplicationProfileModal from '../ApplicationProfileModal';
import {
    Search, ChevronDown, ChevronUp, Users, CheckCircle,
    XCircle, Check, X, Eye, BookOpen, MapPin, Settings
} from 'lucide-react';

// location can be a string (legacy) or {name, vacancies} object
const locName = (l) => typeof l === 'string' ? l : (l?.name || '');

// Must match SEAT_CONSUMING in applicationWorkflowService.js so frontend counts = backend enforcement
const ALLOCATED_STATUSES = ['SELECTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'HIRED', 'ONGOING', 'COMPLETED'];

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
    const [hireTarget, setHireTarget] = useState(null);

    const fetchApps = useCallback(async (bg = false) => {
        if (!bg) setLoading(true);
        try {
            const res = await api.get('/admin/hod/learning-applications');
            setApps(res.data.data || []);
        } catch { /* silent */ }
        finally { if (!bg) setLoading(false); }
    }, []);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const handleAction = async (appId, newStatus, isHeldSeat = false, extra = {}) => {
        try {
            await api.put(`/admin/applications/${appId}`, {
                status: newStatus,
                ...(isHeldSeat ? { isHeldSeat: true } : {}),
                ...extra
            });
            fetchApps(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const handleDocAction = async (appId, type) => {
        try {
            if (type === 'request') {
                await api.post(`/admin/applications/${appId}/request-documents`);
            } else {
                await api.post(`/admin/applications/${appId}/verify-documents`, { action: 'approve' });
            }
            fetchApps(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
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
        if (!grouped[intId]) grouped[intId] = { title: intTitle, internshipId: app.internship?.id, fields: {} };
        const fieldKey   = app.field?.id || app.fieldId || 'no-field';
        const fieldLabel = app.field?.fieldName || 'General';
        if (!grouped[intId].fields[fieldKey]) {
            grouped[intId].fields[fieldKey] = {
                label:             fieldLabel,
                locations:         app.field?.locations || [],
                vacancies:         app.field?.vacancies || 0,
                heldSeats:         app.field?.heldSeats ?? 0,
                fieldId:           app.field?.id || app.fieldId,
                internshipId:      app.internship?.id,
                departmentGroupId: app.departmentGroupId,
                apps: []
            };
        }
        grouped[intId].fields[fieldKey].apps.push(app);
    });

    const internships = Object.entries(grouped);

    // Build allFields lookup per internship, including per-location allocated counts
    const allFieldsByInt = {};
    internships.forEach(([id, data]) => {
        allFieldsByInt[id] = Object.entries(data.fields).map(([fKey, fData]) => {
            const locationAllocated = {};
            fData.apps.forEach(app => {
                if (ALLOCATED_STATUSES.includes(app.status) && app.preferredLocation) {
                    locationAllocated[app.preferredLocation] = (locationAllocated[app.preferredLocation] || 0) + 1;
                }
            });
            return {
                id:                fKey,
                label:             fData.label,
                locations:         fData.locations || [],
                vacancies:         fData.vacancies,
                locationAllocated,
            };
        });
    });
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
                    { label: 'Total Applied', value: totalApps, color: 'border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10', icon: <Users size={16} className="text-primary" /> },
                    { label: 'Selected / Hired', value: selectionCount, color: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/20', icon: <CheckCircle size={16} className="text-emerald-500" /> },
                    { label: 'Rejected',      value: rejected,  color: 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-900/20', icon: <XCircle size={16} className="text-red-500" /> },
                ].map((k, i) => (
                    <div key={i} className={`rounded-2xl border p-4 flex items-center gap-3 ${k.color}`}>
                        {k.icon}
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{k.value}</p>
                            <p className="text-[10px] font-bold text-outline dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, college or field…"
                    className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            {filtered.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-outline-variant/30 dark:border-slate-700 rounded-2xl">
                    <BookOpen size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 dark:text-slate-500 uppercase text-sm tracking-widest">No Learning Internship applications yet.</p>
                </div>
            ) : filtered.map(({ id, title, fields }) => (
                <div key={id} className="border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
                    {/* Internship header */}
                    <div className="px-5 py-3 bg-surface-container flex items-center gap-3 border-b border-outline-variant/10">
                        <BookOpen size={15} className="text-emerald-600 shrink-0" />
                        <span className="text-sm font-black text-primary">{title}</span>
                        <span className="ml-auto text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Learning Internship
                        </span>
                    </div>

                    {/* Fields */}
                    <div className="divide-y divide-outline-variant/10 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {fields.map(([fieldKey, fieldData]) => (
                            <FieldSection
                                key={fieldKey}
                                fieldData={fieldData}
                                allFields={allFieldsByInt[id] || []}
                                searchQ={q}
                                onAction={handleAction}
                                onDocAction={handleDocAction}
                                onHireOpen={setHireTarget}
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
            {hireTarget && (
                <BulkHireModal
                    apps={hireTarget}
                    onClose={() => setHireTarget(null)}
                    onHired={() => fetchApps(true)}
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

// ── Held-seats configuration popover ─────────────────────────────────────────
const HeldSeatsConfig = ({ fieldData, onSaved }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal]         = useState(fieldData.heldSeats ?? 0);
    const [saving, setSaving]   = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await api.patch(
                `/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/fields/${fieldData.fieldId}/held-seats`,
                { heldSeats: val }
            );
            onSaved(val);
            setEditing(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    if (!editing) return (
        <button onClick={e => { e.stopPropagation(); setEditing(true); }}
            title="Configure reserved (hold) seats"
            className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border transition-colors ${
                (fieldData.heldSeats ?? 0) > 0
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
            }`}>
            🔒 {fieldData.heldSeats ?? 0} held
        </button>
    );

    return (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">Hold seats:</span>
            <input type="number" min={0} max={fieldData.vacancies}
                value={val} onChange={e => setVal(parseInt(e.target.value) || 0)}
                className="w-14 text-xs font-bold border border-amber-300 dark:border-amber-700 rounded px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none" />
            <button onClick={save} disabled={saving}
                className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500 text-white rounded-full disabled:opacity-50">
                {saving ? '…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)}
                className="text-[9px] text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
    );
};

// ── Bulk hire modal ───────────────────────────────────────────────────────────
const BulkHireModal = ({ apps, onClose, onHired }) => {
    const [joiningDate, setJoiningDate] = useState('');
    const [endDate, setEndDate]         = useState('');
    const [saving, setSaving]           = useState(false);
    const [results, setResults]         = useState(null); // { ok: [], fail: [] }

    const confirm = async () => {
        if (!joiningDate || !endDate) { alert('Set both joining and end dates'); return; }
        setSaving(true);
        const ok = [], fail = [];
        // Sequential — each hire commits before the next so roll number counters don't collide
        for (const app of apps) {
            try {
                await api.put(`/admin/applications/${app.id}`, {
                    status: 'HIRED',
                    joiningDate,
                    endDate,
                    assignedRole: app.field?.fieldName || app.assignedRole
                });
                ok.push(app.student?.fullName);
            } catch (err) {
                fail.push({ name: app.student?.fullName, reason: err.response?.data?.message || 'Failed' });
            }
        }
        setSaving(false);
        setResults({ ok, fail });
        if (ok.length > 0) onHired();
    };

    if (results) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <p className="text-base font-black text-slate-800 dark:text-slate-100">Hiring Complete</p>
                {results.ok.length > 0 && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-emerald-700 mb-1">✓ Hired ({results.ok.length})</p>
                        {results.ok.map(n => <p key={n} className="text-xs text-emerald-800">{n}</p>)}
                    </div>
                )}
                {results.fail.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-red-600 mb-1">Failed ({results.fail.length})</p>
                        {results.fail.map(f => <p key={f.name} className="text-xs text-red-700">{f.name} — {f.reason}</p>)}
                    </div>
                )}
                <button onClick={onClose} className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest">Close</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-1">Bulk Hire</p>
                    <p className="text-base font-black text-slate-800 dark:text-slate-100">{apps.length} candidate{apps.length !== 1 ? 's' : ''} ready to hire</p>
                    <p className="text-xs text-slate-400 mt-0.5">Set joining and end dates — they apply to all candidates below.</p>
                </div>

                {/* Candidate list */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {apps.map(app => (
                        <div key={app.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{app.student?.fullName}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{app.preferredLocation || app.field?.fieldName || '—'}</p>
                            </div>
                            {app.prtiNote && (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={app.prtiNote}>
                                    📝 Note
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Universal dates */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-outline dark:text-slate-400 block mb-1">Joining Date</label>
                        <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)}
                            className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-outline dark:text-slate-400 block mb-1">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={confirm} disabled={saving}
                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        {saving ? `Hiring ${apps.length}…` : `🎓 Hire All (${apps.length})`}
                    </button>
                    <button onClick={onClose} className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-xs hover:text-slate-700 transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
};


// ── Selection panel — assign field + location before confirming selection ─────
const SelectionPanel = ({ app, allFields, onConfirm, onCancel, isHold }) => {
    const originalField = allFields.find(f => f.id === (app.field?.id || app.fieldId)) || allFields[0];
    const [pickedField, setPickedField]       = useState(originalField?.id || '');
    const [pickedLocation, setPickedLocation] = useState(app.preferredLocation || '');

    const fieldObj       = allFields.find(f => f.id === pickedField) || originalField;
    const locations      = fieldObj?.locations || [];
    const fieldAllocated = fieldObj?.locationAllocated || {};

    const handleFieldChange = (fId) => {
        setPickedField(fId);
        const locs = allFields.find(f => f.id === fId)?.locations || [];
        const appliedMatch = locs.some(l => locName(l) === app.preferredLocation);
        setPickedLocation(appliedMatch ? app.preferredLocation : locName(locs[0] || ''));
    };

    const fieldChanged    = pickedField !== (originalField?.id || '');
    const locationChanged = pickedLocation !== (app.preferredLocation || '');
    const changed         = fieldChanged || locationChanged;

    return (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-700 rounded-xl space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    {isHold ? '🔒 Hold Seat — ' : '✓ Select — '}{app.student?.fullName}
                </p>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕ Cancel</button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Applied for: <strong>{app.field?.fieldName || '—'}</strong> · {app.preferredLocation || '—'}
            </p>

            <div className="grid grid-cols-2 gap-3">
                {/* Field */}
                <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">Assign Field</label>
                    <select value={pickedField} onChange={e => handleFieldChange(e.target.value)}
                        className="w-full text-xs font-bold border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                        {allFields.map(f => (
                            <option key={f.id} value={f.id}>{f.label}{f.id === originalField?.id ? ' (Applied)' : ''}</option>
                        ))}
                    </select>
                </div>

                {/* Location */}
                {locations.length > 0 && (
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">Assign Location</label>
                        <select value={pickedLocation} onChange={e => setPickedLocation(e.target.value)}
                            className="w-full text-xs font-bold border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                            {locations.map(l => {
                                const name      = locName(l);
                                const total     = typeof l === 'object' && l.vacancies != null ? l.vacancies : null;
                                const allocated = (fieldAllocated[name] || 0);
                                const remaining = total != null ? Math.max(0, total - allocated) : null;
                                const full      = remaining !== null && remaining === 0;
                                const label     = remaining !== null
                                    ? `${name} (${remaining}/${total} remaining)${name === app.preferredLocation ? ' ★' : ''}${full ? ' — FULL' : ''}`
                                    : `${name}${name === app.preferredLocation ? ' ★' : ''}`;
                                return <option key={name} value={name} disabled={full}>{label}</option>;
                            })}
                        </select>
                    </div>
                )}
            </div>

            {changed && (
                <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2 py-1 rounded">
                    ↳ Assigning to different {fieldChanged && locationChanged ? 'field and location' : fieldChanged ? 'field' : 'location'} than applied
                </p>
            )}

            <button
                onClick={() => onConfirm({ fieldId: pickedField, preferredLocation: pickedLocation })}
                className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-700 transition-colors">
                {isHold ? '🔒 Confirm Hold' : '✓ Confirm Selection'}
            </button>
        </div>
    );
};

// ── Candidate row (shared across phase tabs) ─────────────────────────────────
const CandidateRow = ({ app, phase, heldSeats, heldUsed, onAction, onDocAction, onHireOpen, onView, department, onRefresh, onSelectOpen }) => (  // eslint-disable-line no-unused-vars
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
        <td className="px-5 py-3.5">
            <button onClick={() => onView(app)} className="text-left hover:underline">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{app.student?.fullName}</p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase mt-0.5">{app.student?.branch}</p>
            </button>
        </td>
        <td className="px-5 py-3.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{app.student?.collegeName}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">{app.student?.collegeCategory}</p>
        </td>
        <td className="px-5 py-3.5">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{app.student?.cgpa?.toFixed(2) ?? '—'}</span>
        </td>
        <td className="px-5 py-3.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{app.preferredLocation || '—'}</span>
        </td>
        <td className="px-5 py-3.5">
            <div className="flex flex-col gap-1">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${STATUS_COLOR[app.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {app.status.replace(/_/g, ' ')}
                </span>
                {app.isHeldSeat && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 w-fit">🔒 Hold</span>}
                {app.prtiNote && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-violet-50 text-violet-600 border border-violet-200 w-fit cursor-help" title={`PRTI: ${app.prtiNote}`}>💬 PRTI</span>}
            </div>
        </td>
        {phase === 'hired' && (
            <td className="px-5 py-3.5">
                <AssignMentorCell app={app} department={department} onAssigned={onRefresh} />
            </td>
        )}
        <td className="px-5 py-3.5">
            <div className="flex items-center gap-1.5">
                {/* Applications phase — open selection panel with field/location assignment */}
                {phase === 'applications' && ['SUBMITTED', 'SHORTLISTED'].includes(app.status) && (<>
                    <button onClick={() => onSelectOpen(app, false)}
                        className="px-2.5 h-7 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200">
                        <Check size={12} /> Select
                    </button>
                    {heldSeats > 0 && heldUsed < heldSeats && (
                        <button onClick={() => onSelectOpen(app, true)}
                            className="px-2 h-7 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-black uppercase flex items-center gap-1 hover:bg-amber-500 hover:text-white transition-colors border border-amber-200">
                            🔒 Hold
                        </button>
                    )}
                    <button onClick={() => onAction(app.id, 'REJECTED')}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors" title="Reject">
                        <X size={13} />
                    </button>
                </>)}

                {/* Documents phase actions */}
                {phase === 'docs' && (<>
                    {app.status === 'SELECTED' && !app.prtiApproved && (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                            ⏳ Awaiting PRTI
                        </span>
                    )}
                    {(app.status === 'SELECTED' || app.status === 'DOCUMENTS_PENDING') && (
                        <button onClick={() => onAction(app.id, 'REJECTED')}
                            className="px-2.5 h-7 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase flex items-center gap-1 hover:bg-red-600 hover:text-white transition-colors border border-red-200" title="Remove & free this slot">
                            <X size={12} /> Remove
                        </button>
                    )}
                    {app.status === 'DOCUMENTS_PENDING' && (
                        <button onClick={() => onDocAction(app.id, 'verify')}
                            className="px-2.5 h-7 rounded-lg bg-teal-50 text-teal-700 text-[9px] font-black uppercase flex items-center gap-1 hover:bg-teal-600 hover:text-white transition-colors border border-teal-200">
                            ✓ Verify Docs
                        </button>
                    )}
                    {app.status === 'DOCUMENTS_VERIFIED' && (
                        <button onClick={() => onHireOpen([app])}
                            className="px-2.5 h-7 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200">
                            🎓 Hire
                        </button>
                    )}
                </>)}

                <button onClick={() => onView(app)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="View profile">
                    <Eye size={13} />
                </button>
            </div>
        </td>
    </tr>
);

// ── Phase table wrapper ───────────────────────────────────────────────────────
const PhaseTable = ({ apps, phase, heldSeats, heldUsed, onAction, onDocAction, onHireOpen, onView, department, onRefresh, onSelectOpen }) => {
    const headers = phase === 'hired'
        ? ['Candidate', 'College', 'CGPA', 'Location', 'Status', 'Mentor', 'Actions']
        : ['Candidate', 'College', 'CGPA', 'Location', 'Status', 'Actions'];
    if (apps.length === 0) return (
        <div className="py-10 text-center text-sm font-bold text-slate-400 dark:text-slate-500">
            {phase === 'applications' ? 'No pending applications.' :
             phase === 'selected'     ? 'No selected candidates yet. Select from Applications tab.' :
             phase === 'docs'         ? 'No candidates in document stage yet.' :
                                       'No hired interns yet.'}
        </div>
    );
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                        {headers.map(h => (
                            <th key={h} className="px-5 py-2.5 text-[10px] font-black text-outline dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {apps.map(app => (
                        <CandidateRow key={app.id} app={app} phase={phase}
                            heldSeats={heldSeats} heldUsed={heldUsed}
                            onAction={onAction} onDocAction={onDocAction} onHireOpen={onHireOpen}
                            onView={onView} department={department} onRefresh={onRefresh}
                            onSelectOpen={onSelectOpen} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ── Required docs config per dept group ──────────────────────────────────────
const RequiredDocsConfig = ({ fieldData, onSaved }) => {
    const [open, setOpen]     = useState(false);
    const [docs, setDocs]     = useState([]);
    const [newDoc, setNewDoc] = useState('');
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const res = await api.get(`/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/details`);
            setDocs(res.data.data?.requiredDocuments || []);
        } catch { setDocs([]); }
        setOpen(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/required-docs`, { requiredDocuments: docs });
            onSaved?.(docs);
            setOpen(false);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    if (!open) return (
        <button onClick={load} title="Configure required documents"
            className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            <Settings size={10} /> Docs ({docs.length || '?'})
        </button>
    );

    return (
        <div className="flex flex-col gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl min-w-[240px]" onClick={e => e.stopPropagation()}>
            <p className="text-[9px] font-black uppercase text-indigo-700 dark:text-indigo-400">Required Documents after Selection</p>
            <div className="flex gap-1.5">
                <input value={newDoc} onChange={e => setNewDoc(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newDoc.trim()) { setDocs(d => [...d, newDoc.trim()]); setNewDoc(''); } }}
                    placeholder="Add document name…"
                    className="flex-1 text-xs border border-indigo-200 dark:border-indigo-600 rounded px-2 py-1 bg-white dark:bg-slate-800 focus:outline-none" />
                <button onClick={() => { if (newDoc.trim()) { setDocs(d => [...d, newDoc.trim()]); setNewDoc(''); } }}
                    className="px-2 bg-indigo-600 text-white rounded text-[9px] font-black">+</button>
            </div>
            {docs.map((doc, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs font-medium text-indigo-800 dark:text-indigo-300">
                    <span>• {doc}</span>
                    <button onClick={() => setDocs(d => d.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">×</button>
                </div>
            ))}
            <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded text-[9px] font-black uppercase disabled:opacity-50">{saving ? '…' : 'Save'}</button>
                <button onClick={() => setOpen(false)} className="text-[9px] text-slate-400 font-bold">Cancel</button>
            </div>
        </div>
    );
};

// ── Field section — simplified workflow ───────────────────────────────────────
const FieldSection = ({ fieldData, allFields, searchQ, onAction, onDocAction, onHireOpen, onView, department, onRefresh }) => {
    const [open, setOpen]               = useState(true);
    const [heldSeats, setHeldSeats]     = useState(fieldData.heldSeats ?? 0);
    const [bulkSending, setBulkSending] = useState(false);
    const [locFilter, setLocFilter]     = useState('ALL');
    const [selectionTarget, setSelectionTarget] = useState(null); // { app, isHold }

    const allApps = [...fieldData.apps].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Unique location names that have at least one application
    const availableLocations = [...new Set(allApps.map(a => a.preferredLocation).filter(Boolean))];

    const byStatus = (statuses) => allApps.filter(a => statuses.includes(a.status)).filter(app => {
        const textOk = !searchQ || app.student?.fullName?.toLowerCase().includes(searchQ) ||
               app.student?.collegeName?.toLowerCase().includes(searchQ);
        const locOk  = locFilter === 'ALL' || app.preferredLocation === locFilter;
        return textOk && locOk;
    });

    const pendingApps   = byStatus(['SUBMITTED', 'SHORTLISTED']); // SHORTLISTED = legacy
    const selectedApps  = byStatus(['SELECTED']);
    const docsPending   = byStatus(['DOCUMENTS_PENDING']);
    const docsVerified  = byStatus(['DOCUMENTS_VERIFIED']);
    const hiredApps     = byStatus(['HIRED', 'ONGOING', 'COMPLETED']);
    const docsPhaseApps = [...selectedApps, ...docsPending, ...docsVerified];

    const vacancies     = fieldData.vacancies;
    // Count all apps holding a seat (matches backend SEAT_CONSUMING exactly)
    const selectedCount = allApps.filter(a => ALLOCATED_STATUSES.includes(a.status)).length;
    const hiredCount    = allApps.filter(a => ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length;
    const heldUsed      = allApps.filter(a => a.isHeldSeat && ALLOCATED_STATUSES.includes(a.status)).length;

    // Per-location remaining — enforce the per-location cap shown to HOD
    const locationVacancyMap = {};   // { locName: vacancies }
    const locationFilledMap  = {};   // { locName: filled count }
    fieldData.locations.forEach(l => {
        const name = locName(l);
        if (typeof l === 'object' && l.vacancies > 0) locationVacancyMap[name] = l.vacancies;
    });
    allApps.forEach(a => {
        if (ALLOCATED_STATUSES.includes(a.status) && a.preferredLocation)
            locationFilledMap[a.preferredLocation] = (locationFilledMap[a.preferredLocation] || 0) + 1;
    });

    // Selection is full when all location slots are taken (or total vacancies if no per-location config)
    const locFull = (loc) => locationVacancyMap[loc] != null && (locationFilledMap[loc] || 0) >= locationVacancyMap[loc];
    const currentLocFull = locFilter !== 'ALL' ? locFull(locFilter) : selectedCount >= vacancies;
    const selectionFull  = selectedCount >= vacancies || (locFilter !== 'ALL' && currentLocFull);

    const autoTab = () => {
        if (docsVerified.length > 0 || docsPending.length > 0) return 'docs';
        if (selectedApps.length > 0) return 'docs';
        if (hiredApps.length > 0) return 'hired';
        return 'applications';
    };
    const [activeTab, setActiveTab] = useState(autoTab);

    const TABS = [
        { key: 'applications', label: 'Applications', count: pendingApps.length,   extra: `${allApps.length} total` },
        { key: 'selected',     label: 'Selected',     count: selectedCount,         extra: `${selectedCount}/${vacancies} seats` },
        { key: 'docs',         label: 'Documents',    count: docsPhaseApps.length,  extra: docsPending.length ? `${docsPending.length} awaiting` : null },
        { key: 'hired',        label: 'Hired',        count: hiredCount,            extra: null },
    ];

    const handleBulkRequestDocs = async () => {
        const approvedApps = selectedApps.filter(a => a.prtiApproved);
        if (approvedApps.length === 0) return;
        setBulkSending(true);
        let ok = 0;
        for (const app of approvedApps) {
            try { await onDocAction(app.id, 'request'); ok++; } catch { /* silent */ }
        }
        setBulkSending(false);
        onRefresh();
        if (ok > 0) alert(`Document request sent to ${ok} PRTI-approved candidate(s).`);
    };

    return (
        <div>
            {/* Field header */}
            <div className="flex items-center w-full">
                <button type="button" onClick={() => setOpen(v => !v)}
                    className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{fieldData.label}</span>
                    {fieldData.locations?.length > 0 && (() => {
                        const allocated = {};
                        allApps.forEach(app => {
                            if (ALLOCATED_STATUSES.includes(app.status) && app.preferredLocation)
                                allocated[app.preferredLocation] = (allocated[app.preferredLocation] || 0) + 1;
                        });
                        return (
                            <span className="flex items-center gap-1 flex-wrap">
                                {fieldData.locations.map(l => {
                                    const name  = locName(l);
                                    const total = typeof l === 'object' && l.vacancies != null ? l.vacancies : null;
                                    const used  = allocated[name] || 0;
                                    const rem   = total != null ? Math.max(0, total - used) : null;
                                    return (
                                        <span key={name} className={`flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${rem === 0 ? 'bg-red-50 text-red-500 border-red-200' : rem != null && rem <= 3 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                            <MapPin size={9} /> {name}{rem != null ? ` ${rem}/${total}` : ''}
                                        </span>
                                    );
                                })}
                            </span>
                        );
                    })()}
                    <span className="ml-auto text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        {hiredCount}/{vacancies} hired · {allApps.length} applied
                    </span>
                    {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                </button>
                <div className="px-2 flex items-center gap-2 shrink-0">
                    <RequiredDocsConfig fieldData={fieldData} />
                    <HeldSeatsConfig fieldData={{ ...fieldData, heldSeats }} onSaved={setHeldSeats} />
                </div>
            </div>

            {open && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                    {/* Tabs */}
                    <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px
                                    ${activeTab === tab.key
                                        ? 'border-primary text-primary bg-white dark:bg-slate-900'
                                        : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                    {tab.count}
                                </span>
                                {tab.extra && <span className="hidden lg:block text-[9px] font-medium text-slate-400 normal-case">{tab.extra}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Location filter */}
                    {availableLocations.length > 1 && (
                        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex-wrap">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Location:</span>
                            <button onClick={() => setLocFilter('ALL')}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-colors ${locFilter === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'}`}>
                                All ({allApps.length})
                            </button>
                            {availableLocations.map(loc => {
                                const totalAppsForLoc = allApps.filter(a => a.preferredLocation === loc).length;
                                const filled  = locationFilledMap[loc] || 0;
                                const cap     = locationVacancyMap[loc];
                                const isFull  = cap != null && filled >= cap;
                                const label   = cap != null ? `${loc} · ${filled}/${cap}` : `${loc} (${totalAppsForLoc})`;
                                return (
                                    <button key={loc} onClick={() => setLocFilter(loc)}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition-colors ${
                                            locFilter === loc
                                                ? 'bg-primary text-white border-primary'
                                                : isFull
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40'
                                        }`}>
                                        <MapPin size={9} /> {label}{isFull ? ' ✓' : ''}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Phase banner */}
                    <div className="px-5 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                        {activeTab === 'applications' && (
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    {locFilter !== 'ALL' && locationVacancyMap[locFilter] != null ? (() => {
                                        const locVac    = locationVacancyMap[locFilter];
                                        const locFilled = locationFilledMap[locFilter] || 0;
                                        const pct       = locVac > 0 ? Math.min(100, (locFilled / locVac) * 100) : 0;
                                        const full      = locFilled >= locVac;
                                        return (
                                            <>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                    <span>{locFilter} — location progress</span>
                                                    <span className={full ? 'text-red-600 font-black' : ''}>{locFilled} / {locVac} seats {full ? '— FULL' : 'filled'}</span>
                                                </div>
                                                <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${full ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${pct}%` }} />
                                                </div>
                                            </>
                                        );
                                    })() : (
                                        <>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                <span>Total selection progress</span>
                                                <span className={selectedCount > vacancies ? 'text-red-600 font-black' : ''}>{selectedCount} / {vacancies} seats filled</span>
                                            </div>
                                            <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${selectionFull ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${vacancies > 0 ? Math.min(100, (selectedCount / vacancies) * 100) : 0}%` }} />
                                            </div>
                                        </>
                                    )}
                                </div>
                                {selectionFull && (
                                    <button onClick={() => setActiveTab('docs')}
                                        className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-700 whitespace-nowrap">
                                        Proceed to Documents →
                                    </button>
                                )}
                            </div>
                        )}
                        {activeTab === 'docs' && (() => {
                            const approvedSelected   = selectedApps.filter(a => a.prtiApproved);
                            const unapprovedSelected = selectedApps.filter(a => !a.prtiApproved);
                            return (
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex-1 space-y-0.5">
                                        {unapprovedSelected.length > 0 && (
                                            <p className="text-[10px] font-bold text-amber-600">
                                                ⏳ {unapprovedSelected.length} selection(s) awaiting PRTI approval before docs can be requested
                                            </p>
                                        )}
                                        <p className="text-[10px] font-bold text-slate-500">
                                            {approvedSelected.length > 0 ? `${approvedSelected.length} PRTI-approved · ` : ''}
                                            {docsPending.length} pending upload · {docsVerified.length} verified
                                        </p>
                                    </div>
                                    {approvedSelected.length > 0 && (
                                        <button onClick={handleBulkRequestDocs} disabled={bulkSending}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm whitespace-nowrap">
                                            {bulkSending ? '⏳ Sending…' : `📄 Request Docs (${approvedSelected.length} approved)`}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                        {activeTab === 'selected' && (
                            <p className="text-[10px] font-bold text-slate-500">{selectedCount} / {vacancies} seats filled. PRTI will review these selections before documents are requested.</p>
                        )}
                        {activeTab === 'hired' && (
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-bold text-slate-500">{hiredCount} intern{hiredCount !== 1 ? 's' : ''} hired out of {vacancies} vacancies.</p>
                                {docsVerified.length > 0 && (
                                    <button onClick={() => onHireOpen(docsVerified)}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-700 shadow-sm whitespace-nowrap">
                                        🎓 Hire All Verified ({docsVerified.length})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Inline selection panel — shown when HOD clicks Select on a candidate */}
                    {selectionTarget && (
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                            <SelectionPanel
                                app={selectionTarget.app}
                                allFields={allFields}
                                locationAllocated={locationFilledMap}
                                isHold={selectionTarget.isHold}
                                onConfirm={({ fieldId, preferredLocation }) => {
                                    onAction(
                                        selectionTarget.app.id,
                                        'SELECTED',
                                        selectionTarget.isHold,
                                        { fieldId, preferredLocation }
                                    );
                                    setSelectionTarget(null);
                                }}
                                onCancel={() => setSelectionTarget(null)}
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-900">
                        {activeTab === 'applications' && (
                            <PhaseTable apps={pendingApps} phase="applications"
                                heldSeats={heldSeats} heldUsed={heldUsed}
                                onAction={onAction} onDocAction={onDocAction} onHireOpen={onHireOpen}
                                onView={onView} department={department} onRefresh={onRefresh}
                                onSelectOpen={(app, isHold) => setSelectionTarget({ app, isHold })} />
                        )}
                        {activeTab === 'selected' && (
                            <PhaseTable apps={[...selectedApps, ...docsPending, ...docsVerified, ...hiredApps]} phase="docs"
                                heldSeats={heldSeats} heldUsed={heldUsed}
                                onAction={onAction} onDocAction={onDocAction} onHireOpen={onHireOpen}
                                onView={onView} department={department} onRefresh={onRefresh} />
                        )}
                        {activeTab === 'docs' && (
                            <PhaseTable apps={docsPhaseApps} phase="docs"
                                heldSeats={heldSeats} heldUsed={heldUsed}
                                onAction={onAction} onDocAction={onDocAction} onHireOpen={onHireOpen}
                                onView={onView} department={department} onRefresh={onRefresh} />
                        )}
                        {activeTab === 'hired' && (
                            <PhaseTable apps={hiredApps} phase="hired"
                                heldSeats={heldSeats} heldUsed={heldUsed}
                                onAction={onAction} onDocAction={onDocAction} onHireOpen={onHireOpen}
                                onView={onView} department={department} onRefresh={onRefresh} />
                        )}
                    </div>
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
    const [activeTab, setActiveTab] = useState(MONETARY_ENABLED ? null : 'learning');
    const [groups, setGroups]           = useState([]);
    const [learningCount, setLearningCount] = useState(0);
    const [loading, setLoading]         = useState(true);
    const [selected, setSelected]       = useState(null);
    const [activeGroup, setActiveGroup] = useState(null);

    const fetchData = useCallback(async (background = false) => {
        if (!background) setLoading(true);
        try {
            const requests = [api.get('/admin/hod/learning-applications')];
            if (MONETARY_ENABLED) requests.unshift(api.get('/admin/hod/ps-applications'));

            const results = await Promise.all(requests);
            const learningData = results[MONETARY_ENABLED ? 1 : 0].data.data || [];

            if (MONETARY_ENABLED) {
                const collabData = results[0].data.data || [];
                setGroups(collabData);
                if (!activeGroup && collabData.length > 0) setActiveGroup(collabData[0].id);
                if (activeTab === null) {
                    const hasCollab   = collabData.some(g => g.problemStatements.some(ps => ps.applications.length > 0));
                    const hasLearning = learningData.length > 0;
                    setActiveTab(hasLearning && !hasCollab ? 'learning' : 'collaborative');
                }
            }

            setLearningCount(learningData.length);
        } catch {
            if (activeTab === null) setActiveTab('collaborative');
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

    if (loading || activeTab === null) return (
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
                {/* Tab switcher — hidden when monetary workflow is disabled */}
                {MONETARY_ENABLED && (
                <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-outline-variant/10 w-fit">
                    <button
                        onClick={() => setActiveTab('collaborative')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'collaborative' ? 'bg-primary text-white shadow-sm' : 'text-outline hover:text-primary'}`}
                    >
                        <ClipboardList size={13} /> Collaborative
                        {groups.reduce((s, g) => s + g.problemStatements.reduce((ps, p) => ps + p.applications.length, 0), 0) > 0 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'collaborative' ? 'bg-white/30 text-white' : 'bg-primary/10 text-primary'}`}>
                                {groups.reduce((s, g) => s + g.problemStatements.reduce((ps, p) => ps + p.applications.length, 0), 0)}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('learning')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'learning' ? 'bg-emerald-600 text-white shadow-sm' : 'text-outline hover:text-emerald-600'}`}
                    >
                        <BookOpen size={13} /> Learning
                        {learningCount > 0 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'learning' ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                {learningCount}
                            </span>
                        )}
                    </button>
                </div>
                )}
            </div>

            {/* Learning Internships tab */}
            {activeTab === 'learning' && <LearningTab />}

            {/* Collaborative tab content — hidden when monetary workflow is disabled */}
            {MONETARY_ENABLED && activeTab === 'collaborative' && <>

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
