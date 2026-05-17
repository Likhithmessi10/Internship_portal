import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import {
    Plus, ChevronDown, ChevronUp, CheckCircle, XCircle,
    Loader2, AlertCircle, BookOpen, Tag, Trash2
} from 'lucide-react';
import departmentsData from '../../../data/departments.json';

const PRESET_SPECIALIZATIONS = [
    'Electrical Engineering', 'Power Systems', 'Substation Engineering', 'SCADA', 'Protection Relays',
    'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Computer Science',
    'Electronics & Communication', 'Instrumentation', 'Human Resources', 'Finance & Accounts',
    'Legal', 'Administration', 'Telecom'
];

// ── Field row ─────────────────────────────────────────────────────────────────
const FieldRow = ({ field, deptId, onToggle, onDelete }) => {
    const [toggling, setToggling]     = useState(false);
    const [deleting, setDeleting]     = useState(false);
    const [editingSpecs, setEditingSpecs] = useState(false);
    const [specs, setSpecs]           = useState(Array.isArray(field.specializations) ? field.specializations : []);
    const [specInput, setSpecInput]   = useState('');
    const [savingSpecs, setSavingSpecs] = useState(false);

    const handleToggle = async () => {
        setToggling(true);
        try {
            await api.put(`/admin/dept-master/${deptId}/fields/${field.id}`, { isActive: !field.isActive });
            onToggle();
        } catch {
            alert('Failed to update field status.');
        } finally { setToggling(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete field "${field.fieldName}" (${field.fieldCode})? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/dept-master/${deptId}/fields/${field.id}`);
            onDelete();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete field.');
        } finally { setDeleting(false); }
    };

    const saveSpecsDirectly = async (newSpecs) => {
        setSavingSpecs(true);
        try {
            await api.put(`/admin/dept-master/${deptId}/fields/${field.id}`, { specializations: newSpecs });
            onToggle();
        } catch { alert('Failed to save specializations.'); }
        finally { setSavingSpecs(false); }
    };

    const addSpec = (val) => {
        const v = val.trim();
        if (!v || specs.includes(v)) { setSpecInput(''); return; }
        const newSpecs = [...specs, v];
        setSpecs(newSpecs);
        setSpecInput('');
        saveSpecsDirectly(newSpecs);
    };

    const removeSpec = (idx) => {
        const newSpecs = specs.filter((_, i) => i !== idx);
        setSpecs(newSpecs);
        saveSpecsDirectly(newSpecs);
    };

    return (
        <>
        <tr className={`border-b border-outline-variant/10 transition-colors ${field.isActive ? '' : 'opacity-50'}`}>
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary/60 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded font-mono">
                    {field.fieldCode}
                </span>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm font-bold text-slate-800">{field.fieldName}</p>
                {specs.length > 0 && !editingSpecs && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {specs.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-bold rounded border border-violet-200">{s}</span>
                        ))}
                    </div>
                )}
            </td>
            <td className="px-4 py-3 text-[10px] font-black text-outline uppercase tracking-widest">#{field.fieldNumber}</td>
            <td className="px-4 py-3">
                {field.isActive
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase border border-emerald-200"><CheckCircle size={9} /> Active</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase border border-slate-200"><XCircle size={9} /> Inactive</span>}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingSpecs(v => !v)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-all">
                        {specs.length > 0 ? `${specs.length} Specs` : '+ Specs'}
                    </button>
                    <button onClick={handleToggle} disabled={toggling || deleting}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                            field.isActive ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}>
                        {toggling ? <Loader2 size={11} className="animate-spin inline" /> : field.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={handleDelete} disabled={deleting || toggling}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50">
                        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                </div>
            </td>
        </tr>
        {editingSpecs && (
            <tr className="border-b border-violet-100 bg-violet-50/40">
                <td colSpan={5} className="px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-2">
                        Specializations for {field.fieldName} — students with matching branch will see this field highlighted
                    </p>
                    <div className="flex gap-2 mb-2">
                        <select value="" onChange={e => e.target.value && addSpec(e.target.value)}
                            className="text-xs border border-violet-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none flex-1 max-w-xs">
                            <option value="">Add from presets…</option>
                            {PRESET_SPECIALIZATIONS.filter(s => !specs.includes(s)).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <input value={specInput} onChange={e => setSpecInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec(specInput))}
                            placeholder="or type custom…"
                            className="text-xs border border-violet-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none flex-1 max-w-xs" />
                        <button type="button" onClick={() => addSpec(specInput)}
                            className="px-3 py-1.5 bg-violet-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-violet-700">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {specs.map((s, i) => (
                            <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-white text-violet-700 text-[10px] font-bold border border-violet-300 rounded-lg">
                                {s}
                                <button onClick={() => removeSpec(i)} disabled={savingSpecs} className="text-violet-400 hover:text-red-500 font-black disabled:opacity-40">×</button>
                            </span>
                        ))}
                        {specs.length === 0 && <span className="text-[10px] text-slate-400 font-bold">No specializations yet — all students will see this field</span>}
                        {savingSpecs && <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Loader2 size={10} className="animate-spin" /> Saving…</span>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingSpecs(false)}
                            className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600">Done</button>
                    </div>
                </td>
            </tr>
        )}
        </>
    );
};

// ── Add field form ────────────────────────────────────────────────────────────
const AddFieldForm = ({ deptId, deptCode, onAdded, onCancel }) => {
    const [fieldName, setFieldName] = useState('');
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    const preview = fieldName.trim()
        ? `${deptCode}-${fieldName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}-XXX`
        : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fieldName.trim()) return;
        setSaving(true);
        setError('');
        try {
            await api.post(`/admin/dept-master/${deptId}/fields`, { fieldName: fieldName.trim() });
            setFieldName('');
            onAdded();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add field');
        } finally { setSaving(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Field (Append-Only)</p>
            {error && <p className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Field Name</label>
                    <input
                        value={fieldName}
                        onChange={e => setFieldName(e.target.value)}
                        placeholder="e.g. Grid Operations"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                    />
                    {preview && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Code preview: <strong>{preview}</strong></p>
                    )}
                </div>
                <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !fieldName.trim()}
                    className="px-5 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                </button>
            </div>
            <p className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 font-bold uppercase">
                ⚠ Fields are append-only. Field codes and numbers are immutable to protect roll number integrity.
            </p>
        </form>
    );
};

// ── Department accordion card ─────────────────────────────────────────────────
const DeptCard = ({ dept, onRefresh }) => {
    const [open, setOpen]         = useState(false);
    const [showAddField, setShowAddField] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const activeFields   = dept.fields.filter(f => f.isActive).length;
    const inactiveFields = dept.fields.filter(f => !f.isActive).length;

    const handleToggleDept = async () => {
        setToggling(true);
        try {
            await api.put(`/admin/dept-master/${dept.id}`, { isActive: !dept.isActive });
            onRefresh();
        } catch {
            alert('Failed to update department.');
        } finally { setToggling(false); }
    };

    const handleDeleteDept = async (e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete department "${dept.name}"? All its fields will also be deleted. This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/dept-master/${dept.id}`);
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete department.');
        } finally { setDeleting(false); }
    };

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all ${dept.isActive ? 'border-outline-variant/15' : 'border-slate-200 opacity-60'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${dept.isActive ? 'bg-surface-container-low hover:bg-surface-container' : 'bg-slate-50'}`}
                onClick={() => setOpen(v => !v)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm shrink-0">
                        #{String(dept.deptNumber).padStart(2, '0')}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-primary">{dept.name}</h3>
                            <span className="font-mono text-[10px] text-outline/50 bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/10">{dept.code}</span>
                            {!dept.isActive && <span className="text-[9px] font-black text-slate-400 uppercase">Inactive</span>}
                        </div>
                        <p className="text-[10px] font-bold text-outline/50 uppercase tracking-wider mt-0.5">
                            {activeFields} active field{activeFields !== 1 ? 's' : ''}
                            {inactiveFields > 0 && ` · ${inactiveFields} inactive`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={e => { e.stopPropagation(); handleToggleDept(); }}
                        disabled={toggling || deleting}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                            dept.isActive ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                    >
                        {toggling ? <Loader2 size={11} className="animate-spin inline" /> : dept.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        onClick={handleDeleteDept}
                        disabled={deleting || toggling}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                        title="Delete department"
                    >
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Fields table */}
            {open && (
                <div className="border-t border-outline-variant/10 bg-white">
                    {dept.fields.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400 font-bold">No fields defined yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[500px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-outline-variant/10">
                                        {['Field Code', 'Field Name & Specializations', 'Seq #', 'Status', ''].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-[10px] font-black text-outline uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dept.fields.map(f => (
                                        <FieldRow key={f.id} field={f} deptId={dept.id} onToggle={onRefresh} onDelete={onRefresh} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-5 pb-5">
                        {showAddField ? (
                            <AddFieldForm
                                deptId={dept.id}
                                deptCode={dept.code}
                                onAdded={() => { setShowAddField(false); onRefresh(); }}
                                onCancel={() => setShowAddField(false)}
                            />
                        ) : (
                            <button
                                onClick={() => setShowAddField(true)}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-primary/30 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-colors"
                            >
                                <Plus size={12} /> Add Field
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Uninitialized dept row ────────────────────────────────────────────────────
const UninitializedDeptRow = ({ name, onInitialized }) => {
    const [open, setOpen]     = useState(false);
    const [code, setCode]     = useState(
        name.split(/\s+AND\s+|\s+/)[0].replace(/[^A-Z]/g, '').slice(0, 6)
    );
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    const handleInit = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setSaving(true);
        setError('');
        try {
            await api.post('/admin/dept-master', { name, code: code.trim().toUpperCase() });
            onInitialized();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialise');
        } finally { setSaving(false); }
    };

    return (
        <div className="border border-dashed border-outline-variant/30 rounded-2xl overflow-hidden">
            <div
                className="flex items-center justify-between px-5 py-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400 text-xl">domain</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-600">{name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Not yet in field master</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                        Not Initialized
                    </span>
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {open && (
                <div className="border-t border-dashed border-outline-variant/20 bg-white px-5 py-4">
                    <p className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wide">
                        Initialize this department in the Field Master to start adding fields and assigning roll number codes.
                    </p>
                    <form onSubmit={handleInit} className="flex items-end gap-3">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1 block">Short Code</label>
                            <input
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                maxLength={10}
                                required
                                className="border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm font-bold font-mono w-36 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <p className="text-[9px] text-outline/50 mt-1 font-bold uppercase">Immutable after creation</p>
                        </div>
                        {error && <p className="text-xs font-bold text-red-600 flex items-center gap-1 pb-6"><AlertCircle size={12} /> {error}</p>}
                        <button type="submit" disabled={saving || !code.trim()}
                            className="pb-6 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Initialize
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const PrtiDeptFieldConfig = () => {
    const [masterDepts, setMasterDepts] = useState([]);
    const [configDepts, setConfigDepts] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [showAll, setShowAll]         = useState(true);
    const [showAdd, setShowAdd]         = useState(false);
    const [newDept, setNewDept]         = useState({ name: '', code: '' });
    const [saving, setSaving]           = useState(false);
    const [addError, setAddError]       = useState('');
    const [resequencing, setResequencing] = useState(false);

    const fetchDepts = useCallback(async () => {
        setLoading(true);
        try {
            const [masterRes, configRes] = await Promise.all([
                api.get(`/admin/dept-master?all=true`),
                api.get('/admin/config')
            ]);
            setMasterDepts(masterRes.data.data || []);
            const cfgDepts = configRes.data.data?.departments || [];
            setConfigDepts(cfgDepts.length > 0 ? cfgDepts : departmentsData.departments);
        } catch {
            setMasterDepts([]);
            setConfigDepts(departmentsData.departments);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchDepts(); }, [fetchDepts]);

    // Departments from config NOT yet initialized in master
    const masterNames = new Set(masterDepts.map(d => d.name.toUpperCase()));
    const uninitializedDepts = configDepts.filter(n => !masterNames.has(n.toUpperCase()));

    // Apply showAll filter only to master depts
    const visibleMaster = showAll ? masterDepts : masterDepts.filter(d => d.isActive);

    const handleResequence = async (force = false) => {
        const msg = force
            ? 'FINAL WARNING: Some students already have roll numbers. Re-sequencing will make those roll numbers inconsistent with the new numbering. Proceed?'
            : 'Re-sequence department and field numbers to fill gaps?\n\nThis renumbers all departments (1, 2, 3...) and fields within each department. Only proceed if no students have been hired with Learning Internship roll numbers yet.';
        if (!window.confirm(msg)) return;
        setResequencing(true);
        try {
            await api.post('/admin/dept-master/resequence', { force });
            await fetchDepts();
        } catch (err) {
            const data = err.response?.data;
            if (err.response?.status === 409 && data?.hiredCount) {
                // Offer force option
                if (window.confirm(`${data.message}\n\nDo you want to force re-sequence anyway?`)) {
                    await handleResequence(true);
                }
            } else {
                alert(data?.message || 'Re-sequencing failed.');
            }
        } finally { setResequencing(false); }
    };

    const handleAddDept = async (e) => {
        e.preventDefault();
        if (!newDept.name || !newDept.code) return;
        setSaving(true);
        setAddError('');
        try {
            await api.post('/admin/dept-master', newDept);
            setNewDept({ name: '', code: '' });
            setShowAdd(false);
            fetchDepts();
        } catch (err) {
            setAddError(err.response?.data?.message || 'Failed to create department');
        } finally { setSaving(false); }
    };

    const totalFields  = masterDepts.reduce((s, d) => s + d.fields.length, 0);
    const activeFields = masterDepts.reduce((s, d) => s + d.fields.filter(f => f.isActive).length, 0);

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-8">
            {/* Header */}
            <header>
                <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">Learning Internship Configuration</span>
                <h1 className="text-3xl font-black text-primary tracking-tight">Department & Field Master</h1>
                <p className="text-sm text-outline/60 font-medium mt-1">
                    Configure departments and their fields. Fields are <strong>append-only</strong> — codes and numbers are immutable to ensure roll number stability.
                </p>
            </header>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Departments', value: masterDepts.filter(d => d.isActive).length, icon: <BookOpen size={16} className="text-primary" /> },
                    { label: 'Total Fields', value: totalFields, icon: <Tag size={16} className="text-indigo-500" /> },
                    { label: 'Active Fields', value: activeFields, icon: <CheckCircle size={16} className="text-emerald-500" /> },
                ].map((s, i) => (
                    <div key={i} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center gap-3">
                        {s.icon}
                        <div>
                            <p className="text-2xl font-black text-slate-800">{s.value}</p>
                            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded" />
                    Show inactive departments & fields
                </label>
                <button
                    onClick={() => setShowAdd(v => !v)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus size={14} /> New Department
                </button>
            </div>

            {/* Add brand-new department form */}
            {showAdd && (
                <form onSubmit={handleAddDept} className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl space-y-4 animate-in fade-in duration-200">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <Plus size={14} /> New Department (not in existing list)
                    </h3>
                    {addError && <p className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {addError}</p>}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1 block">Department Name</label>
                            <input value={newDept.name} onChange={e => setNewDept(v => ({ ...v, name: e.target.value }))}
                                placeholder="e.g. FINANCE" required
                                className="w-full border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1 block">Short Code</label>
                            <input value={newDept.code} onChange={e => setNewDept(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                                placeholder="e.g. FIN" maxLength={10} required
                                className="w-full border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            <p className="text-[9px] text-outline/50 mt-1 font-bold uppercase">Used in field codes — immutable after creation</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => { setShowAdd(false); setAddError(''); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create Department
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-primary/30" />
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Initialized (master) departments */}
                    {visibleMaster.map(dept => (
                        <DeptCard key={dept.id} dept={dept} onRefresh={fetchDepts} />
                    ))}

                    {/* Uninitialized departments from existing config */}
                    {uninitializedDepts.length > 0 && (
                        <>
                            {visibleMaster.length > 0 && (
                                <div className="flex items-center gap-3 py-2">
                                    <div className="flex-1 h-px bg-outline-variant/20" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {uninitializedDepts.length} department{uninitializedDepts.length > 1 ? 's' : ''} not yet initialized
                                    </span>
                                    <div className="flex-1 h-px bg-outline-variant/20" />
                                </div>
                            )}
                            {uninitializedDepts.map(name => (
                                <UninitializedDeptRow key={name} name={name} onInitialized={fetchDepts} />
                            ))}
                        </>
                    )}

                    {visibleMaster.length === 0 && uninitializedDepts.length === 0 && (
                        <div className="py-24 text-center border border-dashed border-outline-variant/30 rounded-2xl">
                            <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">No departments found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrtiDeptFieldConfig;
