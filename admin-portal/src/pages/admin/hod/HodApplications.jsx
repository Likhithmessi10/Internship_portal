import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api, { MEDIA_URL } from '../../../utils/api';
import { MONETARY_ENABLED } from '../../../config/features';
import ApplicationProfileModal from '../ApplicationProfileModal';
import {
    Search, ChevronDown, ChevronUp, Users, CheckCircle,
    XCircle, Check, X, Eye, BookOpen, MapPin, Settings, Plus, Loader2,
    FileText, UserCheck, AlertCircle, Briefcase, ClipboardList,
    Award, Star, Clock, RotateCcw, FileCheck, UserPlus
} from 'lucide-react';

// location can be a string (legacy) or {name, vacancies} object
const locName = (l) => typeof l === 'string' ? l : (l?.name || '');

// Must match SEAT_CONSUMING in applicationWorkflowService.js so frontend counts = backend enforcement
const ALLOCATED_STATUSES = ['SELECTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'HIRED', 'ONGOING', 'COMPLETED'];

// Larger, clearer status labels with friendly names
const STATUS_CONFIG = {
    SUBMITTED: { label: 'New Application', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
    SHORTLISTED: { label: 'Shortlisted', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
    UNDER_COMMITTEE_REVIEW: { label: 'Committee Review', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    SELECTED: { label: 'Selected', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    DOCUMENTS_PENDING: { label: 'Awaiting Documents', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    DOCUMENTS_VERIFIED: { label: 'Documents Verified', cls: 'bg-teal-100 text-teal-800 border-teal-300' },
    HIRED: { label: 'Hired', cls: 'bg-emerald-200 text-emerald-900 border-emerald-400' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-300' },
    ONGOING: { label: 'Internship Ongoing', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    COMPLETED: { label: 'Completed', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
};

// ============================================================================
// LEARNING INTERNSHIPS TAB
// ============================================================================
const LearningTab = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
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
        <div className="flex justify-center py-24">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-base font-semibold text-slate-600">Loading applications…</p>
            </div>
        </div>
    );

    // Group by internship → field
    const grouped = {};
    apps.forEach(app => {
        const intId = app.internship?.id || 'unknown';
        const intTitle = app.internship?.title || 'Unknown';
        if (!grouped[intId]) grouped[intId] = { title: intTitle, internshipId: app.internship?.id, fields: {} };
        const fieldKey = app.field?.id || app.fieldId || 'no-field';
        const fieldLabel = app.field?.fieldName || 'General';
        if (!grouped[intId].fields[fieldKey]) {
            grouped[intId].fields[fieldKey] = {
                label: fieldLabel,
                locations: app.field?.locations || [],
                vacancies: app.field?.vacancies || 0,
                fieldId: app.field?.id || app.fieldId,
                internshipId: app.internship?.id,
                departmentGroupId: app.departmentGroupId,
                apps: []
            };
        }
        grouped[intId].fields[fieldKey].apps.push(app);
    });

    const internships = Object.entries(grouped);

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
                id: fKey,
                label: fData.label,
                locations: fData.locations || [],
                vacancies: fData.vacancies,
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
    const rejected = apps.filter(a => a.status === 'REJECTED').length;
    const pending = apps.filter(a => ['SUBMITTED', 'SHORTLISTED'].includes(a.status)).length;
    const docsAwaiting = apps.filter(a => a.status === 'DOCUMENTS_PENDING').length;

    return (
        <div className="space-y-6">
            {/* Big, readable summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    label="Total Applications"
                    value={totalApps}
                    icon={<Users size={24} />}
                    tone="primary"
                />
                <SummaryCard
                    label="Awaiting Your Review"
                    value={pending}
                    icon={<AlertCircle size={24} />}
                    tone="amber"
                    highlight={pending > 0}
                />
                <SummaryCard
                    label="Documents to Verify"
                    value={docsAwaiting}
                    icon={<FileCheck size={24} />}
                    tone="indigo"
                    highlight={docsAwaiting > 0}
                />
                <SummaryCard
                    label="Selected / Hired"
                    value={selectionCount}
                    icon={<CheckCircle size={24} />}
                    tone="emerald"
                />
            </div>

            {/* Big search bar */}
            <div className="relative max-w-xl">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by student name, college, or field…"
                    className="w-full pl-12 pr-4 py-3 text-base font-medium border-2 border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                    <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-500">No applications yet</p>
                    <p className="text-sm text-slate-400 mt-1">New applications will appear here when students apply.</p>
                </div>
            ) : filtered.map(({ id, title, fields }) => (
                <div key={id} className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                    {/* Internship header — bigger, clearer */}
                    <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 flex items-center gap-4 border-b-2 border-emerald-200">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <BookOpen size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{title}</h3>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Learning Internship Program</p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="divide-y-2 divide-slate-100 dark:divide-slate-700">
                        {fields.map(([fieldKey, fieldData]) => (
                            <FieldSection
                                key={fieldKey}
                                fieldData={fieldData}
                                allFields={allFieldsByInt[id] || []}
                                searchQ={q}
                                onAction={handleAction}
                                onDocAction={handleDocAction}
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

// ============================================================================
// SUMMARY CARD — Larger, friendlier KPI tiles
// ============================================================================
const SummaryCard = ({ label, value, icon, tone, highlight }) => {
    const tones = {
        primary: 'border-primary/30 bg-primary/5 text-primary',
        amber:   'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/25 dark:text-amber-200',
        indigo:  'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700/60 dark:bg-indigo-900/25 dark:text-indigo-200',
        emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/25 dark:text-emerald-200',
        red:     'border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-900/25 dark:text-red-200',
    };
    return (
        <div className={`rounded-2xl border-2 p-5 ${tones[tone]} ${highlight ? 'ring-2 ring-offset-2 ring-current/20' : ''}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="opacity-80">{icon}</span>
                {highlight && value > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                )}
            </div>
            <p className="text-4xl font-bold mb-1">{value}</p>
            <p className="text-sm font-semibold opacity-90">{label}</p>
        </div>
    );
};

// ============================================================================
// MENTOR ASSIGNMENT — Cleaner, more obvious UI
// ============================================================================
const AssignMentorCell = ({ app, department, onAssigned }) => {
    const [mentors, setMentors] = useState([]);
    const [picked, setPicked] = useState(app.mentorId || '');
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);

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
                className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border-2 transition-colors ${app.mentorId
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                    }`}>
                <UserCheck size={16} />
                {app.mentorId ? (assignedMentorName || 'Mentor Set') : 'Assign Mentor'}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <select value={picked} onChange={e => setPicked(e.target.value)}
                className="text-sm font-medium border-2 border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary min-w-[180px]">
                <option value="">— Select a mentor —</option>
                {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
            <button onClick={handleSave} disabled={saving || !picked}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setOpen(false)}
                className="px-3 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold border-2 border-slate-200 rounded-lg hover:bg-slate-50">
                Cancel
            </button>
        </div>
    );
};

// ============================================================================
// SELECTION PANEL — Big, prominent confirmation dialog
// ============================================================================
const SelectionPanel = ({ app, allFields, onConfirm, onCancel, isHold }) => {
    const originalField = allFields.find(f => f.id === (app.field?.id || app.fieldId)) || allFields[0];
    const [pickedField, setPickedField] = useState(originalField?.id || '');
    const [pickedLocation, setPickedLocation] = useState(app.preferredLocation || '');

    const fieldObj = allFields.find(f => f.id === pickedField) || originalField;
    const locations = fieldObj?.locations || [];
    const fieldAllocated = fieldObj?.locationAllocated || {};

    const handleFieldChange = (fId) => {
        setPickedField(fId);
        const locs = allFields.find(f => f.id === fId)?.locations || [];
        const appliedMatch = locs.some(l => locName(l) === app.preferredLocation);
        setPickedLocation(appliedMatch ? app.preferredLocation : locName(locs[0] || ''));
    };

    const fieldChanged = pickedField !== (originalField?.id || '');
    const locationChanged = pickedLocation !== (app.preferredLocation || '');
    const changed = fieldChanged || locationChanged;

    return (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-400 rounded-2xl space-y-4 shadow-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-2">
                        <CheckCircle size={22} className="text-emerald-600" />
                        Confirm Selection
                    </h4>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                        {app.student?.fullName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Applied for: <strong>{app.field?.fieldName || '—'}</strong> · {app.preferredLocation || 'No location'}
                    </p>
                </div>
                <button onClick={onCancel}
                    className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800 border-2 border-slate-300 rounded-lg hover:bg-white">
                    Cancel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                        Assign to Field
                    </label>
                    <select value={pickedField} onChange={e => handleFieldChange(e.target.value)}
                        className="w-full text-base font-medium border-2 border-emerald-300 bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500">
                        {allFields.map(f => (
                            <option key={f.id} value={f.id}>{f.label}{f.id === originalField?.id ? ' (Originally Applied)' : ''}</option>
                        ))}
                    </select>
                </div>

                {locations.length > 0 && (
                    <div>
                        <label className="block text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                            Assign Location
                        </label>
                        <select value={pickedLocation} onChange={e => setPickedLocation(e.target.value)}
                            className="w-full text-base font-medium border-2 border-emerald-300 bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500">
                            {locations.map(l => {
                                const name = locName(l);
                                const total = typeof l === 'object' && l.vacancies != null ? l.vacancies : null;
                                const allocated = (fieldAllocated[name] || 0);
                                const remaining = total != null ? Math.max(0, total - allocated) : null;
                                const full = remaining !== null && remaining === 0;
                                const label = remaining !== null
                                    ? `${name} — ${remaining} of ${total} seats left${name === app.preferredLocation ? ' (Preferred)' : ''}${full ? ' — FULL' : ''}`
                                    : `${name}${name === app.preferredLocation ? ' (Preferred)' : ''}`;
                                return <option key={name} value={name} disabled={full}>{label}</option>;
                            })}
                        </select>
                    </div>
                )}
            </div>

            {changed && (
                <div className="flex items-start gap-2 p-3 bg-amber-100 border-2 border-amber-300 rounded-lg">
                    <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-amber-900">
                        Note: You are assigning this candidate to a different {fieldChanged && locationChanged ? 'field and location' : fieldChanged ? 'field' : 'location'} than they originally applied for.
                    </p>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    onClick={() => onConfirm({ fieldId: pickedField, preferredLocation: pickedLocation })}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white text-base font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <Check size={20} />
                    Confirm Selection
                </button>
                <button onClick={onCancel}
                    className="px-6 py-3 bg-white text-slate-700 text-base font-semibold rounded-xl border-2 border-slate-300 hover:bg-slate-50">
                    Cancel
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// CANDIDATE CARD — Clean card layout replacing the dense table row
// ============================================================================
const CandidateCard = ({ app, onAction, onDocAction, onView, department, onRefresh, onSelectOpen }) => {
    let status = STATUS_CONFIG[app.status] || { label: app.status, cls: 'bg-slate-100 text-slate-700 border-slate-300' };

    const hasJoiningDocs = app.documents && app.documents.some(d =>
        !['RESUME', 'PASSPORT_PHOTO', 'NOC_LETTER', 'PRINCIPAL_LETTER', 'HOD_LETTER', 'MARKSHEET'].includes(d.type)
    );
    if (app.status === 'DOCUMENTS_PENDING' && hasJoiningDocs) {
        status = { label: 'Docs Submitted', cls: 'bg-amber-200 text-amber-900 border-amber-400' };
    }

    const initials = (app.student?.fullName || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                    <button onClick={() => onView(app)} className="font-bold text-slate-900 dark:text-white hover:text-primary text-base transition-colors">
                        {app.student?.fullName}
                    </button>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${status.cls}`}>
                        {status.label}
                    </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {[app.student?.branch, app.student?.collegeName].filter(Boolean).join(' · ')}
                    {app.student?.collegeCategory && <span className="ml-1.5 text-xs font-semibold text-slate-400">({app.student.collegeCategory})</span>}
                </p>
                <div className="flex items-center gap-4 mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                    {app.preferredLocation && (
                        <span className="flex items-center gap-1"><MapPin size={11} /> {app.preferredLocation}</span>
                    )}
                    {app.student?.cgpa != null && <span>CGPA {app.student.cgpa.toFixed(2)}</span>}
                    {app.prtiNote && <span className="text-amber-600">💬 {app.prtiNote}</span>}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button onClick={() => onView(app)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                    <Eye size={14} /> View
                </button>

                {['SUBMITTED', 'SHORTLISTED'].includes(app.status) && (<>
                    <button onClick={() => onSelectOpen(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                        <Check size={14} /> Select
                    </button>
                    <button onClick={() => { if (window.confirm(`Reject ${app.student?.fullName}?`)) onAction(app.id, 'REJECTED'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800">
                        <X size={14} /> Reject
                    </button>
                </>)}

                {app.status === 'SELECTED' && (<>
                    {!app.prtiApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                            <Clock size={13} /> Awaiting PRTI
                        </span>
                    ) : (
                        <button onClick={() => onDocAction(app.id, 'request')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                            <FileText size={14} /> Request Docs
                        </button>
                    )}
                    <button onClick={() => { if (window.confirm(`Remove ${app.student?.fullName}?`)) onAction(app.id, 'REJECTED'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors border border-red-200">
                        <X size={14} />
                    </button>
                </>)}

                {app.status === 'DOCUMENTS_PENDING' && (<>
                    {hasJoiningDocs ? (
                        <button onClick={() => onDocAction(app.id, 'verify')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm">
                            <FileCheck size={14} /> Verify Docs
                        </button>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-default">
                            <Clock size={13} /> Awaiting Upload
                        </span>
                    )}
                    <button onClick={() => { if (window.confirm(`Reject ${app.student?.fullName}?`)) onAction(app.id, 'REJECTED'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 text-sm hover:bg-red-50 transition-colors border border-red-200">
                        <X size={14} />
                    </button>
                </>)}

                {app.status === 'DOCUMENTS_VERIFIED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle size={13} /> Verified
                    </span>
                )}

                {['HIRED', 'ONGOING', 'COMPLETED'].includes(app.status) && (
                    <AssignMentorCell app={app} department={department} onAssigned={onRefresh} />
                )}

                {app.status === 'REJECTED' && (
                    <button onClick={() => onAction(app.id, 'SUBMITTED')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200">
                        <RotateCcw size={14} /> Restore
                    </button>
                )}
            </div>
        </div>
    );
};

// PhaseTable removed — learning tab uses CandidateCard in FieldSection
// Collaborative tab (TierAccordion) has its own inline table

// ============================================================================
// PHASE TABLE — kept as dead-code sentinel; safe to remove if unused
// ============================================================================
const PAGE_SIZE = 5;
const PhaseTable = ({ apps, onAction, onDocAction, onView, department, onRefresh, onSelectOpen }) => {
    const [showAll, setShowAll] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    if (apps.length === 0) return null;

    const visibleApps = showAll ? apps : apps.slice(0, PAGE_SIZE);
    const hiddenCount = apps.length - visibleApps.length;

    const sectionStatus = apps[0]?.status;
    const allSameKind = apps.every(a => {
        if (['SUBMITTED', 'SHORTLISTED'].includes(sectionStatus)) return ['SUBMITTED', 'SHORTLISTED'].includes(a.status);
        return a.status === sectionStatus;
    });
    const bulkable = allSameKind && ['SUBMITTED', 'SHORTLISTED', 'REJECTED'].includes(sectionStatus);

    const hasHired = apps.some(a => ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status));
    const showMentor = hasHired;

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allVisibleSelected = visibleApps.length > 0 && visibleApps.every(a => selected.has(a.id));
    const toggleAll = () => {
        if (allVisibleSelected) {
            setSelected(prev => {
                const next = new Set(prev);
                visibleApps.forEach(a => next.delete(a.id));
                return next;
            });
        } else {
            setSelected(prev => {
                const next = new Set(prev);
                visibleApps.forEach(a => next.add(a.id));
                return next;
            });
        }
    };

    const handleBulk = async (newStatus, label) => {
        if (selected.size === 0) return;
        if (!window.confirm(`${label} ${selected.size} candidate(s)?`)) return;
        setBulkLoading(true);
        let ok = 0;
        for (const id of selected) {
            try { await onAction(id, newStatus); ok++; } catch { /* silent */ }
        }
        setSelected(new Set());
        setBulkLoading(false);
        if (ok > 0) onRefresh();
    };

    return (
        <div>
            {/* Big, obvious bulk action bar */}
            {bulkable && selected.size > 0 && (
                <div className="px-5 py-4 bg-blue-50 dark:bg-blue-900/30 border-y-2 border-blue-300 dark:border-blue-700 flex items-center gap-4 flex-wrap">
                    <span className="text-base font-bold text-blue-900 dark:text-blue-300">
                        {selected.size} candidate{selected.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['SUBMITTED', 'SHORTLISTED'].includes(sectionStatus) && (
                            <button onClick={() => handleBulk('REJECTED', 'Reject')} disabled={bulkLoading}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm">
                                <X size={16} /> Reject {selected.size}
                            </button>
                        )}
                        {sectionStatus === 'REJECTED' && (
                            <button onClick={() => handleBulk('SUBMITTED', 'Un-reject')} disabled={bulkLoading}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white text-sm font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 shadow-sm">
                                <RotateCcw size={16} /> Un-reject {selected.size}
                            </button>
                        )}
                    </div>
                    <button onClick={() => setSelected(new Set())}
                        className="ml-auto px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border-2 border-slate-300 rounded-lg hover:bg-white">
                        Clear Selection
                    </button>
                </div>
            )}

            <div className="p-3 space-y-2">
                {visibleApps.map(app => (
                    <CandidateCard key={app.id} app={app}
                        onAction={onAction} onDocAction={onDocAction}
                        onView={onView} department={department} onRefresh={onRefresh}
                        onSelectOpen={onSelectOpen} />
                ))}
            </div>

            {hiddenCount > 0 && (
                <button onClick={() => setShowAll(true)}
                    className="w-full py-3 text-sm font-bold text-primary dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/10 dark:hover:bg-indigo-900/30 border-t-2 border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2">
                    <ChevronDown size={18} /> Show all {apps.length} candidates ({hiddenCount} more)
                </button>
            )}
            {showAll && apps.length > PAGE_SIZE && (
                <button onClick={() => setShowAll(false)}
                    className="w-full py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2">
                    <ChevronUp size={18} /> Collapse (show first {PAGE_SIZE})
                </button>
            )}
        </div>
    );
};

// ============================================================================
// REQUIRED DOCS CONFIG — Bigger modal with clearer copy
// ============================================================================
const DEFAULT_DOCS = [
    { id: 'JOINING_LETTER', label: 'Joining Letter (filled & signed)', format: 'PDF', mandatory: true },
    { id: 'POLICY',         label: 'Internship Policy / NOC',          format: 'PDF', mandatory: true },
    { id: 'BOND',           label: 'Bond Agreement',                   format: 'PDF', mandatory: true },
    { id: 'UNDERTAKING',    label: 'Undertaking Form',                 format: 'PDF', mandatory: true },
];
const FORMATS = [
    { value: 'PDF', label: 'PDF only', hint: '.pdf' },
    { value: 'IMAGE', label: 'Image only', hint: '.jpg .png' },
    { value: 'ANY', label: 'PDF or Image', hint: '.pdf .jpg .png' },
];
const normalizeDoc = (d, idx) => {
    if (typeof d === 'string') {
        const id = d.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
        return { id: id || `DOC_${idx + 1}`, label: d, format: 'PDF', mandatory: true };
    }
    return {
        id: d.id || `DOC_${idx + 1}`,
        label: d.label || d.id || 'Document',
        format: ['PDF', 'IMAGE', 'ANY'].includes(d.format) ? d.format : 'PDF',
        mandatory: d.mandatory !== false,
    };
};

const RequiredDocsConfig = ({ fieldData, onSaved }) => {
    const [open, setOpen] = useState(false);
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [docCount, setDocCount] = useState(null);
    // Per-doc templates: { JOINING_LETTER: { url, name }, BOND: { url, name }, ... }
    const [docTemplates, setDocTemplates] = useState({});
    const [uploadingDoc, setUploadingDoc] = useState(null); // docId currently uploading

    useEffect(() => {
        let mounted = true;
        api.get(`/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/details`)
            .then(r => {
                if (!mounted) return;
                const raw = r.data.data?.requiredDocuments || [];
                setDocCount(raw.length);
            })
            .catch(() => mounted && setDocCount(0));
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldData.internshipId, fieldData.departmentGroupId]);

    const loadAndOpen = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/details`);
            const raw = res.data.data?.requiredDocuments || [];
            const normalized = raw.length > 0
                ? raw.map((d, i) => normalizeDoc(d, i))
                : [...DEFAULT_DOCS];
            setDocs(normalized);
            // Merge new documentTemplates with legacy joiningLetterTemplateUrl for backward compat
            const templates = typeof res.data.data?.documentTemplates === 'object' && res.data.data.documentTemplates !== null
                ? { ...res.data.data.documentTemplates }
                : {};
            if (!templates.JOINING_LETTER && res.data.data?.joiningLetterTemplateUrl) {
                templates.JOINING_LETTER = {
                    url: res.data.data.joiningLetterTemplateUrl,
                    name: res.data.data.joiningLetterTemplateName || 'Joining Letter Template'
                };
            }
            setDocTemplates(templates);
        } catch { setDocs([...DEFAULT_DOCS]); setDocTemplates({}); }
        finally { setLoading(false); setOpen(true); }
    };

    const handleDocTemplateUpload = async (docId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('template', file);
        setUploadingDoc(docId);
        try {
            await api.post(
                `/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/document-templates/${docId}`,
                fd,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setDocTemplates(prev => ({ ...prev, [docId]: { url: `uploaded/${docId}`, name: file.name } }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upload template');
        } finally {
            setUploadingDoc(null);
            e.target.value = '';
        }
    };

    const handleDocTemplateRemove = async (docId) => {
        if (!window.confirm('Remove this template?')) return;
        setUploadingDoc(docId);
        try {
            await api.delete(`/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/document-templates/${docId}`);
            setDocTemplates(prev => { const n = { ...prev }; delete n[docId]; return n; });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove template');
        } finally {
            setUploadingDoc(null);
        }
    };

    const save = async () => {
        if (docs.some(d => !d.label.trim())) {
            alert('Every document must have a name.');
            return;
        }
        setSaving(true);
        try {
            const payload = docs.map((d, i) => ({
                id: (d.id && d.id !== `DOC_${i + 1}`) ? d.id : d.label.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 32) || `DOC_${i + 1}`,
                label: d.label.trim(),
                format: d.format,
                mandatory: !!d.mandatory,
            }));
            await api.put(`/admin/internships/${fieldData.internshipId}/groups/${fieldData.departmentGroupId}/required-docs`, { requiredDocuments: payload });
            setDocCount(payload.length);
            onSaved?.(payload);
            setOpen(false);
        } catch (err) { alert(err.response?.data?.message || 'Failed to save.'); }
        finally { setSaving(false); }
    };

    const addDoc = () => setDocs(d => [...d, { id: '', label: '', format: 'PDF', mandatory: true }]);
    const updateDoc = (i, patch) => setDocs(d => d.map((doc, idx) => idx === i ? { ...doc, ...patch } : doc));
    const removeDoc = (i) => setDocs(d => d.filter((_, idx) => idx !== i));
    const resetDefaults = () => setDocs([...DEFAULT_DOCS]);

    return (
        <>
            <button onClick={loadAndOpen} disabled={loading}
                title="Configure required joining documents"
                className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border-2 transition-colors ${docCount > 0
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 hover:bg-indigo-100'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 hover:bg-slate-100'
                    }`}>
                <Settings size={16} /> {loading ? 'Loading…' : `Required Docs (${docCount ?? '?'})`}
            </button>

            {open && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
                    onClick={() => !saving && setOpen(false)}>
                    <div onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col">

                        <div className="px-6 py-5 border-b-2 border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                    Configure Required Documents
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Set which documents selected students must upload before joining.
                                </p>
                            </div>
                            <button onClick={() => !saving && setOpen(false)} disabled={saving}
                                className="w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 transition-colors flex items-center justify-center disabled:opacity-50 border-2 border-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
                            {docs.length === 0 && (
                                <div className="py-12 text-center text-base font-semibold text-slate-500">
                                    No documents configured yet. Click "Add Document" below to start.
                                </div>
                            )}
                            {docs.map((doc, i) => (
                                <div key={i} className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl">
                                    <div className="col-span-12 sm:col-span-5">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Document Name</label>
                                        <input value={doc.label} onChange={e => updateDoc(i, { label: e.target.value })}
                                            placeholder="e.g. No Objection Certificate"
                                            className="w-full text-base font-medium text-slate-800 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="col-span-7 sm:col-span-4">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Accepted Format</label>
                                        <select value={doc.format} onChange={e => updateDoc(i, { format: e.target.value })}
                                            className="w-full text-base font-medium text-slate-800 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
                                            {FORMATS.map(f => (
                                                <option key={f.value} value={f.value}>{f.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-3 sm:col-span-2 flex items-center justify-center pb-1.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={doc.mandatory} onChange={e => updateDoc(i, { mandatory: e.target.checked })}
                                                className="w-5 h-5 cursor-pointer accent-indigo-600" />
                                            <span className="text-sm font-bold text-slate-700">Required</span>
                                        </label>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end pb-1">
                                        <button onClick={() => removeDoc(i)} disabled={saving}
                                            className="w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors disabled:opacity-50 border-2 border-red-200"
                                            title="Remove this document">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addDoc} disabled={saving}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 text-base font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                <Plus size={20} /> Add Document
                            </button>

                            {/* Document Templates — HOD uploads blank templates per doc type; students download, fill, upload back */}
                            <div className="mt-5 p-4 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-200 dark:border-indigo-700/40 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={16} className="text-indigo-700 dark:text-indigo-400" />
                                    <h4 className="text-base font-bold text-indigo-900 dark:text-indigo-200">Document Templates</h4>
                                </div>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mb-4">
                                    Upload blank template files for each required document below. Students will see a "Download Template" button, fill and sign them, then upload the completed copies.
                                </p>
                                <div className="space-y-2">
                                    {docs.map((doc) => {
                                        const tmpl = docTemplates[doc.id];
                                        const isUploading = uploadingDoc === doc.id;
                                        return (
                                            <div key={doc.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-800/40 rounded-xl">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{doc.label}</p>
                                                    {tmpl ? (
                                                        <p className="text-[11px] text-emerald-600 font-semibold truncate flex items-center gap-1 mt-0.5">
                                                            <FileCheck size={11} /> {tmpl.name || 'Template uploaded'}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">No template uploaded</p>
                                                    )}
                                                </div>
                                                {tmpl ? (
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <label className={`px-2.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                                            {isUploading ? <Loader2 size={12} className="animate-spin inline" /> : 'Replace'}
                                                            <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleDocTemplateUpload(doc.id, e)} disabled={isUploading} className="hidden" />
                                                        </label>
                                                        <button onClick={() => handleDocTemplateRemove(doc.id)} disabled={isUploading}
                                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50 transition-colors">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                                        {isUploading ? 'Uploading…' : 'Upload Template'}
                                                        <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleDocTemplateUpload(doc.id, e)} disabled={isUploading} className="hidden" />
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {docs.length === 0 && (
                                        <p className="text-sm text-slate-400 text-center py-4">Add documents above to configure their templates.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t-2 border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
                            <button onClick={resetDefaults} disabled={saving}
                                className="text-sm font-semibold text-slate-600 hover:text-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                                <RotateCcw size={14} /> Reset to defaults
                            </button>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setOpen(false)} disabled={saving}
                                    className="px-5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 rounded-lg border-2 border-slate-300">
                                    Cancel
                                </button>
                                <button onClick={save} disabled={saving || docs.length === 0}
                                    className="px-6 py-2.5 bg-indigo-600 text-white text-base font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// ============================================================================
// FIELD SECTION — Status tabs + candidate cards (flat, no nested accordions)
// ============================================================================
const FieldSection = ({ fieldData, allFields, searchQ, onAction, onDocAction, onView, department, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('new');
    const [selectionTarget, setSelectionTarget] = useState(null);
    const [bulkSending, setBulkSending] = useState(false);

    const allApps = [...fieldData.apps].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const filterApps = (statuses) => allApps.filter(a =>
        statuses.includes(a.status) &&
        (!searchQ ||
            a.student?.fullName?.toLowerCase().includes(searchQ) ||
            a.student?.collegeName?.toLowerCase().includes(searchQ))
    );

    const newApps      = filterApps(['SUBMITTED', 'SHORTLISTED']);
    const selectedApps = filterApps(['SELECTED']);
    const docsApps     = filterApps(['DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED']);
    const activeApps   = filterApps(['HIRED', 'ONGOING', 'COMPLETED']);
    const rejectedApps = filterApps(['REJECTED']);

    const vacancies  = fieldData.vacancies;
    const hiredCount = allApps.filter(a => ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length;
    const filled     = allApps.filter(a => ALLOCATED_STATUSES.includes(a.status)).length;

    // Location vacancy tracking
    const locationFilledMap = {};
    allApps.forEach(a => {
        if (ALLOCATED_STATUSES.includes(a.status) && a.preferredLocation)
            locationFilledMap[a.preferredLocation] = (locationFilledMap[a.preferredLocation] || 0) + 1;
    });

    const TABS = [
        { id: 'new',      label: 'New',       apps: newApps,      color: 'text-slate-700',   activeCls: 'border-slate-600 text-slate-900 dark:text-white' },
        { id: 'selected', label: 'Selected',   apps: selectedApps, color: 'text-indigo-600',  activeCls: 'border-indigo-600 text-indigo-700 dark:text-indigo-300' },
        { id: 'docs',     label: 'Documents',  apps: docsApps,     color: 'text-amber-600',   activeCls: 'border-amber-500 text-amber-700 dark:text-amber-300' },
        { id: 'active',   label: 'Active',     apps: activeApps,   color: 'text-emerald-600', activeCls: 'border-emerald-600 text-emerald-700 dark:text-emerald-300' },
        { id: 'rejected', label: 'Rejected',   apps: rejectedApps, color: 'text-red-500',     activeCls: 'border-red-500 text-red-600 dark:text-red-400' },
    ].filter(t => t.apps.length > 0 || t.id === 'new');

    // Auto-switch to first tab with data when search changes
    const currentTabApps = TABS.find(t => t.id === activeTab)?.apps ?? newApps;

    const approvedSelected = selectedApps.filter(a => a.prtiApproved);

    const handleBulkRequestDocs = async () => {
        if (approvedSelected.length === 0) return;
        if (!window.confirm(`Send document request to ${approvedSelected.length} candidate(s)?`)) return;
        setBulkSending(true);
        let ok = 0;
        for (const app of approvedSelected) {
            try { await onDocAction(app.id, 'request'); ok++; } catch { /* silent */ }
        }
        setBulkSending(false);
        onRefresh();
        if (ok > 0) alert(`Document request sent to ${ok} candidate(s).`);
    };

    return (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">

            {/* ── Field header ── */}
            <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${hiredCount >= vacancies && vacancies > 0 ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{fieldData.label}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {hiredCount}/{vacancies} hired · {allApps.length} application{allApps.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {/* Location vacancy pills */}
                {fieldData.locations?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {fieldData.locations.map(l => {
                            const name = locName(l);
                            const total = typeof l === 'object' && l.vacancies != null ? l.vacancies : null;
                            const used = locationFilledMap[name] || 0;
                            const rem = total != null ? Math.max(0, total - used) : null;
                            const cls = rem === 0 ? 'bg-red-50 text-red-700 border-red-200' : rem != null && rem <= 2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200';
                            return (
                                <span key={name} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${cls}`}>
                                    <MapPin size={10} /> {name}{rem != null ? ` ${used}/${total}` : ''}
                                </span>
                            );
                        })}
                    </div>
                )}
                <RequiredDocsConfig fieldData={fieldData} />
            </div>

            {/* ── Inline selection panel ── */}
            {selectionTarget && (
                <div className="mx-5 mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <SelectionPanel
                        app={selectionTarget}
                        allFields={allFields}
                        locationAllocated={locationFilledMap}
                        isHold={false}
                        onConfirm={({ fieldId, preferredLocation }) => {
                            onAction(selectionTarget.id, 'SELECTED', false, { fieldId, preferredLocation });
                            setSelectionTarget(null);
                        }}
                        onCancel={() => setSelectionTarget(null)}
                    />
                </div>
            )}

            {/* ── Status tabs ── */}
            <div className="flex items-center gap-0 px-5 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? tab.activeCls + ' bg-transparent'
                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        {tab.label}
                        {tab.apps.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? 'bg-current/15' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                {tab.apps.length}
                            </span>
                        )}
                    </button>
                ))}
                {/* Bulk action for selected tab */}
                {activeTab === 'selected' && approvedSelected.length > 0 && (
                    <div className="ml-auto pl-3 shrink-0">
                        <button onClick={handleBulkRequestDocs} disabled={bulkSending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors">
                            {bulkSending ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                            Request from all ({approvedSelected.length})
                        </button>
                    </div>
                )}
            </div>

            {/* ── Candidate cards ── */}
            <div className="p-4 space-y-2.5">
                {currentTabApps.length === 0 ? (
                    <div className="py-10 text-center">
                        <Users size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                            {searchQ ? 'No matches for your search' : `No ${TABS.find(t => t.id === activeTab)?.label.toLowerCase() ?? ''} applications`}
                        </p>
                    </div>
                ) : currentTabApps.map(app => (
                    <CandidateCard
                        key={app.id}
                        app={app}
                        onAction={onAction}
                        onDocAction={onDocAction}
                        onView={onView}
                        department={department}
                        onRefresh={onRefresh}
                        onSelectOpen={(a) => setSelectionTarget(a)}
                    />
                ))}
            </div>
        </div>
    );
};

// SectionGroup removed — replaced by status tabs in FieldSection

// ============================================================================
// COLLEGE TIER CLASSIFICATION (unchanged logic)
// ============================================================================
const TOP_CATEGORIES = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];

const classifyApp = (app, preferredColleges = []) => {
    const name = (app.student?.collegeName || '').toLowerCase();
    const cat = app.student?.collegeCategory || '';
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
        headerCls: 'bg-amber-50 border-amber-300 hover:bg-amber-100',
        badgeCls: 'bg-amber-200 text-amber-900 border-amber-400',
        barCls: 'bg-amber-500',
        dotCls: 'bg-amber-500',
        text: 'text-amber-900',
    },
    TOP: {
        label: 'Top Universities (IIT/NIT/IIIT)',
        headerCls: 'bg-indigo-50 border-indigo-300 hover:bg-indigo-100',
        badgeCls: 'bg-indigo-200 text-indigo-900 border-indigo-400',
        barCls: 'bg-indigo-500',
        dotCls: 'bg-indigo-500',
        text: 'text-indigo-900',
    },
    REGULAR: {
        label: 'Other Colleges',
        headerCls: 'bg-slate-50 border-slate-300 hover:bg-slate-100',
        badgeCls: 'bg-slate-200 text-slate-800 border-slate-400',
        barCls: 'bg-slate-500',
        dotCls: 'bg-slate-500',
        text: 'text-slate-800',
    },
};

// ============================================================================
// TIER ACCORDION — Bigger rows for collaborative tab
// ============================================================================
const TierAccordion = ({ tier, apps, suggested, ps, onShortlist, onAction, onView }) => {
    const [open, setOpen] = useState(apps.length > 0);
    const [search, setSearch] = useState('');
    const meta = TIER_META[tier];
    const shortlisted = apps.filter(a => a.status === 'SHORTLISTED').length;
    const pct = suggested > 0 ? Math.min(100, Math.round((shortlisted / suggested) * 100)) : 0;
    const done = shortlisted >= suggested && suggested > 0;

    const filtered = apps
        .filter(app => {
            const q = search.toLowerCase();
            return !q ||
                app.student?.fullName?.toLowerCase().includes(q) ||
                app.student?.collegeName?.toLowerCase().includes(q);
        })
        .sort((a, b) => (b.student?.cgpa || 0) - (a.student?.cgpa || 0));

    return (
        <div className={`border-2 rounded-xl overflow-hidden ${meta.headerCls.split(' ')[1]}`}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${meta.headerCls}`}
            >
                <div className={`w-3 h-3 rounded-full shrink-0 ${meta.dotCls}`} />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold px-3 py-1 rounded-md border-2 ${meta.badgeCls}`}>
                            {meta.label}
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                            {apps.length} applied
                        </span>
                        {done && (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-xs font-bold border-2 border-emerald-400">
                                ✓ Target met
                            </span>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 bg-white/70 rounded-full overflow-hidden border border-slate-200">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : meta.barCls}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-slate-700 shrink-0 whitespace-nowrap">
                            {shortlisted} of {suggested} shortlisted
                        </span>
                    </div>
                </div>

                {open ? <ChevronUp size={20} className="text-slate-500 shrink-0" /> : <ChevronDown size={20} className="text-slate-500 shrink-0" />}
            </button>

            {open && (
                <div className="bg-white border-t-2 border-slate-100">
                    {apps.length === 0 ? (
                        <div className="py-10 text-center text-base font-semibold text-slate-500">
                            No applications from {meta.label.toLowerCase()} yet.
                        </div>
                    ) : (
                        <>
                            {apps.length > 4 && (
                                <div className="p-4 border-b-2 border-slate-100">
                                    <div className="relative max-w-md">
                                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Filter by name or college…"
                                            className="w-full pl-11 pr-3 py-2.5 text-base font-medium border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[720px]">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            {['Candidate', 'College', 'CGPA', 'Status', 'Actions'].map(h => (
                                                <th key={h} className="px-5 py-3 text-sm font-bold text-slate-700 border-b-2 border-slate-200">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-slate-100">
                                        {filtered.map(app => {
                                            const status = STATUS_CONFIG[app.status] || { label: app.status, cls: 'bg-slate-100 text-slate-700 border-slate-300' };
                                            return (
                                                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="text-base font-bold text-slate-900">{app.student?.fullName}</p>
                                                        <p className="text-sm font-medium text-slate-500 mt-0.5">{app.student?.branch}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-semibold text-slate-700 max-w-[220px] truncate" title={app.student?.collegeName}>
                                                            {app.student?.collegeName}
                                                        </p>
                                                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                            {app.student?.collegeCategory}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-base font-bold text-slate-800">
                                                            {app.student?.cgpa?.toFixed(2) ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${status.cls}`}>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <button
                                                                onClick={() => onView(app)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors border-2 border-slate-200"
                                                            >
                                                                <Eye size={15} /> View
                                                            </button>
                                                            {app.status === 'SUBMITTED' && (
                                                                <button
                                                                    onClick={() => onShortlist(app, ps)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                                                    title={ps?.mentor ? `Mentor: ${ps.mentor.name || ps.mentor.email}` : 'Set PS mentor first via Committees'}
                                                                >
                                                                    <Award size={15} /> Shortlist
                                                                </button>
                                                            )}
                                                            {app.status === 'SHORTLISTED' && (
                                                                <button
                                                                    onClick={() => onAction(app.id, 'SELECTED')}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                                                                >
                                                                    <Check size={15} /> Select
                                                                </button>
                                                            )}
                                                            {['SUBMITTED', 'SHORTLISTED'].includes(app.status) && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`Reject ${app.student?.fullName}?`)) onAction(app.id, 'REJECTED');
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors border-2 border-red-300"
                                                                >
                                                                    <X size={15} /> Reject
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-10 text-center text-base font-semibold text-slate-500">
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

// ============================================================================
// PROBLEM STATEMENT SECTION (collaborative tab)
// ============================================================================
const PsSection = ({ ps, internshipTitle, preferredColleges, shortlistingRatio, onShortlist, onAction, onView }) => {
    const [open, setOpen] = useState(true);
    const ratio = shortlistingRatio || 2;
    const suggested = Math.max(1, (ps.vacancies || 0) * ratio);

    const byTier = { PREFERRED: [], TOP: [], REGULAR: [] };
    ps.applications.forEach(app => {
        byTier[classifyApp(app, preferredColleges)].push(app);
    });

    const shortlisted = ps.applications.filter(a => a.status === 'SHORTLISTED').length;
    const tierRows = ps.applications.length > 0 ? [
        ...(preferredColleges.length > 0 ? [{ tier: 'PREFERRED', apps: byTier.PREFERRED }] : []),
        { tier: 'TOP', apps: byTier.TOP },
        { tier: 'REGULAR', apps: byTier.REGULAR },
    ] : [];

    return (
        <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0 border-2 border-primary/20">
                        {ps.problemStatementNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-slate-900 leading-tight truncate">{ps.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-slate-600">
                                {internshipTitle}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-sm font-semibold text-slate-600">
                                {ps.vacancies} {ps.vacancies === 1 ? 'vacancy' : 'vacancies'}
                            </span>
                            {ps.mentor ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 bg-emerald-100 border-2 border-emerald-300 px-2.5 py-0.5 rounded-md">
                                    <UserCheck size={13} /> Mentor: {ps.mentor.name || ps.mentor.email}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 bg-amber-100 border-2 border-amber-300 px-2.5 py-0.5 rounded-md">
                                    <AlertCircle size={13} /> No mentor assigned
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
                        {ps.applications.length} applied
                    </span>
                    {shortlisted > 0 && (
                        <span className="px-3 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-bold border-2 border-blue-300">
                            {shortlisted} shortlisted
                        </span>
                    )}
                    {open ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                </div>
            </button>

            {open && (
                <div className="border-t-2 border-slate-200">
                    <div className="px-5 py-3 bg-blue-50 flex items-center gap-2 border-b-2 border-blue-100">
                        <Star size={16} className="text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700">
                            <strong>Shortlist Guide:</strong> Ratio 1:{ratio} · For {ps.vacancies} {ps.vacancies === 1 ? 'vacancy' : 'vacancies'}, aim to shortlist {suggested} candidates per tier
                        </span>
                    </div>

                    {ps.applications.length === 0 ? (
                        <div className="py-16 text-center bg-white">
                            <Users size={36} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-base font-semibold text-slate-500">No applications yet for this problem statement.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3 bg-white">
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

// ============================================================================
// MAIN PAGE — Big tabs, clear navigation
// ============================================================================
const HodApplications = () => {
    const [activeTab, setActiveTab] = useState(MONETARY_ENABLED ? null : 'learning');
    const [groups, setGroups] = useState([]);
    const [learningCount, setLearningCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
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
                    const hasCollab = collabData.some(g => g.problemStatements.some(ps => ps.applications.length > 0));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        total: allApps.length,
        shortlisted: allApps.filter(a => a.status === 'SHORTLISTED').length,
        selected: allApps.filter(a => ['SELECTED', 'APPROVED'].includes(a.status)).length,
        rejected: allApps.filter(a => a.status === 'REJECTED').length,
    };

    const currentGroup = groups.find(g => g.id === activeGroup);
    const preferredColleges = Array.isArray(currentGroup?.internship?.preferredColleges)
        ? currentGroup.internship.preferredColleges
        : [];
    const shortlistingRatio = currentGroup?.internship?.shortlistingRatio || 2;

    if (loading || activeTab === null) return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-base font-semibold text-slate-600">Loading applications…</p>
            </div>
        </div>
    );

    const collabAppsCount = groups.reduce((s, g) => s + g.problemStatements.reduce((ps, p) => ps + p.applications.length, 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Page header — much bigger and clearer */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                        Applications
                    </h1>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
                        {MONETARY_ENABLED
                            ? 'Review, select, and manage student applications for your department.'
                            : 'Review and manage learning internship applications.'}
                    </p>
                </div>

                {/* Big tab switcher */}
                {MONETARY_ENABLED && (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 w-fit">
                        <button
                            onClick={() => setActiveTab('collaborative')}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-base font-bold transition-all ${activeTab === 'collaborative'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-slate-700 hover:bg-white'
                                }`}
                        >
                            <ClipboardList size={18} /> Collaborative
                            {collabAppsCount > 0 && (
                                <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${activeTab === 'collaborative' ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary'
                                    }`}>
                                    {collabAppsCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('learning')}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-base font-bold transition-all ${activeTab === 'learning'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-700 hover:bg-white'
                                }`}
                        >
                            <BookOpen size={18} /> Learning
                            {learningCount > 0 && (
                                <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${activeTab === 'learning' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {learningCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Workflow help banner */}
            {activeTab === 'learning' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        How this works:
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside font-medium">
                        <li><strong>Review</strong> new applications and click <strong>Select</strong> on candidates you want to hire.</li>
                        <li><strong>Request Documents</strong> from selected candidates (after PRTI approval).</li>
                        <li><strong>Verify Documents</strong> when students upload them.</li>
                        <li><strong>Assign Mentor</strong> to hired interns.</li>
                    </ol>
                </div>
            )}

            {/* Learning tab */}
            {activeTab === 'learning' && <LearningTab />}

            {/* Collaborative tab */}
            {MONETARY_ENABLED && activeTab === 'collaborative' && <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard label="Total Applied" value={stats.total} icon={<Users size={24} />} tone="primary" />
                    <SummaryCard label="Shortlisted" value={stats.shortlisted} icon={<Award size={24} />} tone="indigo" highlight={stats.shortlisted > 0} />
                    <SummaryCard label="Selected" value={stats.selected} icon={<CheckCircle size={24} />} tone="emerald" />
                    <SummaryCard label="Rejected" value={stats.rejected} icon={<XCircle size={24} />} tone="red" />
                </div>

                {groups.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                        <ClipboardList size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-slate-500">No collaborative problem statements yet.</p>
                        <p className="text-sm text-slate-400 mt-1">Problem statements for your department will appear here.</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left: Internship selector with bigger cards */}
                        <div className="lg:w-72 shrink-0 space-y-3">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Select Internship Program
                            </p>
                            {groups.map(g => {
                                const appsCount = g.problemStatements.reduce((s, ps) => s + ps.applications.length, 0);
                                const isActive = g.id === activeGroup;
                                const ratio = g.internship?.shortlistingRatio || 2;
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => setActiveGroup(g.id)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isActive
                                                ? 'border-primary bg-primary/5 shadow-md'
                                                : 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase size={16} className={isActive ? 'text-primary' : 'text-slate-400'} />
                                            <p className={`text-base font-bold truncate ${isActive ? 'text-primary' : 'text-slate-800'}`}>
                                                {g.internship?.title}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-slate-600">
                                                {g.problemStatements.length} PS · {appsCount} applications
                                            </span>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                1:{ratio} ratio
                                            </span>
                                        </div>
                                        {g.internship?.publishStatus === 'LIVE' ? (
                                            <span className="mt-2 inline-block text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                                LIVE
                                            </span>
                                        ) : (
                                            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                                <Clock size={12} /> Pending
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: PS list */}
                        <div className="flex-1 min-w-0 space-y-4">
                            {currentGroup && (
                                <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <Star size={16} className="text-amber-500" />
                                        Shortlisting ratio: <span className="font-bold text-primary">1 : {shortlistingRatio}</span>
                                    </div>
                                    {preferredColleges.length > 0 ? (
                                        <>
                                            <span className="text-slate-300">·</span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-amber-800">Preferred:</span>
                                                {preferredColleges.map((pc, i) => (
                                                    <span key={i} className="text-sm font-bold text-amber-900 bg-amber-100 border-2 border-amber-300 px-2.5 py-0.5 rounded-md">
                                                        {pc}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-500 italic">
                                            No preferred colleges configured
                                        </span>
                                    )}
                                </div>
                            )}

                            {currentGroup?.problemStatements.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                                    <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
                                    <p className="text-base font-semibold text-slate-500">
                                        No problem statements for this internship yet.
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
            </>}
        </div>
    );
};

export default HodApplications;