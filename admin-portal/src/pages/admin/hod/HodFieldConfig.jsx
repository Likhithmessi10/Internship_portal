import { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
    CheckCircle, XCircle, Loader2, Plus, AlertCircle, Settings
} from 'lucide-react';

const PRESET_SPECIALIZATIONS = [
    'Electrical Engineering', 'Power Systems', 'Substation Engineering', 'SCADA', 'Protection Relays',
    'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Computer Science',
    'Electronics & Communication', 'Instrumentation', 'Human Resources', 'Finance & Accounts',
    'Legal', 'Administration', 'Telecom'
];

// ── Field card ────────────────────────────────────────────────────────────────
const FieldCard = ({ field, deptId, onRefresh }) => {
    const [specs, setSpecs]           = useState(Array.isArray(field.specializations) ? field.specializations : []);
    const [specInput, setSpecInput]   = useState('');
    const [savingSpecs, setSavingSpecs] = useState(false);
    const [toggling, setToggling]     = useState(false);

    const saveSpecs = async () => {
        setSavingSpecs(true);
        try {
            await api.put(`/admin/dept-master/${deptId}/fields/${field.id}`, { specializations: specs });
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save.');
        } finally { setSavingSpecs(false); }
    };

    const handleToggle = async () => {
        setToggling(true);
        try {
            await api.put(`/admin/dept-master/${deptId}/fields/${field.id}`, { isActive: !field.isActive });
            onRefresh();
        } catch { alert('Failed to update.'); }
        finally { setToggling(false); }
    };

    const addSpec = (val) => {
        const v = val.trim();
        if (v && !specs.includes(v)) setSpecs(s => [...s, v]);
        setSpecInput('');
    };

    return (
        <div className={`border rounded-2xl p-5 space-y-4 transition-all ${field.isActive ? 'border-outline-variant/15 bg-white dark:bg-slate-900' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/40 opacity-60'}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-black text-primary/60 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                            {field.fieldCode}
                        </span>
                        {field.isActive
                            ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase border border-emerald-200"><CheckCircle size={9} /> Active</span>
                            : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase border border-slate-200"><XCircle size={9} /> Inactive</span>}
                    </div>
                    <h3 className="text-base font-black text-primary dark:text-slate-100">{field.fieldName}</h3>
                    <p className="text-[10px] font-bold text-outline/50 uppercase mt-0.5">Field #{field.fieldNumber}</p>
                </div>
                <button onClick={handleToggle} disabled={toggling}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all disabled:opacity-50 shrink-0 ${
                        field.isActive
                            ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}>
                    {toggling ? <Loader2 size={11} className="animate-spin inline" /> : field.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>

            {/* Specializations editor */}
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-outline/60">
                    Target Specializations
                    <span className="ml-1.5 text-slate-400 normal-case tracking-normal font-medium">— students with matching branch see this field highlighted</span>
                </p>

                <div className="flex gap-2">
                    <select value="" onChange={e => e.target.value && addSpec(e.target.value)}
                        className="text-xs border border-outline-variant/20 dark:border-slate-600 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1">
                        <option value="">Select from presets…</option>
                        {PRESET_SPECIALIZATIONS.filter(s => !specs.includes(s)).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <input value={specInput} onChange={e => setSpecInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec(specInput))}
                        placeholder="or type custom…"
                        className="text-xs border border-outline-variant/20 dark:border-slate-600 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1" />
                    <button type="button" onClick={() => addSpec(specInput)}
                        className="px-4 bg-primary/10 text-primary rounded-xl font-bold text-[10px] uppercase hover:bg-primary/20 transition-all">
                        Add
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                    {specs.length === 0
                        ? <span className="text-[10px] text-slate-400 font-medium italic">No specializations set — all students will see this field equally</span>
                        : specs.map((s, i) => (
                            <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-[10px] font-bold border border-violet-200 dark:border-violet-700 rounded-lg">
                                {s}
                                <button onClick={() => setSpecs(prev => prev.filter((_, idx) => idx !== i))}
                                    className="text-violet-400 hover:text-red-500 font-black ml-0.5">×</button>
                            </span>
                        ))
                    }
                </div>

                <button onClick={saveSpecs} disabled={savingSpecs}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm">
                    {savingSpecs ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                    Save Specializations
                </button>
            </div>
        </div>
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
            setError(err.response?.data?.message || 'Failed to add field.');
        } finally { setSaving(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-outline-variant/20 dark:border-slate-600 rounded-2xl space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-outline/60">Add New Field</p>
            {error && <p className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline/50 mb-1 block">Field Name</label>
                    <input value={fieldName} onChange={e => setFieldName(e.target.value)}
                        placeholder="e.g. Grid Operations"
                        className="w-full border border-outline-variant/20 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required />
                    {preview && <p className="text-[10px] text-outline/40 font-mono mt-1">Code preview: <strong>{preview}</strong></p>}
                </div>
                <button type="button" onClick={onCancel}
                    className="px-4 py-2.5 text-sm font-bold text-outline/50 hover:text-outline transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !fieldName.trim()}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Field
                </button>
            </div>
            <p className="text-[9px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-1.5 font-bold">
                ⚠ Field codes and numbers are permanent — they protect roll number integrity and cannot be changed after creation.
            </p>
        </form>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const HodFieldConfig = () => {
    const { user } = useAuth();
    const [dept, setDept]         = useState(null);
    const [fields, setFields]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [showAdd, setShowAdd]   = useState(false);

    const fetchFields = useCallback(async () => {
        setLoading(true);
        try {
            const deptRes = await api.get('/admin/dept-master');
            const depts = deptRes.data.data || [];
            const myDept = depts.find(d =>
                d.code?.toUpperCase() === user?.department?.toUpperCase() ||
                d.name?.toUpperCase() === user?.department?.toUpperCase()
            );
            if (!myDept) { setLoading(false); return; }

            setDept(myDept);
            const fieldRes = await api.get(`/admin/dept-master/${myDept.id}/fields?all=true`);
            setFields(fieldRes.data.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [user?.department]);

    useEffect(() => { fetchFields(); }, [fetchFields]);

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary/30" />
        </div>
    );

    if (!dept) return (
        <div className="max-w-2xl mx-auto py-20 text-center">
            <AlertCircle size={36} className="text-amber-400 mx-auto mb-3" />
            <p className="font-bold text-outline uppercase text-sm tracking-widest">Your department is not configured in the master yet.</p>
            <p className="text-xs text-outline/50 mt-1">Contact PRTI to initialise your department in the Master Field Configuration.</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto pb-20 space-y-8">
            <header>
                <span className="text-[10px] font-bold tracking-widest text-outline uppercase mb-1 block">Department Configuration</span>
                <h1 className="text-3xl font-black text-primary tracking-tight flex items-center gap-3">
                    <Settings size={26} /> {dept.name} — Field Configuration
                </h1>
                <p className="text-sm text-outline/60 font-medium mt-1">
                    Manage the learning fields for your department. Specializations determine which students see your fields highlighted.
                </p>
            </header>

            {/* Dept meta */}
            <div className="flex gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <div className="text-center px-4 border-r border-outline-variant/10">
                    <p className="text-2xl font-black text-primary">#{String(dept.deptNumber).padStart(2, '0')}</p>
                    <p className="text-[9px] font-bold text-outline uppercase">Dept No.</p>
                </div>
                <div className="text-center px-4 border-r border-outline-variant/10">
                    <p className="text-2xl font-black text-primary">{dept.code}</p>
                    <p className="text-[9px] font-bold text-outline uppercase">Code</p>
                </div>
                <div className="text-center px-4">
                    <p className="text-2xl font-black text-primary">{fields.filter(f => f.isActive).length}</p>
                    <p className="text-[9px] font-bold text-outline uppercase">Active Fields</p>
                </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
                {fields.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-outline-variant/20 rounded-2xl">
                        <p className="font-bold text-outline uppercase text-sm tracking-widest">No fields configured yet.</p>
                        <p className="text-xs text-outline/50 mt-1">Add your first field below.</p>
                    </div>
                ) : (
                    fields.map(f => (
                        <FieldCard key={f.id} field={f} deptId={dept.id} onRefresh={fetchFields} />
                    ))
                )}
            </div>

            {/* Add field */}
            {showAdd ? (
                <AddFieldForm
                    deptId={dept.id}
                    deptCode={dept.code}
                    onAdded={() => { setShowAdd(false); fetchFields(); }}
                    onCancel={() => setShowAdd(false)}
                />
            ) : (
                <button onClick={() => setShowAdd(true)}
                    className="w-full py-4 border-2 border-dashed border-primary/20 text-primary rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 flex items-center justify-center gap-2 transition-colors">
                    <Plus size={14} /> Add New Field
                </button>
            )}
        </div>
    );
};

export default HodFieldConfig;
