import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { X, Star } from 'lucide-react';
import departmentsData from '../../data/departments.json';
import Select from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';

const PRESET_LOCATIONS = [
    'ANY', 'Vijayawada HQ', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Kurnool',
    'Rajahmundry', 'Nellore', 'Kadapa', 'Anantapur', 'Eluru'
];

const InputField = ({ label, required, hint, children, tooltip, error }) => (
    <div className={`space-y-1.5 ${error ? 'animate-shake' : ''}`}>
        <label className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2 ${error ? 'text-error' : 'text-outline'}`}>
            {label} {required && <span className="text-error">*</span>}
            {tooltip && (
                <div className="group relative cursor-help">
                    <span className="material-symbols-outlined text-sm text-outline/50">info</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl font-medium">
                        {tooltip}
                    </div>
                </div>
            )}
        </label>
        <div className={`transition-all ${error ? 'ring-2 ring-error/20 border-error rounded-lg' : ''}`}>
            {children}
        </div>
        {hint && <p className={`text-[9px] font-bold uppercase tracking-tighter mt-1 ${error ? 'text-error' : 'text-outline/70'}`}>{hint}</p>}
    </div>
);

const CreateInternshipForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState([]);
    const [step, setStep] = useState(1);

    const [departments, setDepartments] = useState(departmentsData.departments);
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingBatches(true);
                const [configRes, batchesRes] = await Promise.all([
                    api.get('/admin/config'),
                    api.get('/admin/batches')
                ]);
                const configDepts = configRes.data.data?.departments || [];
                setDepartments(configDepts.length > 0 ? configDepts : departmentsData.departments);
                setBatches(batchesRes.data.data || []);
            } catch {
                setDepartments(departmentsData.departments);
            } finally {
                setLoadingBatches(false);
            }
        };
        fetchData();
    }, []);

    React.useEffect(() => {
        if (user && (user.role === 'HOD' || user.role === 'MENTOR') && user.department) {
            setFormData(prev => ({ ...prev, department: user.department }));
        }
    }, [user, user?.department]);

    // ─── Form state ──────────────────────────────────────────────────────────
    const [formData, setFormData] = useState({
        batchId: '',
        title: '',
        department: '',
        description: '',
        requirements: '',
        expectations: '',
        duration: '',
        applicationDeadline: '',
        stipendType: 'NON_COLLABORATIVE',
        manualOpenings: '',
        customQuestions: [],
        requirementTags: [],
        preferredColleges: [],
        quotaPercentages: { preferred: 20, premier: 30, normal: 50 },
        internshipType: 'NON_STIPEND',
        internshipMode: 'SINGLE',
        fields: [],
        participatingDepts: [],  // GROUP mode only
        shortlistingRatio: 2     // 1:N — for every 1 opening, shortlist N candidates per tier
    });

    const isGroup = formData.internshipMode === 'GROUP';
    const totalSteps = isGroup ? 3 : 5;

    // ─── Sub-states (SINGLE mode) ─────────────────────────────────────────────
    const [fieldInput, setFieldInput] = useState({ fieldName: '', description: '', vacancies: '', locations: [] });
    const [locationInput, setLocationInput] = useState('');
    const [locations, setLocations] = useState([]);
    const [questionInput, setQuestionInput] = useState('');
    const [requirementInput, setRequirementInput] = useState('');
    const [preferredCollegeInput, setPreferredCollegeInput] = useState('');
    const [roles, setRoles] = useState([]);
    const [roleNameInput, setRoleNameInput] = useState('');
    const [roleOpeningsInput, setRoleOpeningsInput] = useState(1);
    const [requiredDocs, setRequiredDocs] = useState([
        { id: 'RESUME', label: 'Resume / CV', type: 'PDF', mandatory: true },
        { id: 'PASSPORT_PHOTO', label: 'Passport Size Photo', type: 'IMAGE', mandatory: true }
    ]);
    const [docNameInput, setDocNameInput] = useState('');
    const [docTypeInput, setDocTypeInput] = useState('PDF');
    const [docMandatoryInput, setDocMandatoryInput] = useState(true);

    const totalOpenings = roles.reduce((sum, r) => sum + r.openings, 0) || parseInt(formData.manualOpenings) || 0;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (validationErrors.includes(e.target.name)) {
            setValidationErrors(prev => prev.filter(err => err !== e.target.name));
        }
    };

    const parseCommaSeparatedValues = (value) =>
        (value || '').split(',').map(item => item.trim()).filter(Boolean);

    const addRole = () => {
        if (roleNameInput.trim() && roleOpeningsInput > 0) {
            setRoles([...roles, { name: roleNameInput.trim(), openings: parseInt(roleOpeningsInput) }]);
            setRoleNameInput('');
            setRoleOpeningsInput(1);
        }
    };

    const addLocation = (loc) => {
        const val = (loc || locationInput).trim();
        if (!val) return;
        if (val === 'ANY') { setLocations(['ANY']); setLocationInput(''); return; }
        const next = locations.filter(x => x !== 'ANY');
        if (!next.includes(val)) setLocations([...next, val]);
        setLocationInput('');
    };

    const addDoc = () => {
        if (docNameInput.trim()) {
            const id = docNameInput.toUpperCase().replace(/\s+/g, '_') + '_' + Date.now();
            setRequiredDocs([...requiredDocs, { id, label: docNameInput, type: docTypeInput, mandatory: docMandatoryInput }]);
            setDocNameInput('');
            setDocMandatoryInput(true);
        }
    };

    const addRequirement = () => {
        const tags = parseCommaSeparatedValues(requirementInput);
        if (!tags.length) return;
        const existing = new Set(formData.requirementTags.map(t => t.toLowerCase()));
        const unique = tags.filter(t => !existing.has(t.toLowerCase()));
        if (unique.length) setFormData({ ...formData, requirementTags: [...formData.requirementTags, ...unique] });
        setRequirementInput('');
    };

    // ─── Navigation ───────────────────────────────────────────────────────────
    const nextStep = () => {
        const errors = [];

        if (step === 1) {
            if (!formData.batchId) errors.push('batchId');
            if (!formData.title) errors.push('title');
            if (!formData.duration) errors.push('duration');
            if (!formData.description) errors.push('description');
            // SINGLE requires a target department
            if (!isGroup && !formData.department) errors.push('department');
        }

        if (isGroup) {
            if (step === 2 && formData.participatingDepts.length === 0) errors.push('participatingDepts');
        } else {
            if (step === 2 && !formData.manualOpenings) errors.push('manualOpenings');
            if (step === 3) {
                if (formData.internshipType !== 'NON_STIPEND' && roles.length === 0) errors.push('roles');
                if (formData.internshipType === 'NON_STIPEND' && formData.fields.length === 0) errors.push('fields');
            }
            if (step === 4 && requiredDocs.length === 0) errors.push('documents');
        }

        if (errors.length > 0) {
            setValidationErrors(errors);
            setError('Please fill in all mandatory fields highlighted below');
            return;
        }
        setValidationErrors([]);
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    // ─── Submit: GROUP ────────────────────────────────────────────────────────
    const handleSubmitGroup = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                batchId: formData.batchId,
                title: formData.title,
                description: formData.description,
                duration: formData.duration,
                openingsCount: 0,
                applicationDeadline: formData.applicationDeadline || undefined,
                internshipType: formData.internshipType,
                internshipMode: 'GROUP',
                stipendType: formData.internshipType === 'COLLABORATIVE' ? 'COLLABORATIVE' : 'NON_COLLABORATIVE',
                requiredDocuments: requiredDocs,
                customQuestions: formData.customQuestions,
                shortlistingRatio: parseInt(formData.shortlistingRatio) || 2,
                preferredColleges: formData.preferredColleges
            };

            const res = await api.post('/admin/internships', payload);
            const internshipId = res.data.data.id;

            // Create one department group per participating dept (backend notifies each HOD)
            for (const dept of formData.participatingDepts) {
                await api.post(`/admin/internships/${internshipId}/groups`, {
                    department: dept,
                    title: `${dept} — ${formData.title}`
                });
            }

            alert(`Master internship launched! ${formData.participatingDepts.length} HOD(s) notified to submit problem statements.`);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create master internship');
        } finally {
            setLoading(false);
        }
    };

    // ─── Submit: SINGLE (existing) ────────────────────────────────────────────
    const handleSubmitSingle = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                openingsCount: totalOpenings,
                roles: roles.map(r => r.name).join(', '),
                rolesData: roles,
                location: locations.join(', '),
                requiredDocuments: requiredDocs,
                customQuestions: formData.customQuestions,
                requirements: formData.requirementTags.join(', '),
                preferredColleges: formData.preferredColleges,
                internshipType: formData.internshipType,
                fields: formData.internshipType === 'NON_STIPEND' ? formData.fields : []
            };

            await api.post('/admin/internships', payload);
            alert('Internship program launched successfully!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create internship');
            alert(err.response?.data?.message || 'Failed to create internship');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step label helpers ───────────────────────────────────────────────────
    const stepLabels = isGroup
        ? ['Basic Info', 'Departments', 'Review']
        : ['Basic Info', 'Capacity', 'Roles', 'Documents', 'Finalize'];

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto pb-20">
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Programme Configuration</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Create New Internship</h2>
                </div>
                <div className="flex items-center gap-4">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                        {stepLabels.map((label, idx) => {
                            const s = idx + 1;
                            return (
                                <React.Fragment key={s}>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] transition-all
                                            ${step === s ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : step > s ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-transparent text-outline/40'}`}>
                                            {step > s ? <span className="material-symbols-outlined text-sm">check</span> : s}
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${step === s ? 'text-primary' : 'text-outline/40'}`}>{label}</span>
                                    </div>
                                    {s < totalSteps && <div className="w-4 h-[1px] bg-outline-variant/30" />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold text-outline hover:bg-surface-variant transition-colors border border-outline-variant/10">
                        <span className="material-symbols-outlined text-sm">close</span> Cancel
                    </button>
                </div>
            </section>

            <div className="bg-surface-container-low rounded-xl p-10 shadow-sm border border-outline-variant/10 relative overflow-hidden">
                {/* Progress bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-outline-variant/10">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-error/5 border border-error/10 rounded-xl text-error text-xs font-bold flex items-center gap-3 animate-shake uppercase tracking-wider">
                        <span className="material-symbols-outlined">warning</span> {error}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    STEP 1 — BASIC INFO
                    Layout: Title → Mode cards → mode-specific fields
                ═══════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">
                                Step 1: <span className="text-primary/60 font-medium">Basic Information</span>
                            </h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">
                                Start by naming the programme and choosing how it will operate.
                            </p>
                        </div>

                        {/* ── Row 1: Batch + Title ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Master Program (Batch)" required tooltip="Select the master program this internship belongs to." error={validationErrors.includes('batchId')}>
                                <Select
                                    value={formData.batchId}
                                    onChange={v => { setFormData({ ...formData, batchId: v }); setValidationErrors(prev => prev.filter(e => e !== 'batchId')); }}
                                    options={[
                                        { value: '', label: '-- Select Master Program --' },
                                        ...batches.map(b => ({ value: b.id, label: b.title }))
                                    ]}
                                    size="lg"
                                    disabled={loadingBatches}
                                />
                            </InputField>

                            <InputField label="Internship Posting Title" required
                                hint={isGroup ? 'e.g. Summer Internship 2026' : 'e.g. Graduate Engineer Trainee (Electrical)'}
                                error={validationErrors.includes('title')}>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder={isGroup ? 'e.g. Summer Internship 2026' : 'Enter specific title for this posting...'}
                                    className={`admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 ${validationErrors.includes('title') ? 'border-error/50' : ''}`}
                                />
                            </InputField>
                        </div>

                        {/* ── Row 2: Operational Mode — prominent card toggle ── */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-3">
                                Operational Mode <span className="text-error">*</span>
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* SINGLE card */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, internshipMode: 'SINGLE', participatingDepts: [], department: user?.department || '' });
                                        setValidationErrors([]);
                                        setError('');
                                    }}
                                    className={`relative text-left p-6 rounded-xl border-2 transition-all duration-200 group
                                        ${!isGroup
                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                            : 'border-outline-variant/20 bg-white hover:border-primary/30 hover:bg-primary/5'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                            ${!isGroup ? 'bg-primary text-white' : 'bg-surface-container text-outline'}`}>
                                            <span className="material-symbols-outlined text-xl">corporate_fare</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={`text-sm font-black uppercase tracking-wide ${!isGroup ? 'text-primary' : 'text-outline'}`}>
                                                    Single Department
                                                </p>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                    ${!isGroup ? 'border-primary bg-primary' : 'border-outline-variant/40 bg-transparent'}`}>
                                                    {!isGroup && <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>check</span>}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-outline/70 font-medium leading-relaxed">
                                                Creates a department-specific internship managed directly by the selected HOD / PRTI. Roles, openings and seat allocation are set here.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* GROUP / MASTER card */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, internshipMode: 'GROUP', participatingDepts: [], department: '' });
                                        setValidationErrors([]);
                                        setError('');
                                    }}
                                    className={`relative text-left p-6 rounded-xl border-2 transition-all duration-200 group
                                        ${isGroup
                                            ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                                            : 'border-outline-variant/20 bg-white hover:border-indigo-500/30 hover:bg-indigo-500/5'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                            ${isGroup ? 'bg-indigo-500 text-white' : 'bg-surface-container text-outline'}`}>
                                            <span className="material-symbols-outlined text-xl">hub</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={`text-sm font-black uppercase tracking-wide ${isGroup ? 'text-indigo-700' : 'text-outline'}`}>
                                                    Master / Multi-Department
                                                </p>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                    ${isGroup ? 'border-indigo-500 bg-indigo-500' : 'border-outline-variant/40 bg-transparent'}`}>
                                                    {isGroup && <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>check</span>}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-outline/70 font-medium leading-relaxed">
                                                Creates a centralised internship drive. Participating departments are selected now; each HOD later submits their own problem statements and vacancies.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* ── Row 3: Mode-specific fields — animated in ── */}
                        <div className="space-y-8 animate-in fade-in duration-300">

                            {/* SINGLE: Target Department */}
                            {!isGroup && (
                                <InputField label="Target Department" required error={validationErrors.includes('department')}>
                                    <Select
                                        value={formData.department}
                                        onChange={v => { handleChange({ target: { name: 'department', value: v } }); setValidationErrors(prev => prev.filter(e => e !== 'department')); }}
                                        options={[
                                            { value: '', label: '-- Select Department --' },
                                            ...departments.map(d => ({ value: d, label: d }))
                                        ]}
                                        size="lg"
                                        disabled={user && (user.role === 'HOD' || user.role === 'MENTOR') && !!user.department}
                                    />
                                </InputField>
                            )}

                            {/* Duration + Type — both modes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField label="Internship Duration" required hint="Standard engagement period" error={validationErrors.includes('duration')}>
                                    <Select
                                        value={formData.duration}
                                        onChange={v => { handleChange({ target: { name: 'duration', value: v } }); setValidationErrors(prev => prev.filter(e => e !== 'duration')); }}
                                        options={[
                                            { value: '', label: '-- Select Duration --' },
                                            { value: '4 Weeks', label: '4 Weeks' },
                                            { value: '6 Weeks', label: '6 Weeks' },
                                            { value: '8 Weeks', label: '8 Weeks' },
                                            { value: '3 Months', label: '3 Months' },
                                            { value: '6 Months', label: '6 Months' }
                                        ]}
                                        size="lg"
                                    />
                                </InputField>

                                <InputField label="Internship Type" required tooltip="COLLABORATIVE = with stipend. NON_STIPEND = no stipend.">
                                    <Select
                                        value={formData.internshipType}
                                        onChange={v => setFormData({ ...formData, internshipType: v, stipendType: v === 'COLLABORATIVE' ? 'COLLABORATIVE' : 'NON_COLLABORATIVE' })}
                                        options={[
                                            { value: 'COLLABORATIVE', label: 'Collaborative (With Stipend)' },
                                            { value: 'NON_STIPEND', label: 'Learning Internship (No Stipend)' }
                                        ]}
                                        size="lg"
                                    />
                                </InputField>
                            </div>

                            {/* Deadline — both modes */}
                            <InputField label="Application Deadline" hint="Leave empty for no deadline">
                                <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange}
                                    className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                            </InputField>

                            {/* Shortlisting Ratio — COLLABORATIVE GROUP only */}
                            {isGroup && formData.internshipType === 'COLLABORATIVE' && (
                                <InputField
                                    label="Shortlisting Ratio"
                                    hint="For every 1 opening, how many candidates to shortlist per college tier (Preferred / Top / Regular)"
                                    tooltip="Example: ratio 2 means 1:2 — with 3 openings, HOD should shortlist 6 candidates from each college tier."
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-outline/60 uppercase tracking-widest">1 :</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={formData.shortlistingRatio}
                                            onChange={e => setFormData({ ...formData, shortlistingRatio: parseInt(e.target.value) || 2 })}
                                            className="admin-input text-sm font-bold w-24 text-center border-outline-variant/20 focus:border-primary/30"
                                        />
                                        <span className="text-[10px] font-bold text-outline/60 uppercase tracking-wider">
                                            = shortlist {formData.shortlistingRatio}× per opening per tier
                                        </span>
                                    </div>
                                </InputField>
                            )}

                            {/* Location — SINGLE only */}
                            {!isGroup && (
                                <InputField label="Deployment Location" tooltip="Where interns will be stationed. Optional.">
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <Select
                                                value={locationInput}
                                                onChange={setLocationInput}
                                                options={[{ value: '', label: 'Select Location...' }, ...PRESET_LOCATIONS.map(l => ({ value: l, label: l }))]}
                                                size="lg"
                                            />
                                            <button type="button" onClick={() => addLocation()} className="px-4 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90">Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {locations.length === 0 && <span className="text-[10px] text-outline/50 font-bold uppercase italic">No specific location set (Optional)</span>}
                                            {locations.map(l => (
                                                <span key={l} className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-lg border border-primary/10 text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="material-symbols-outlined text-xs">location_on</span> {l}
                                                    <button onClick={() => setLocations(locations.filter(x => x !== l))} className="hover:text-error transition-colors">
                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </InputField>
                            )}

                            {/* Description — both modes */}
                            <InputField label="Detailed Description" required
                                hint={isGroup ? 'Overall programme overview — departments add specifics later' : 'Explain what the program is about'}
                                error={validationErrors.includes('description')}>
                                <textarea name="description" required value={formData.description} onChange={handleChange}
                                    rows={4} placeholder="Briefly describe the internship objectives and scope..."
                                    className={`admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 resize-none ${validationErrors.includes('description') ? 'border-error/50' : ''}`} />
                            </InputField>

                            {/* GROUP contextual notice */}
                            {isGroup && (
                                <div className="p-5 bg-indigo-50 border border-indigo-200/60 rounded-xl flex items-start gap-3">
                                    <span className="material-symbols-outlined text-indigo-500 text-lg mt-0.5">info</span>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">What happens after you launch?</p>
                                        <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                                            In the next step you will select participating departments. Each department's HOD
                                            will be notified by email to log in and submit their problem statements (vacancies,
                                            requirements, skills). The internship goes live to students only once all HODs have submitted.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-outline-variant/10">
                            <button onClick={nextStep} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                {isGroup ? 'Continue to Departments' : 'Continue to Capacity & Questions'}
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    GROUP STEP 2 — PARTICIPATING DEPARTMENTS
                ═══════════════════════════════════════════════════════════════ */}
                {step === 2 && isGroup && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">
                                Step 2: <span className="text-primary/60 font-medium">Participating Departments</span>
                            </h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">
                                Select departments to include. Each HOD will be notified to submit problem statements.
                            </p>
                        </div>

                        <div className={`p-8 bg-white border rounded-xl ${validationErrors.includes('participatingDepts') ? 'border-error/50 bg-error/5 animate-shake' : 'border-outline-variant/10 shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-5">
                                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                                    {formData.participatingDepts.length === 0
                                        ? 'Select at least one department'
                                        : `${formData.participatingDepts.length} department${formData.participatingDepts.length > 1 ? 's' : ''} selected`}
                                </p>
                                {formData.participatingDepts.length > 0 && (
                                    <button type="button" onClick={() => setFormData({ ...formData, participatingDepts: [] })}
                                        className="text-[10px] font-bold text-error/70 hover:text-error uppercase tracking-widest transition-colors">
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {departments.map(dept => {
                                    const selected = formData.participatingDepts.includes(dept);
                                    return (
                                        <button
                                            key={dept}
                                            type="button"
                                            onClick={() => {
                                                const next = selected
                                                    ? formData.participatingDepts.filter(d => d !== dept)
                                                    : [...formData.participatingDepts, dept];
                                                setFormData({ ...formData, participatingDepts: next });
                                                if (validationErrors.includes('participatingDepts'))
                                                    setValidationErrors(prev => prev.filter(e => e !== 'participatingDepts'));
                                            }}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-[11px] font-bold uppercase tracking-wide
                                                ${selected
                                                    ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                                                    : 'bg-surface-container border-outline-variant/20 text-outline hover:border-primary/20 hover:bg-primary/5'}`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all
                                                ${selected ? 'bg-primary border-primary' : 'border-outline-variant/40'}`}>
                                                {selected && <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>check</span>}
                                            </div>
                                            <span className="leading-tight">{dept}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected chips summary */}
                        {formData.participatingDepts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.participatingDepts.map(dept => (
                                    <span key={dept} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        <span className="material-symbols-outlined text-xs">domain</span>
                                        {dept}
                                        <button type="button" onClick={() => setFormData({ ...formData, participatingDepts: formData.participatingDepts.filter(d => d !== dept) })}>
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">info</span>
                            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider leading-relaxed">
                                After creation, each selected department's HOD will receive an email asking them to submit problem statements.
                                The internship becomes visible to students only once all HODs have submitted.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} disabled={formData.participatingDepts.length === 0}
                                className="flex-1 py-4 bg-primary disabled:opacity-40 hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Review <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    GROUP STEP 3 — REVIEW & LAUNCH
                ═══════════════════════════════════════════════════════════════ */}
                {step === 3 && isGroup && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">
                                Step 3: <span className="text-primary/60 font-medium">Review & Launch</span>
                            </h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">
                                Confirm configuration and launch the master internship.
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white border border-outline-variant/10 rounded-xl shadow-sm space-y-4">
                                <p className="text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10 pb-2">Programme Identity</p>
                                <p className="text-xl font-black text-primary leading-tight">{formData.title}</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase">
                                        <span className="material-symbols-outlined text-sm text-primary/40">schedule</span>
                                        {formData.duration}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase">
                                        <span className="material-symbols-outlined text-sm text-primary/40">payments</span>
                                        {formData.internshipType === 'COLLABORATIVE' ? 'With Stipend' : 'No Stipend'}
                                    </div>
                                    {formData.applicationDeadline && (
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase">
                                            <span className="material-symbols-outlined text-sm text-primary/40">event</span>
                                            Deadline: {formData.applicationDeadline}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-outline-variant/10">
                                    <p className="text-[10px] text-outline/70 font-medium leading-relaxed">{formData.description}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-white border border-outline-variant/10 rounded-xl shadow-sm space-y-4">
                                <p className="text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10 pb-2">
                                    Participating Departments ({formData.participatingDepts.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.participatingDepts.map(dept => (
                                        <span key={dept} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                                            {dept}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-outline/70 font-medium leading-relaxed">
                                    {formData.participatingDepts.length} HOD email notification{formData.participatingDepts.length > 1 ? 's' : ''} will be sent immediately after launch.
                                </p>
                            </div>
                        </div>

                        {/* Required docs (editable here) */}
                        <div className="p-6 bg-white border border-outline-variant/10 rounded-xl shadow-sm space-y-4">
                            <p className="text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10 pb-2">
                                Documents Required at Application
                            </p>
                            <div className="flex gap-3 mb-3">
                                <input type="text" value={docNameInput} onChange={e => setDocNameInput(e.target.value)}
                                    placeholder="Add document (e.g. ID Proof)..."
                                    className="admin-input flex-1 text-sm font-bold border-outline-variant/20" />
                                <Select value={docTypeInput} onChange={setDocTypeInput}
                                    options={[{ value: 'PDF', label: 'PDF' }, { value: 'IMAGE', label: 'Image' }]} size="md" />
                                <button type="button" onClick={addDoc}
                                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-[10px] uppercase hover:opacity-90">Add</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {requiredDocs.map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/10 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-outline/40">{doc.type === 'PDF' ? 'description' : 'image'}</span>
                                            <span className="text-[11px] font-bold text-primary uppercase">{doc.label}</span>
                                            {doc.mandatory && <span className="text-error text-xs">*</span>}
                                        </div>
                                        <button onClick={() => setRequiredDocs(requiredDocs.filter((_, idx) => idx !== i))}
                                            className="text-outline/30 hover:text-error transition-colors">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* What happens next */}
                        <div className="p-6 bg-surface-container border border-outline-variant/10 rounded-xl space-y-4">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">timeline</span>
                                What Happens After Launch
                            </p>
                            <div className="space-y-3">
                                {[
                                    { color: 'amber', icon: 'notifications', text: `HODs of ${formData.participatingDepts.length} departments are notified by email immediately.` },
                                    { color: 'blue', icon: 'edit_note', text: 'Each HOD logs in and submits their problem statements (title, description, vacancies, requirements).' },
                                    { color: 'emerald', icon: 'public', text: 'Once all HODs submit, the internship goes LIVE and becomes visible to students.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-7 h-7 rounded-full bg-${item.color}-100 text-${item.color}-700 flex items-center justify-center text-[10px] font-black shrink-0 border border-${item.color}-200`}>
                                            {i + 1}
                                        </div>
                                        <p className="text-[11px] font-bold text-outline uppercase tracking-wide leading-relaxed mt-0.5">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={handleSubmitGroup} disabled={loading}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/50 transition-all hover:scale-[1.01]">
                                {loading
                                    ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Launching...</>
                                    : <><span className="material-symbols-outlined text-sm">rocket_launch</span> Launch Master Internship</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SINGLE STEP 2 — CAPACITY & QUESTIONS
                ═══════════════════════════════════════════════════════════════ */}
                {step === 2 && !isGroup && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 2: <span className="text-primary/60 font-medium">Capacity & Questions</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Define vacancy volume and custom application questions.</p>
                        </div>

                        <div className="p-8 bg-white border border-outline-variant/10 rounded-xl">
                            <InputField label="Total Available Seats" required hint="Total number of students you can accommodate" error={validationErrors.includes('manualOpenings')}>
                                <div className="flex items-center gap-6">
                                    <input type="number" name="manualOpenings" value={formData.manualOpenings} onChange={handleChange}
                                        placeholder="000"
                                        className={`admin-input text-3xl font-black text-primary w-40 border-outline-variant/20 focus:border-primary/30 ${validationErrors.includes('manualOpenings') ? 'border-error/50' : ''}`} />
                                    <div className="flex-1 p-4 bg-primary/5 rounded-lg border border-primary/10 text-[10px] font-bold text-primary/70 leading-relaxed uppercase tracking-wide">
                                        <div className="flex items-center gap-2 mb-1 text-primary">
                                            <span className="material-symbols-outlined text-sm">lightbulb</span>
                                            <span>Manual Selection</span>
                                        </div>
                                        Define capacity for planning purposes.
                                    </div>
                                </div>
                            </InputField>
                        </div>

                        <div className="mt-8 p-8 bg-surface-container rounded-xl border border-outline-variant/10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary">pie_chart</span>
                                <div>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Seat Distribution Tracker</h3>
                                    <p className="text-[10px] text-outline/70 font-bold uppercase mt-1 tracking-widest">Must equal 100%.</p>
                                </div>
                            </div>
                            <div className="space-y-6 mb-8">
                                <InputField label={`Preferred Colleges: ${formData.quotaPercentages.preferred}%`} hint={`${Math.floor((formData.manualOpenings || 0) * (formData.quotaPercentages.preferred / 100))} seats`}>
                                    <input type="range" min="0" max="100" value={formData.quotaPercentages.preferred}
                                        onChange={e => { const pref = parseInt(e.target.value) || 0; let prem = formData.quotaPercentages.premier; if (pref + prem > 100) prem = 100 - pref; setFormData(prev => ({ ...prev, quotaPercentages: { preferred: pref, premier: prem, normal: 100 - pref - prem } })); }}
                                        className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                                </InputField>
                                <InputField label={`Premier (IIT/NIT): ${formData.quotaPercentages.premier}%`} hint={`${Math.floor((formData.manualOpenings || 0) * (formData.quotaPercentages.premier / 100))} seats`}>
                                    <input type="range" min="0" max={100 - formData.quotaPercentages.preferred} value={formData.quotaPercentages.premier}
                                        onChange={e => { const prem = parseInt(e.target.value) || 0; setFormData(prev => ({ ...prev, quotaPercentages: { ...prev.quotaPercentages, premier: prem, normal: 100 - prev.quotaPercentages.preferred - prem } })); }}
                                        className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                </InputField>
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Remaining Colleges</p>
                                        <p className="text-xs font-medium text-emerald-600">{Math.floor((formData.manualOpenings || 0) * (formData.quotaPercentages.normal / 100))} seats allocated</p>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-600">{formData.quotaPercentages.normal}%</span>
                                </div>
                            </div>
                            {(() => {
                                const total = formData.quotaPercentages.preferred + formData.quotaPercentages.premier + formData.quotaPercentages.normal;
                                return (
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Distribution Overview</span>
                                            <span className="text-xs font-black text-emerald-600">{total}% Allocated</span>
                                        </div>
                                        <div className="w-full h-3 rounded-full flex overflow-hidden bg-surface-container-high border border-outline-variant/10">
                                            <div className="bg-amber-400 h-full transition-all" style={{ width: `${formData.quotaPercentages.preferred}%` }} />
                                            <div className="bg-indigo-500 h-full transition-all" style={{ width: `${formData.quotaPercentages.premier}%` }} />
                                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${formData.quotaPercentages.normal}%` }} />
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="mt-8 p-8 bg-surface-container rounded-xl border border-outline-variant/10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary">account_balance</span>
                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Preferred Colleges</h3>
                            </div>
                            <div className="flex gap-4 mb-6">
                                <input type="text" value={preferredCollegeInput} onChange={e => setPreferredCollegeInput(e.target.value)}
                                    placeholder="e.g. IIT Madras, NIT Warangal" className="admin-input flex-1 text-sm font-bold border-outline-variant/20" />
                                <button type="button" onClick={() => { if (preferredCollegeInput.trim()) { setFormData({ ...formData, preferredColleges: [...formData.preferredColleges, preferredCollegeInput.trim()] }); setPreferredCollegeInput(''); } }}
                                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase">Add College</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.preferredColleges.map((college, i) => (
                                    <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-xs">school</span> {college}
                                        <button onClick={() => setFormData({ ...formData, preferredColleges: formData.preferredColleges.filter((_, idx) => idx !== i) })} className="hover:text-error transition-colors ml-1">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                                {formData.preferredColleges.length === 0 && <p className="w-full text-center py-4 text-outline/30 text-[10px] font-bold uppercase tracking-widest border border-dashed border-outline-variant/30 rounded-lg">No preferred colleges added.</p>}
                            </div>
                        </div>

                        <div className="mt-8 p-8 bg-surface-container rounded-xl border border-outline-variant/10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary">quiz</span>
                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Application Questions for Students</h3>
                            </div>
                            <div className="flex gap-4 mb-6">
                                <input type="text" value={questionInput} onChange={e => setQuestionInput(e.target.value)}
                                    placeholder="e.g. Why are you interested in this internship?" className="admin-input flex-1 text-sm font-bold border-outline-variant/20" />
                                <button type="button" onClick={() => { if (questionInput.trim()) { setFormData({ ...formData, customQuestions: [...formData.customQuestions, questionInput.trim()] }); setQuestionInput(''); } }}
                                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase">Add Question</button>
                            </div>
                            <div className="space-y-2">
                                {formData.customQuestions.map((q, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-outline-variant/10 rounded-lg">
                                        <p className="text-xs font-bold text-primary">Q{i + 1}: {q}</p>
                                        <button onClick={() => setFormData({ ...formData, customQuestions: formData.customQuestions.filter((_, idx) => idx !== i) })} className="text-error"><span className="material-symbols-outlined text-sm">delete</span></button>
                                    </div>
                                ))}
                                {formData.customQuestions.length === 0 && <p className="text-center py-4 text-outline/30 text-[10px] font-bold uppercase tracking-widest border border-dashed border-outline-variant/30 rounded-lg">No custom questions added yet.</p>}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Roles <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SINGLE STEP 3 — ROLES OR FIELDS
                ═══════════════════════════════════════════════════════════════ */}
                {step === 3 && !isGroup && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {formData.internshipType !== 'NON_STIPEND' ? (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 3: <span className="text-primary/60 font-medium">Available Roles</span></h2>
                                    <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Assign seats to specific positions within the programme.</p>
                                </div>
                                <div className={`p-8 bg-white border rounded-xl flex flex-col md:flex-row gap-6 ${validationErrors.includes('roles') ? 'border-error/50 bg-error/5 shadow-lg shadow-error/5 animate-shake' : 'border-outline-variant/10 shadow-sm'}`}>
                                    <div className="flex-1">
                                        <InputField label="Role/Position Name">
                                            <input type="text" value={roleNameInput} onChange={e => setRoleNameInput(e.target.value)}
                                                placeholder="e.g. Graduate Engineer Trainee" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                        </InputField>
                                    </div>
                                    <div className="w-48">
                                        <InputField label="Seats for this Role">
                                            <input type="number" min="1" value={roleOpeningsInput} onChange={e => setRoleOpeningsInput(e.target.value)}
                                                className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                        </InputField>
                                    </div>
                                    <div className="flex items-end">
                                        <button type="button" onClick={addRole} className="h-[46px] px-6 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/10">
                                            <span className="material-symbols-outlined text-sm">add</span> Add Role
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {roles.length === 0 ? (
                                        <div className="p-12 border border-dashed border-outline-variant/30 rounded-xl text-center bg-surface-container-high/20">
                                            <span className="material-symbols-outlined text-outline/30 text-4xl mb-2">group</span>
                                            <p className="text-outline/50 font-bold uppercase text-[10px] tracking-widest leading-loose">No active roles defined. Assign at least one position to proceed.</p>
                                        </div>
                                    ) : roles.map((r, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white border border-outline-variant/10 rounded-xl shadow-sm hover:border-primary/20 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary font-bold text-xs">R{i + 1}</div>
                                                <div>
                                                    <p className="font-bold text-primary tracking-tight text-sm uppercase">{r.name}</p>
                                                    <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{r.openings} Positions available</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setRoles(roles.filter((_, idx) => idx !== i))} className="p-2 text-outline/40 hover:text-error transition-colors">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 3: <span className="text-primary/60 font-medium">Available Fields</span></h2>
                                    <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Define technical fields and locations for Non-Stipend internship.</p>
                                </div>
                                <div className={`p-8 bg-white border rounded-xl space-y-6 ${validationErrors.includes('fields') ? 'border-error/50 bg-error/5 shadow-lg shadow-error/5 animate-shake' : 'border-outline-variant/10 shadow-sm'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField label="Field Name">
                                            <input type="text" value={fieldInput.fieldName} onChange={e => setFieldInput({ ...fieldInput, fieldName: e.target.value })}
                                                placeholder="e.g. Transmission Operations" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                        </InputField>
                                        <InputField label="Vacancies">
                                            <input type="number" min="1" value={fieldInput.vacancies} onChange={e => setFieldInput({ ...fieldInput, vacancies: e.target.value })}
                                                className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                        </InputField>
                                    </div>
                                    <InputField label="Field Description">
                                        <textarea value={fieldInput.description} onChange={e => setFieldInput({ ...fieldInput, description: e.target.value })}
                                            rows="2" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                    </InputField>
                                    <div className="space-y-4">
                                        <InputField label="Available Locations">
                                            <div className="flex gap-4">
                                                <input type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)}
                                                    placeholder="e.g. Vijayawada" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                                <button type="button" onClick={() => { if (locationInput.trim()) { setFieldInput({ ...fieldInput, locations: [...fieldInput.locations, locationInput.trim()] }); setLocationInput(''); } }}
                                                    className="h-[46px] px-6 bg-primary/10 text-primary rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all">Add Location</button>
                                            </div>
                                        </InputField>
                                        <div className="flex flex-wrap gap-2">
                                            {fieldInput.locations.map((loc, i) => (
                                                <span key={i} className="px-3 py-1 bg-surface-variant text-outline rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                                    {loc} <button onClick={() => setFieldInput({ ...fieldInput, locations: fieldInput.locations.filter((_, idx) => idx !== i) })} className="text-error">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => {
                                        if (fieldInput.fieldName && fieldInput.vacancies && fieldInput.locations.length > 0) {
                                            setFormData({ ...formData, fields: [...formData.fields, fieldInput] });
                                            setFieldInput({ fieldName: '', description: '', vacancies: '', locations: [] });
                                        } else {
                                            alert('Please fill all field details and add at least one location');
                                        }
                                    }} className="w-full py-4 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md">
                                        <span className="material-symbols-outlined text-sm">add</span> Add Field to Internship
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.fields.length === 0 ? (
                                        <div className="p-12 border border-dashed border-outline-variant/30 rounded-xl text-center bg-surface-container-high/20">
                                            <span className="material-symbols-outlined text-outline/30 text-4xl mb-2">account_tree</span>
                                            <p className="text-outline/50 font-bold uppercase text-[10px] tracking-widest leading-loose">No fields defined. Define at least one technical field to proceed.</p>
                                        </div>
                                    ) : formData.fields.map((f, i) => (
                                        <div key={i} className="p-5 bg-white border border-outline-variant/10 rounded-xl shadow-sm group relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-primary text-lg tracking-tight uppercase">{f.fieldName}</h3>
                                                    <p className="text-[10px] text-outline/60 font-bold uppercase tracking-widest mt-1">{f.vacancies} Vacancies available</p>
                                                </div>
                                                <button onClick={() => setFormData({ ...formData, fields: formData.fields.filter((_, idx) => idx !== i) })} className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {f.locations.map((loc, li) => (
                                                    <span key={li} className="px-2 py-1 bg-primary/5 text-primary rounded-md text-[9px] font-bold uppercase tracking-wider border border-primary/10">{loc}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} disabled={formData.internshipType !== 'NON_STIPEND' ? roles.length === 0 : formData.fields.length === 0}
                                className="flex-1 py-4 bg-primary disabled:opacity-50 hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Documents <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SINGLE STEP 4 — REQUIRED DOCUMENTS
                ═══════════════════════════════════════════════════════════════ */}
                {step === 4 && !isGroup && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 4: <span className="text-primary/60 font-medium">Required Documents</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Specify mandatory evidentiary submissions for candidates.</p>
                        </div>
                        <div className={`p-8 bg-white border rounded-xl flex flex-col md:flex-row gap-6 ${validationErrors.includes('documents') ? 'border-error/50 bg-error/5 shadow-lg shadow-error/5 animate-shake' : 'border-outline-variant/10 shadow-sm'}`}>
                            <div className="flex-1">
                                <InputField label="Document Name (e.g. NOC Letter)">
                                    <input type="text" value={docNameInput} onChange={e => setDocNameInput(e.target.value)}
                                        placeholder="Enter document name..." className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                </InputField>
                            </div>
                            <div className="w-56 flex items-end gap-6">
                                <InputField label="Format">
                                    <Select value={docTypeInput} onChange={setDocTypeInput}
                                        options={[{ value: 'PDF', label: '📑 PDF Only' }, { value: 'IMAGE', label: '🖼️ Image (JPG/PNG)' }]} size="md" />
                                </InputField>
                                <div className="mb-2 flex items-center gap-2">
                                    <input type="checkbox" id="mandatory-doc" checked={docMandatoryInput} onChange={e => setDocMandatoryInput(e.target.checked)}
                                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                                    <label htmlFor="mandatory-doc" className="text-[10px] font-bold text-outline uppercase tracking-widest cursor-pointer">Mandatory</label>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button type="button" onClick={addDoc} className="h-[46px] px-6 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/10">
                                    <span className="material-symbols-outlined text-sm">add_circle</span> Add Rule
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {requiredDocs.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white border border-outline-variant/10 rounded-xl shadow-sm hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${doc.type === 'PDF' ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
                                            <span className="material-symbols-outlined text-lg">{doc.type === 'PDF' ? 'description' : 'image'}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary tracking-tight text-sm uppercase">{doc.label} {doc.mandatory && <span className="text-error">*</span>}</p>
                                            <p className="text-[10px] text-outline font-bold uppercase tracking-widest leading-none mt-1">{doc.type} FORMAT • {doc.mandatory ? 'Mandatory' : 'Optional'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setRequiredDocs(requiredDocs.filter((_, idx) => idx !== i))} className="p-2 text-outline/40 hover:text-error transition-colors opacity-0 group-hover:opacity-100">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Finalize & Preview <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SINGLE STEP 5 — FINALIZE
                ═══════════════════════════════════════════════════════════════ */}
                {step === 5 && !isGroup && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 5: <span className="text-primary/60 font-medium">Finalize & Preview</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Review programmatic parameters and establish skill matrices.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Required Technical Skills / Qualifications" required hint="Add skills one by one (e.g. React, Python, Data Entry)">
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input type="text" value={requirementInput} onChange={e => setRequirementInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                            placeholder="Enter a skill and press Enter..." className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                        <button type="button" onClick={addRequirement} className="px-6 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-surface-container-high/20 rounded-xl border border-dashed border-outline-variant/30">
                                        {formData.requirementTags.length === 0 && (
                                            <p className="text-[10px] text-outline/40 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Star size={12} /> Add at least 3-5 key skills
                                            </p>
                                        )}
                                        {formData.requirementTags.map((tag, i) => (
                                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm animate-in zoom-in-95 duration-200">
                                                {tag}
                                                <button type="button" onClick={() => setFormData({ ...formData, requirementTags: formData.requirementTags.filter((_, idx) => idx !== i) })} className="hover:text-amber-300 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </InputField>
                            <InputField label="Learn & Do (Job Description)" required hint="What the intern will actually do">
                                <textarea name="expectations" required value={formData.expectations} onChange={handleChange}
                                    rows={4} placeholder="• Assist in network monitoring&#10;• Hands-on with substation field work..."
                                    className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 resize-none" />
                            </InputField>
                        </div>
                        <div className="p-8 bg-surface-container-high/30 rounded-xl border border-outline-variant/20">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">info</span> Selection Architecture
                            </h3>
                            <div className="space-y-4 text-[11px] font-bold text-outline/80 leading-relaxed uppercase tracking-tight">
                                <p className="flex items-start gap-4"><span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-primary/20">1</span><span>Applications will be collected until the deadline.</span></p>
                                <p className="flex items-start gap-4"><span className="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-outline shrink-0 border border-outline-variant/20">2</span><span>The committee will manually review each candidate's profile, resume, and answers to custom questions.</span></p>
                                <p className="flex items-start gap-4"><span className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 shrink-0 border border-emerald-200">3</span><span>Final shortlisting and hiring decisions will be made based on manual evaluation.</span></p>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={handleSubmitSingle} disabled={loading} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/50 transition-all hover:scale-[1.02]">
                                {loading ? <span className="animate-pulse">Deploying Program...</span> : <><span className="material-symbols-outlined">rocket_launch</span> Launch Internship Program</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateInternshipForm;
