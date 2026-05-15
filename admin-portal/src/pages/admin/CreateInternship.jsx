import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import departmentsData from '../../data/departments.json';
import Select from '../../components/ui/Select';
import { MONETARY_ENABLED } from '../../config/features';

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

const PRESET_LOCATIONS = ['ANY', 'Vijayawada HQ', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Kurnool', 'Rajahmundry', 'Nellore', 'Kadapa', 'Anantapur', 'Eluru'];

const CreateInternshipForm = () => {
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState([]);
    const [step, setStep] = useState(1);

    const [departments, setDepartments] = useState(departmentsData.departments);
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    // Required docs state (editable in step 3)
    const [requiredDocs, setRequiredDocs] = useState([
        { id: 'RESUME', label: 'Resume / CV', type: 'PDF', mandatory: true },
        { id: 'PASSPORT_PHOTO', label: 'Passport Size Photo', type: 'IMAGE', mandatory: true }
    ]);
    const [docNameInput, setDocNameInput] = useState('');
    const [docTypeInput, setDocTypeInput] = useState('PDF');

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

    const [formData, setFormData] = useState({
        batchId: '',
        title: '',
        description: '',
        duration: '',
        applicationDeadline: '',
        internshipType: MONETARY_ENABLED ? 'COLLABORATIVE' : 'NON_STIPEND',
        shortlistingRatio: 2,
        preferredColleges: [],
        participatingDepts: [],
    });
    const [preferredCollegeInput, setPreferredCollegeInput] = useState('');

    const isLearning = formData.internshipType === 'NON_STIPEND';
    const totalSteps = isLearning ? 4 : 3;
    const stepLabels = isLearning
        ? ['Basic Info', 'Departments', 'Fields', 'Review']
        : ['Basic Info', 'Departments', 'Review'];

    // deptFields: { [deptName]: [{ fieldName, vacancies, locations: [] }] }
    const [deptFields, setDeptFields] = useState({});
    // per-dept input state
    const [fieldInputs, setFieldInputs] = useState({}); // { [dept]: { fieldName, vacancies, locationInput, locations } }
    // masterFieldsMap: { [deptName]: [FieldMaster] } — seeded fields from Dept & Field Master
    const [masterFieldsMap, setMasterFieldsMap] = useState({});

    // Fetch master fields when entering step 3 for NON_STIPEND
    React.useEffect(() => {
        if (step !== 3 || !isLearning || formData.participatingDepts.length === 0) return;
        api.get('/admin/dept-master').then(res => {
            const allDepts = res.data.data || [];
            const map = {};
            formData.participatingDepts.forEach(deptName => {
                const match = allDepts.find(d =>
                    d.name.toUpperCase() === deptName.toUpperCase() ||
                    d.code.toUpperCase() === deptName.toUpperCase()
                );
                map[deptName] = match?.fields?.filter(f => f.isActive) || [];
            });
            setMasterFieldsMap(map);
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, isLearning]);

    const getFieldInput = (dept) => fieldInputs[dept] || { fieldName: '', fieldMasterId: '', locationInput: '', locationVacanciesInput: '1', locations: [] };
    const setFieldInput = (dept, patch) =>
        setFieldInputs(prev => ({ ...prev, [dept]: { ...getFieldInput(dept), ...patch } }));

    const addFieldToDept = (dept) => {
        const fi = getFieldInput(dept);
        if (!fi.fieldName.trim() || fi.locations.length === 0) {
            alert('Fill in field name and at least one location with vacancies.');
            return;
        }
        const totalVacancies = fi.locations.reduce((s, l) => s + (l.vacancies || 0), 0);
        // specializations come from master — stored on fi as fi.specializations (read from master on selection)
        setDeptFields(prev => ({
            ...prev,
            [dept]: [...(prev[dept] || []), { fieldName: fi.fieldName.trim(), fieldMasterId: fi.fieldMasterId || null, vacancies: totalVacancies, locations: fi.locations, specializations: fi.specializations || [] }]
        }));
        setFieldInput(dept, { fieldName: '', fieldMasterId: '', locationInput: '', locationVacanciesInput: '1', locations: [] });
    };

    const removeFieldFromDept = (dept, idx) =>
        setDeptFields(prev => ({ ...prev, [dept]: prev[dept].filter((_, i) => i !== idx) }));

    const addLocationToDept = (dept) => {
        const fi = getFieldInput(dept);
        const val = fi.locationInput.trim();
        if (!val) return;
        const vac = Math.max(1, parseInt(fi.locationVacanciesInput) || 1);
        if (val === 'ANY') {
            setFieldInput(dept, { locations: [{ name: 'ANY', vacancies: vac }], locationInput: '', locationVacanciesInput: '1' });
        } else {
            const filtered = fi.locations.filter(l => l.name !== 'ANY' && l.name !== val);
            setFieldInput(dept, { locations: [...filtered, { name: val, vacancies: vac }], locationInput: '', locationVacanciesInput: '1' });
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (validationErrors.includes(e.target.name))
            setValidationErrors(prev => prev.filter(k => k !== e.target.name));
    };

    const addDoc = () => {
        if (!docNameInput.trim()) return;
        const id = docNameInput.toUpperCase().replace(/\s+/g, '_') + '_' + Date.now();
        setRequiredDocs(prev => [...prev, { id, label: docNameInput.trim(), type: docTypeInput, mandatory: true }]);
        setDocNameInput('');
    };

    // ── Navigation ────────────────────────────────────────────────────────────
    const nextStep = () => {
        const errors = [];
        if (step === 1) {
            if (!formData.batchId) errors.push('batchId');
            if (!formData.title.trim()) errors.push('title');
            if (!formData.duration && formData.internshipType !== 'NON_STIPEND') errors.push('duration');
            if (!formData.description.trim()) errors.push('description');
        }
        if (step === 2 && formData.participatingDepts.length === 0) errors.push('participatingDepts');
        if (step === 3 && isLearning) {
            const allHaveFields = formData.participatingDepts.every(d => (deptFields[d] || []).length > 0);
            if (!allHaveFields) errors.push('deptFields');
        }

        if (errors.length) {
            setValidationErrors(errors);
            setError('Please fill in all mandatory fields highlighted below.');
            return;
        }
        setValidationErrors([]);
        setError('');
        setStep(s => s + 1);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
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
                shortlistingRatio: parseInt(formData.shortlistingRatio) || 2,
                preferredColleges: formData.preferredColleges,
            };

            const res = await api.post('/admin/internships', payload);
            const internshipId = res.data.data.id;

            for (const dept of formData.participatingDepts) {
                const groupRes = await api.post(`/admin/internships/${internshipId}/groups`, {
                    department: dept,
                    title: `${dept} — ${formData.title}`
                });
                // For NON_STIPEND: add configured fields to the group
                if (isLearning) {
                    const groupId = groupRes.data.data.id;
                    for (const field of (deptFields[dept] || [])) {
                        await api.post(`/admin/internships/${internshipId}/groups/${groupId}/fields`, {
                            fieldName: field.fieldName,
                            fieldMasterId: field.fieldMasterId || undefined,
                            vacancies: field.vacancies,
                            locations: field.locations,
                            specializations: field.specializations || []
                        });
                    }
                }
            }

            // NON_STIPEND: publish immediately — no HOD inputs needed
            if (isLearning) {
                await api.put(`/admin/internships/${internshipId}/publish`);
                alert('Learning Internship is now LIVE! Students can start applying.');
            } else {
                alert(`Master internship launched! ${formData.participatingDepts.length} HOD(s) notified to submit problem statements.`);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create internship.');
        } finally {
            setLoading(false);
            submittingRef.current = false;
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-5xl mx-auto pb-20">
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
                <div className="absolute top-0 left-0 w-full h-1 bg-outline-variant/10">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-error/5 border border-error/10 rounded-xl text-error text-xs font-bold flex items-center gap-3 animate-shake uppercase tracking-wider">
                        <span className="material-symbols-outlined">warning</span> {error}
                    </div>
                )}

                {/* ═══════ STEP 1 — BASIC INFO ═══════ */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">
                                Step 1: <span className="text-primary/60 font-medium">Basic Information</span>
                            </h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">
                                All internships are created under a master programme. Select a batch, name the drive, and configure the type.
                            </p>
                        </div>

                        {/* Batch + Title */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Master Program (Batch)" required
                                tooltip="Select the master programme this internship belongs to."
                                error={validationErrors.includes('batchId')}>
                                <Select
                                    value={formData.batchId}
                                    onChange={v => { setFormData(p => ({ ...p, batchId: v })); setValidationErrors(p => p.filter(e => e !== 'batchId')); }}
                                    options={[
                                        { value: '', label: loadingBatches ? 'Loading...' : '-- Select Master Program --' },
                                        ...batches.map(b => ({ value: b.id, label: b.title }))
                                    ]}
                                    size="lg"
                                    disabled={loadingBatches}
                                />
                            </InputField>

                            <InputField label="Internship Drive Title" required
                                hint="e.g. Summer Internship 2026"
                                error={validationErrors.includes('title')}>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Summer Internship 2026"
                                    className={`admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 ${validationErrors.includes('title') ? 'border-error/50' : ''}`}
                                />
                            </InputField>
                        </div>

                        {/* Duration + Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {formData.internshipType !== 'NON_STIPEND' && (
                                <InputField label="Duration" required error={validationErrors.includes('duration')}>
                                    <Select
                                        value={formData.duration}
                                        onChange={v => { setFormData(p => ({ ...p, duration: v })); setValidationErrors(p => p.filter(e => e !== 'duration')); }}
                                        options={[
                                            { value: '', label: '-- Select Duration --' },
                                            { value: '4 Weeks', label: '4 Weeks' },
                                            { value: '6 Weeks', label: '6 Weeks' },
                                            { value: '8 Weeks', label: '8 Weeks' },
                                            { value: '3 Months', label: '3 Months' },
                                            { value: '6 Months', label: '6 Months' },
                                        ]}
                                        size="lg"
                                    />
                                </InputField>
                            )}

                            <InputField label="Internship Type" required tooltip="Collaborative = with stipend. Learning = no stipend.">
                                <Select
                                    value={formData.internshipType}
                                    onChange={v => setFormData(p => ({ ...p, internshipType: v }))}
                                    options={[
                                        { value: 'COLLABORATIVE', label: 'Collaborative (With Stipend)' },
                                        { value: 'NON_STIPEND', label: 'Learning Internship (No Stipend)' },
                                    ]}
                                    size="lg"
                                />
                                {!MONETARY_ENABLED && formData.internshipType === 'COLLABORATIVE' && (
                                    <div className="mt-2 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                        <span className="material-symbols-outlined text-amber-500 text-base leading-none mt-0.5">block</span>
                                        <p className="text-[11px] font-bold text-amber-700">
                                            Paid internship workflow is not available yet. Please select <strong>Learning Internship (No Stipend)</strong> to continue.
                                        </p>
                                    </div>
                                )}
                            </InputField>
                        </div>

                        {/* Deadline */}
                        <InputField label="Application Deadline" hint="Leave empty for no deadline">
                            <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange}
                                className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                        </InputField>

                        {/* Shortlisting ratio — COLLABORATIVE only */}
                        {formData.internshipType === 'COLLABORATIVE' && (
                            <InputField
                                label="Shortlisting Ratio"
                                hint="For every 1 opening, how many candidates each HOD should shortlist per college tier"
                                tooltip="Example: ratio 3 → with 2 openings, HOD shortlists 6 per tier."
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-outline/60 uppercase tracking-widest">1 :</span>
                                    <input
                                        type="number" min={1} max={10}
                                        value={formData.shortlistingRatio}
                                        onChange={e => setFormData(p => ({ ...p, shortlistingRatio: parseInt(e.target.value) || 2 }))}
                                        className="admin-input text-sm font-bold w-24 text-center border-outline-variant/20 focus:border-primary/30"
                                    />
                                    <span className="text-[10px] font-bold text-outline/60 uppercase tracking-wider">
                                        = shortlist {formData.shortlistingRatio}× per opening per tier
                                    </span>
                                </div>
                            </InputField>
                        )}

                        {/* Description */}
                        <InputField label="Programme Description" required
                            hint="Overall overview — departments add specifics later"
                            error={validationErrors.includes('description')}>
                            <textarea name="description" value={formData.description} onChange={handleChange}
                                rows={4} placeholder="Briefly describe the internship objectives and scope..."
                                className={`admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 resize-none ${validationErrors.includes('description') ? 'border-error/50' : ''}`} />
                        </InputField>

                        <div className="pt-6 border-t border-outline-variant/10">
                            <button onClick={nextStep}
                                disabled={!MONETARY_ENABLED && formData.internshipType === 'COLLABORATIVE'}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed">
                                Continue to Departments <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════ STEP 2 — PARTICIPATING DEPARTMENTS ═══════ */}
                {step === 2 && (
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
                                    <button type="button" onClick={() => setFormData(p => ({ ...p, participatingDepts: [] }))}
                                        className="text-[10px] font-bold text-error/70 hover:text-error uppercase tracking-widest transition-colors">
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {departments.map(dept => {
                                    const selected = formData.participatingDepts.includes(dept);
                                    return (
                                        <button key={dept} type="button"
                                            onClick={() => {
                                                const next = selected
                                                    ? formData.participatingDepts.filter(d => d !== dept)
                                                    : [...formData.participatingDepts, dept];
                                                setFormData(p => ({ ...p, participatingDepts: next }));
                                                setValidationErrors(p => p.filter(e => e !== 'participatingDepts'));
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

                        {formData.participatingDepts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.participatingDepts.map(dept => (
                                    <span key={dept} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        <span className="material-symbols-outlined text-xs">domain</span>
                                        {dept}
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, participatingDepts: p.participatingDepts.filter(d => d !== dept) }))}>
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
                            <button onClick={() => setStep(1)} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} disabled={formData.participatingDepts.length === 0}
                                className="flex-1 py-4 bg-primary disabled:opacity-40 hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                {isLearning ? 'Configure Fields' : 'Continue to Review'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════ STEP 3 — FIELDS PER DEPARTMENT (NON_STIPEND only) ═══════ */}
                {step === 3 && isLearning && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">
                                Step 3: <span className="text-primary/60 font-medium">Fields & Locations</span>
                            </h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">
                                Define the learning fields and posting locations for each participating department.
                            </p>
                        </div>

                        {validationErrors.includes('deptFields') && (
                            <div className="p-4 bg-error/5 border border-error/20 rounded-xl text-error text-xs font-bold uppercase tracking-wider">
                                Every department must have at least one field configured.
                            </div>
                        )}

                        <div className="space-y-6">
                            {formData.participatingDepts.map(dept => {
                                const fi = getFieldInput(dept);
                                const fields = deptFields[dept] || [];
                                return (
                                    <div key={dept} className={`border rounded-2xl overflow-hidden ${fields.length === 0 && validationErrors.includes('deptFields') ? 'border-error/40' : 'border-outline-variant/15'}`}>
                                        {/* Dept header */}
                                        <div className="px-5 py-3 bg-surface-container flex items-center gap-3 border-b border-outline-variant/10">
                                            <span className="material-symbols-outlined text-primary text-base">domain</span>
                                            <span className="text-sm font-black text-primary">{dept}</span>
                                            <span className="ml-auto text-[10px] font-black text-outline/60 uppercase">{fields.length} field{fields.length !== 1 ? 's' : ''} added</span>
                                        </div>

                                        <div className="bg-white p-5 space-y-4">
                                            {/* Added fields */}
                                            {fields.map((f, i) => {
                                                const totalVac = f.locations.reduce((s, l) => s + (l.vacancies || 0), 0);
                                                return (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                        <div>
                                                            <p className="text-sm font-black text-emerald-800 uppercase">{f.fieldName}</p>
                                                            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                                                Total {totalVac} vacancies · {f.locations.map(l => `${l.name} (${l.vacancies})`).join(', ')}
                                                            </p>
                                                            {f.specializations?.length > 0 && (
                                                                <p className="text-[9px] font-bold text-violet-600 mt-0.5">
                                                                    {f.specializations.join(' · ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button onClick={() => removeFieldFromDept(dept, i)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {/* Add field form */}
                                            <div className="space-y-3 pt-2 border-t border-outline-variant/10">
                                                <InputField label="Field Name" hint={masterFieldsMap[dept]?.length ? `${masterFieldsMap[dept].length} field(s) configured` : 'No master fields — type manually'}>
                                                    {masterFieldsMap[dept]?.length > 0 ? (
                                                        <select
                                                            value={fi.fieldMasterId || fi.fieldName}
                                                            onChange={e => {
                                                                const master = masterFieldsMap[dept].find(f => f.id === e.target.value);
                                                                if (master) {
                                                                    setFieldInput(dept, {
                                                                        fieldName: master.fieldName,
                                                                        fieldMasterId: master.id,
                                                                        specializations: Array.isArray(master.specializations) ? master.specializations : []
                                                                    });
                                                                } else {
                                                                    setFieldInput(dept, { fieldName: '', fieldMasterId: '', specializations: [] });
                                                                }
                                                            }}
                                                            className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30"
                                                        >
                                                            <option value="">-- Select Field --</option>
                                                            {masterFieldsMap[dept].map(f => (
                                                                <option key={f.id} value={f.id}>
                                                                    {f.fieldCode} — {f.fieldName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={fi.fieldName}
                                                            onChange={e => setFieldInput(dept, { fieldName: e.target.value })}
                                                            placeholder="e.g. SCADA, Grid Ops"
                                                            className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30"
                                                        />
                                                    )}
                                                </InputField>

                                                {(fi.specializations?.length > 0) && (
                                                    <div className="px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-violet-600 mb-1.5">Target Specializations (from Master)</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {fi.specializations.map((sp, si) => (
                                                                <span key={si} className="px-2.5 py-1 bg-white text-violet-700 rounded-lg text-[10px] font-bold border border-violet-200">
                                                                    {sp}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <InputField label="Locations & Vacancies per Location"
                                                    hint={`Total vacancies = sum across all locations${fi.locations.length > 0 ? ' — currently ' + fi.locations.reduce((s, l) => s + (l.vacancies || 0), 0) : ''}`}>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={fi.locationInput}
                                                            onChange={e => setFieldInput(dept, { locationInput: e.target.value })}
                                                            className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 flex-1"
                                                        >
                                                            <option value="">Select location…</option>
                                                            {PRESET_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={fi.locationInput}
                                                            onChange={e => setFieldInput(dept, { locationInput: e.target.value })}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLocationToDept(dept))}
                                                            placeholder="or type custom"
                                                            className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 flex-1"
                                                        />
                                                        <input
                                                            type="number" min="1"
                                                            value={fi.locationVacanciesInput}
                                                            onChange={e => setFieldInput(dept, { locationVacanciesInput: e.target.value })}
                                                            placeholder="Vac"
                                                            title="Vacancies for this location"
                                                            className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 w-20 text-center"
                                                        />
                                                        <button type="button" onClick={() => addLocationToDept(dept)}
                                                            className="px-4 bg-primary/10 text-primary rounded-lg font-bold text-[10px] uppercase hover:bg-primary/20 transition-all">
                                                            Add
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {fi.locations.map((loc, li) => (
                                                            <span key={li} className="px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-bold uppercase border border-primary/10 flex items-center gap-1.5">
                                                                {loc.name} <span className="text-primary/60">({loc.vacancies})</span>
                                                                <button type="button" onClick={() => setFieldInput(dept, { locations: fi.locations.filter((_, idx) => idx !== li) })} className="text-error/60 hover:text-error">×</button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </InputField>

                                                <button type="button" onClick={() => addFieldToDept(dept)}
                                                    className="w-full py-3 border-2 border-dashed border-primary/30 text-primary rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 flex items-center justify-center gap-2 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">add</span> Add Field to {dept}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={() => setStep(2)} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep}
                                className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Review <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════ STEP 3/4 — REVIEW & LAUNCH ═══════ */}
                {step === (isLearning ? 4 : 3) && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">
                                Step 3: <span className="text-primary/60 font-medium">Review & Launch</span>
                            </h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">
                                Confirm configuration and launch the master internship.
                            </p>
                        </div>

                        {/* Summary cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white border border-outline-variant/10 rounded-xl shadow-sm space-y-4">
                                <p className="text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10 pb-2">Programme Identity</p>
                                <p className="text-xl font-black text-primary leading-tight">{formData.title}</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase">
                                        <span className="material-symbols-outlined text-sm text-primary/40">folder_managed</span>
                                        {batches.find(b => b.id === formData.batchId)?.title || formData.batchId}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase">
                                        <span className="material-symbols-outlined text-sm text-primary/40">schedule</span>
                                        {formData.duration}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase">
                                        <span className="material-symbols-outlined text-sm text-primary/40">payments</span>
                                        {formData.internshipType === 'COLLABORATIVE' ? 'Collaborative — With Stipend' : 'Learning — No Stipend'}
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
                                    {formData.participatingDepts.length} HOD notification{formData.participatingDepts.length > 1 ? 's' : ''} will be sent immediately after launch.
                                </p>
                            </div>
                        </div>

                        {/* Preferred colleges */}
                        <div className="p-6 bg-white border border-outline-variant/10 rounded-xl shadow-sm space-y-4">
                            <p className="text-[10px] font-bold text-outline uppercase tracking-widest border-b border-outline-variant/10 pb-2">
                                Preferred Colleges (Optional)
                            </p>
                            <div className="flex gap-3 mb-3">
                                <input type="text" value={preferredCollegeInput} onChange={e => setPreferredCollegeInput(e.target.value)}
                                    placeholder="e.g. IIT Madras, NIT Warangal"
                                    className="admin-input flex-1 text-sm font-bold border-outline-variant/20" />
                                <button type="button"
                                    onClick={() => { if (preferredCollegeInput.trim()) { setFormData(p => ({ ...p, preferredColleges: [...p.preferredColleges, preferredCollegeInput.trim()] })); setPreferredCollegeInput(''); } }}
                                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-[10px] uppercase hover:opacity-90">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.preferredColleges.length === 0
                                    ? <p className="text-[10px] text-outline/40 font-bold uppercase">No preferred colleges set — all colleges will be considered equally.</p>
                                    : formData.preferredColleges.map((c, i) => (
                                        <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-xs">school</span> {c}
                                            <button onClick={() => setFormData(p => ({ ...p, preferredColleges: p.preferredColleges.filter((_, idx) => idx !== i) }))} className="hover:text-error transition-colors ml-1">
                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                            </button>
                                        </span>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Required docs */}
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
                                        <button onClick={() => setRequiredDocs(prev => prev.filter((_, idx) => idx !== i))}
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
                                {(isLearning ? [
                                    { color: 'emerald', text: 'The internship goes LIVE immediately — no HOD inputs required.' },
                                    { color: 'blue', text: 'Students can browse and apply to the configured fields right away.' },
                                    { color: 'indigo', text: 'HODs review applications, shortlist, and select candidates through the Applications page.' },
                                ] : [
                                    { color: 'amber', text: `HODs of ${formData.participatingDepts.length} departments are notified by email immediately.` },
                                    { color: 'blue', text: 'Each HOD logs in and submits their problem statements (title, description, vacancies, requirements).' },
                                    { color: 'emerald', text: 'Once all HODs submit, the internship goes LIVE and becomes visible to students.' },
                                ]).map((item, i) => (
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
                            <button onClick={() => setStep(isLearning ? 3 : 2)} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={handleSubmit} disabled={loading}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/50 transition-all hover:scale-[1.01]">
                                {loading
                                    ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Launching...</>
                                    : <><span className="material-symbols-outlined text-sm">rocket_launch</span> Launch Master Internship</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateInternshipForm;
