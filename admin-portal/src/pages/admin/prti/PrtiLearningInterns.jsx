import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import {
    CheckCircle, FileText, Loader2, AlertCircle,
    ChevronDown, ChevronUp, MessageSquare, Send, Eye, X, Users, Play, UserCheck
} from 'lucide-react';

const locName = l => (typeof l === 'string' ? l : (l?.name || ''));

const MEDIA_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

const STAGE_STYLE = {
    SUBMITTED:           'bg-slate-100  text-slate-600  border-slate-200',
    SELECTED:            'bg-indigo-100 text-indigo-700 border-indigo-200',
    DOCUMENTS_PENDING:   'bg-amber-100  text-amber-700  border-amber-200',
    DOCUMENTS_VERIFIED:  'bg-teal-100   text-teal-700   border-teal-200',
    HIRED:               'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED:            'bg-red-100    text-red-600    border-red-200',
};

const STAGE_LABELS = {
    SUBMITTED: 'Applied', SELECTED: 'HOD Selected', DOCUMENTS_PENDING: 'Docs Requested',
    DOCUMENTS_VERIFIED: 'Docs Verified', HIRED: 'Hired', REJECTED: 'Rejected'
};

// ── PRTI feedback note ────────────────────────────────────────────────────────
const PrtiNoteEditor = ({ app, onSaved }) => {
    const [open, setOpen]     = useState(false);
    const [note, setNote]     = useState(app.prtiNote || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/applications/${app.id}/prti-note`, { note });
            onSaved(note);
            setOpen(false);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    return (
        <div>
            {!open ? (
                <button onClick={() => setOpen(true)}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        app.prtiNote ? 'text-amber-600 hover:text-amber-800' : 'text-slate-400 hover:text-primary'}`}>
                    <MessageSquare size={12} />
                    {app.prtiNote ? 'Edit PRTI Note' : '+ Add Feedback for HOD'}
                </button>
            ) : (
                <div className="space-y-2 mt-2">
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                        rows={2} placeholder="Write feedback or instruction for the HOD…"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                    <div className="flex gap-2">
                        <button onClick={save} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50">
                            {saving ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Save
                        </button>
                        <button onClick={() => { setOpen(false); setNote(app.prtiNote || ''); }}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                    </div>
                </div>
            )}
            {!open && app.prtiNote && (
                <p className="mt-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                    "{app.prtiNote}"
                </p>
            )}
        </div>
    );
};

// ── Inline select panel for PRTI ─────────────────────────────────────────────
const PrtiSelectPanel = ({ app, fieldLocations, locationFilledMap = {}, onConfirm, onCancel, saving }) => {
    const [location, setLocation] = useState(app.preferredLocation || locName(fieldLocations[0]) || '');

    const selected = fieldLocations.find(l => locName(l) === location);
    const totalVac = typeof selected === 'object' ? (selected?.vacancies ?? null) : null;
    const filled   = locationFilledMap[location] || 0;
    const remaining = totalVac !== null ? totalVac - filled : null;
    const isFull    = remaining !== null && remaining <= 0;

    return (
        <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl space-y-2">
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Assign Location</p>
            <div className="space-y-1.5">
                {fieldLocations.map(l => {
                    const name   = locName(l);
                    const total  = typeof l === 'object' ? (l?.vacancies ?? null) : null;
                    const gone   = locationFilledMap[name] || 0;
                    const left   = total !== null ? total - gone : null;
                    const full   = left !== null && left <= 0;
                    const nearly = left !== null && left > 0 && left <= Math.ceil((total || 1) * 0.25);
                    return (
                        <label key={name}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors
                                ${full ? 'opacity-50 cursor-not-allowed border-red-200 bg-red-50' :
                                  location === name ? 'border-indigo-400 bg-indigo-100' :
                                  'border-slate-200 bg-white hover:border-indigo-300'}`}>
                            <div className="flex items-center gap-2">
                                <input type="radio" name="prti-loc" value={name} checked={location === name}
                                    disabled={full}
                                    onChange={() => !full && setLocation(name)}
                                    className="accent-indigo-600" />
                                <span className="text-xs font-bold text-slate-700">{name}</span>
                            </div>
                            {total !== null && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border
                                    ${full    ? 'bg-red-100 text-red-600 border-red-200' :
                                      nearly  ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                               'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {left}/{total} available
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
            {isFull && (
                <p className="text-[10px] font-bold text-red-600">All seats for this location are filled.</p>
            )}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => onConfirm(location)}
                    disabled={saving || !location || isFull}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                >
                    {saving ? <Loader2 size={10} className="animate-spin" /> : <UserCheck size={10} />}
                    Confirm Selection
                </button>
                <button onClick={onCancel} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
        </div>
    );
};

// ── Field group with PRTI controls ────────────────────────────────────────────
const FieldGroup = ({ fieldName, fieldId, apps, onOverride, onSelect, onBulkProceed, onNoteUpdate }) => {
    const [open, setOpen]          = useState(true);
    const [proceeding, setProceed] = useState(false);
    const [selectingAppId, setSelectingAppId] = useState(null);
    const [selectSaving, setSelectSaving]     = useState(false);

    const selectedApps    = apps.filter(a => a.status === 'SELECTED');
    const submittedApps   = apps.filter(a => a.status === 'SUBMITTED');
    const docsApps        = apps.filter(a => ['DOCUMENTS_PENDING','DOCUMENTS_VERIFIED'].includes(a.status));
    const hiredApps       = apps.filter(a => ['HIRED','ONGOING','COMPLETED'].includes(a.status));
    const rejectedApps    = apps.filter(a => a.status === 'REJECTED');

    const fieldLocations = (() => {
        const raw = apps.find(a => a.field?.locations)?.field?.locations;
        return Array.isArray(raw) ? raw : [];
    })();

    const SEAT_CONSUMING = ['SELECTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'HIRED', 'ONGOING', 'COMPLETED'];
    const locationFilledMap = {};
    apps.forEach(a => {
        if (SEAT_CONSUMING.includes(a.status) && a.preferredLocation) {
            locationFilledMap[a.preferredLocation] = (locationFilledMap[a.preferredLocation] || 0) + 1;
        }
    });

    // True when every location with defined vacancies is full — hide Select buttons entirely
    const allLocationsFull = fieldLocations.length > 0 && fieldLocations.every(l => {
        const name  = locName(l);
        const total = typeof l === 'object' ? (l?.vacancies ?? null) : null;
        if (total === null) return false;
        return (locationFilledMap[name] || 0) >= total;
    });

    const handlePrtiSelect = async (app, location) => {
        setSelectSaving(true);
        try {
            await onSelect(app.id, app.field?.id, location);
            setSelectingAppId(null);
        } catch { /* error shown by parent */ }
        finally { setSelectSaving(false); }
    };

    const handleProceed = async () => {
        if (selectedApps.length === 0) return;
        if (!window.confirm(`Approve ${selectedApps.length} selected candidate(s) for ${fieldName}? HOD will then be able to request joining documents from them.`)) return;
        setProceed(true);
        try {
            await api.post('/admin/applications/prti-approve-batch', {
                applicationIds: selectedApps.map(a => a.id)
            });
            onBulkProceed();
            alert(`${selectedApps.length} selection(s) approved. HOD can now request documents.`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve.');
        } finally { setProceed(false); }
    };

    const totalVacancies = apps[0]?.field?.vacancies || 0;

    return (
        <div className="border border-outline-variant/15 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <button type="button" onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-sm font-black text-primary dark:text-slate-100">{fieldName}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{apps.length} total · {hiredApps.length}/{totalVacancies} hired</span>
                </div>
                <div className="flex items-center gap-3">
                    {selectedApps.length > 0 && (
                        <button onClick={e => { e.stopPropagation(); handleProceed(); }} disabled={proceeding}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                            {proceeding ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                            Approve Selections ({selectedApps.length})
                        </button>
                    )}
                    {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-outline-variant/10">
                    {/* HOD Selections — PRTI can unselect */}
                    {selectedApps.length > 0 && (
                        <div className="px-5 py-4 bg-indigo-50/40 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800">
                            <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-3">
                                HOD Selections ({selectedApps.length})
                            </p>
                            <div className="space-y-2">
                                {selectedApps.map(app => (
                                    <div key={app.id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-xs shrink-0">
                                                {app.student?.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{app.student?.fullName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
                                                    {app.student?.collegeName} · CGPA {app.student?.cgpa?.toFixed(2)} · {app.preferredLocation || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STAGE_STYLE[app.status]}`}>
                                                {STAGE_LABELS[app.status]}
                                            </span>
                                            {app.prtiApproved && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    ✓ PRTI Approved
                                                </span>
                                            )}
                                            <button onClick={() => onOverride(app.id)}
                                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded-lg hover:bg-amber-600 hover:text-white transition-colors border border-amber-200" title="Return to pool — HOD can select someone else">
                                                <X size={10} /> Unselect
                                            </button>
                                            <PrtiNoteEditor app={app} onSaved={note => onNoteUpdate(app.id, note)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Applicant Pool — PRTI can select directly */}
                    {submittedApps.length > 0 && (
                        <div className="px-5 py-4 bg-slate-50/60 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                                Applicant Pool ({submittedApps.length})
                            </p>
                            <div className="space-y-2">
                                {submittedApps.map(app => (
                                    <div key={app.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs shrink-0">
                                                    {app.student?.fullName?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{app.student?.fullName}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
                                                        {app.student?.collegeName} · CGPA {app.student?.cgpa?.toFixed(2)} · Applied: {app.preferredLocation || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STAGE_STYLE[app.status]}`}>
                                                    {STAGE_LABELS[app.status]}
                                                </span>
                                                {selectingAppId !== app.id && !allLocationsFull && (
                                                    <button
                                                        onClick={() => setSelectingAppId(app.id)}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-200"
                                                    >
                                                        <UserCheck size={10} /> Select
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {selectingAppId === app.id && (
                                            <PrtiSelectPanel
                                                app={app}
                                                fieldLocations={fieldLocations}
                                                locationFilledMap={locationFilledMap}
                                                saving={selectSaving}
                                                onConfirm={loc => handlePrtiSelect(app, loc)}
                                                onCancel={() => setSelectingAppId(null)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Docs / Hired section (view only) */}
                    {[...docsApps, ...hiredApps].length > 0 && (
                        <div className="px-5 py-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                In Progress ({docsApps.length + hiredApps.length})
                            </p>
                            <div className="space-y-1.5">
                                {[...docsApps, ...hiredApps].map(app => (
                                    <div key={app.id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{app.student?.fullName}</span>
                                            <span className="text-[9px] text-slate-400 truncate hidden sm:block">{app.student?.collegeName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {app.student?.rollNumber && (
                                                <span className="font-mono text-[9px] font-black text-primary/60 bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded">
                                                    {app.student.rollNumber}
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STAGE_STYLE[app.status]}`}>
                                                {STAGE_LABELS[app.status]}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rejected */}
                    {rejectedApps.length > 0 && (
                        <div className="px-5 py-3 border-t border-outline-variant/10">
                            <p className="text-[10px] font-bold text-red-500 uppercase">{rejectedApps.length} rejected</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const PrtiLearningInterns = () => {
    const [apps, setApps]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter]   = useState('ALL');

    const fetchApps = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all NON_STIPEND internships then all their applications
            const intRes = await api.get('/admin/internships?limit=100');
            const internships = (intRes.data.data || []).filter(i => i.internshipType === 'NON_STIPEND');
            const settled = await Promise.allSettled(
                internships.map(i => api.get(`/admin/internships/${i.id}/applications?limit=500`))
            );
            const all = settled
                .filter(r => r.status === 'fulfilled')
                .flatMap(r => r.value.data.data || []);
            setApps(all);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const handleOverride = async (appId) => {
        if (!window.confirm('Return this candidate to the applicant pool? They will go back to SUBMITTED status — HOD can then pick someone else.')) return;
        try {
            await api.put(`/admin/applications/${appId}`, { status: 'SUBMITTED' });
            fetchApps();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleNoteUpdate = (appId, note) => {
        setApps(prev => prev.map(a => a.id === appId ? { ...a, prtiNote: note } : a));
    };

    const handleSelect = async (appId, fieldId, location) => {
        try {
            await api.put(`/admin/applications/${appId}`, {
                status: 'SELECTED',
                ...(fieldId && { fieldId }),
                ...(location && { preferredLocation: location }),
            });
            fetchApps();
        } catch (err) {
            alert(err.response?.data?.message || 'Selection failed');
            throw err;
        }
    };

    // Group by internship → field
    const grouped = {};
    apps.forEach(app => {
        const intId  = app.internship?.id || 'unknown';
        const intTitle = app.internship?.title || 'Unknown';
        if (!grouped[intId]) grouped[intId] = { title: intTitle, dept: app.departmentGroup?.department || app.internship?.department, fields: {} };
        const fKey   = app.field?.id || 'no-field';
        const fLabel = app.field?.fieldName || 'General';
        if (!grouped[intId].fields[fKey]) grouped[intId].fields[fKey] = { label: fLabel, apps: [] };
        grouped[intId].fields[fKey].apps.push(app);
    });

    const FILTER_OPTS = [
        { key: 'ALL', label: 'All', count: apps.length },
        { key: 'SUBMITTED', label: 'Pending', count: apps.filter(a => a.status === 'SUBMITTED').length },
        { key: 'SELECTED', label: 'HOD Selected', count: apps.filter(a => a.status === 'SELECTED').length },
        { key: 'DOCUMENTS_PENDING', label: 'Docs Pending', count: apps.filter(a => a.status === 'DOCUMENTS_PENDING').length },
        { key: 'HIRED', label: 'Hired', count: apps.filter(a => ['HIRED','ONGOING','COMPLETED'].includes(a.status)).length },
    ];

    const applyFilter = (fieldApps) => {
        if (filter === 'ALL') return fieldApps;
        if (filter === 'HIRED') return fieldApps.filter(a => ['HIRED','ONGOING','COMPLETED'].includes(a.status));
        return fieldApps.filter(a => a.status === filter);
    };

    const selectedTotal = apps.filter(a => a.status === 'SELECTED').length;

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-8">
            <header>
                <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">PRTI Oversight</span>
                <h1 className="text-3xl font-black text-primary tracking-tight">Learning Intern Pipeline</h1>
                <p className="text-sm text-outline/60 font-medium mt-1">
                    Review HOD selections. Override if needed or proceed to request documents.
                </p>
            </header>

            {/* KPI strip */}
            <div className="flex flex-wrap gap-3">
                {FILTER_OPTS.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        className={`px-4 py-2.5 rounded-xl border text-left transition-all ${filter === f.key ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 border-outline-variant/20 hover:border-primary/30'}`}>
                        <p className={`text-xl font-black ${filter === f.key ? 'text-white' : 'text-primary'}`}>{f.count}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${filter === f.key ? 'text-white/70' : 'text-outline'}`}>{f.label}</p>
                    </button>
                ))}
            </div>

            {selectedTotal > 0 && (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl">
                    <AlertCircle size={18} className="text-indigo-600 shrink-0" />
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                        {selectedTotal} candidate{selectedTotal !== 1 ? 's' : ''} selected by HODs are awaiting PRTI review. Click <strong>Proceed — Request Docs</strong> per field to send document requests, or <strong>Override</strong> to reject a selection.
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-primary/30" /></div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([intId, intData]) => (
                        <div key={intId}>
                            <div className="flex items-center gap-3 mb-3">
                                <h2 className="text-sm font-black text-primary">{intData.title}</h2>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{intData.dept}</span>
                            </div>
                            <div className="space-y-3">
                                {Object.entries(intData.fields).map(([fKey, fData]) => {
                                    const filtered = applyFilter(fData.apps);
                                    if (filtered.length === 0 && filter !== 'ALL') return null;
                                    return (
                                        <FieldGroup
                                            key={fKey}
                                            fieldName={fData.label}
                                            fieldId={fKey}
                                            apps={filtered.length > 0 ? filtered : fData.apps}
                                            onOverride={handleOverride}
                                            onSelect={handleSelect}
                                            onBulkProceed={fetchApps}
                                            onNoteUpdate={handleNoteUpdate}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {Object.keys(grouped).length === 0 && (
                        <div className="py-20 text-center border border-dashed border-outline-variant/30 rounded-2xl">
                            <CheckCircle size={36} className="text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">No NON_STIPEND internship applications found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrtiLearningInterns;
