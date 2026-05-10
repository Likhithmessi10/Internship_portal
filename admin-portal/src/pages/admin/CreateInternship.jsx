import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
    Plus, X, ArrowLeft, Briefcase, Users, FileText,
    MapPin, Clock, Star, Trash2, Check, Info,
    ChevronRight, AlertTriangle, Lightbulb, FileCheck
} from 'lucide-react';
import { collegesData } from '../../data/colleges';
import departmentsData from '../../data/departments.json';
import Select from '../../components/ui/Select';
import DepartmentGroupModal from './DepartmentGroupModal';
import { useAuth } from '../../context/AuthContext';

const PRESET_LOCATIONS = [
    'ANY', 'Vijayawada HQ', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Kurnool',
    'Rajahmundry', 'Nellore', 'Kadapa', 'Anantapur', 'Eluru'
];

/**
 * Premium Input Component with High Contrast and Clear Labels
 */
const InputField = ({ label, required, hint, children, tooltip }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-1 flex items-center gap-2">
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
        {children}
        {hint && <p className="text-[9px] text-outline/70 font-bold uppercase tracking-tighter mt-1">{hint}</p>}
    </div>
);

const CreateInternshipForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    // Use departments from JSON file as default
    const [departments, setDepartments] = useState(departmentsData.departments);

    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/admin/config');
                const configDepartments = res.data.data?.departments || [];
                console.log('Config departments:', configDepartments);
                console.log('JSON departments:', departmentsData.departments);
                // Use config departments if available and not empty, otherwise use JSON
                if (configDepartments && configDepartments.length > 0) {
                    console.log('Using config departments');
                    setDepartments(configDepartments);
                } else {
                    // Config exists but departments is empty, use JSON
                    console.log('Using JSON departments (config empty)');
                    setDepartments(departmentsData.departments);
                }
            } catch (err) {
                console.error('Config fetch failed, using departments.json');
                // API failed, use JSON
                console.log('Using JSON departments (API error)');
                setDepartments(departmentsData.departments);
            }
        };
        fetchConfig();
    }, []);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        requirements: '',
        expectations: '',
        duration: '',
        applicationDeadline: '',
        stipendType: 'NON_COLLABORATIVE', // COLLABORATIVE or NON_COLLABORATIVE
        stipendAmount: '',
        manualOpenings: '',
        internshipMode: 'SINGLE',
        departmentGroups: [],
        customQuestions: [],
        requirementTags: [],
        preferredColleges: [],
        quotaPercentages: {
            preferred: 20,
            premier: 30,
            normal: 50
        },
        internshipType: 'NON_STIPEND', // COLLABORATIVE, NON_STIPEND
        fields: []
    });

    const [fieldInput, setFieldInput] = useState({
        fieldName: '',
        description: '',
        vacancies: '',
        locations: []
    });
    const [locationInput, setLocationInput] = useState('');
    const [locations, setLocations] = useState([]);

    const [questionInput, setQuestionInput] = useState('');
    const [requirementInput, setRequirementInput] = useState('');
    const [preferredCollegeInput, setPreferredCollegeInput] = useState('');

    // Sub-states
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

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    const totalOpenings = formData.internshipMode === 'GROUP' 
        ? formData.departmentGroups.reduce((sum, g) => sum + parseInt(g.openings || 0), 0)
        : roles.reduce((sum, r) => sum + r.openings, 0) || parseInt(formData.manualOpenings) || 0;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const parseCommaSeparatedValues = (value) => {
        return (value || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    };

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
        const parsedRequirements = parseCommaSeparatedValues(requirementInput);
        if (parsedRequirements.length === 0) return;

        const existing = new Set(formData.requirementTags.map(tag => tag.toLowerCase()));
        const uniqueNewTags = parsedRequirements.filter(tag => !existing.has(tag.toLowerCase()));

        if (uniqueNewTags.length > 0) {
            setFormData({
                ...formData,
                requirementTags: [...formData.requirementTags, ...uniqueNewTags]
            });
        }

        setRequirementInput('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                openingsCount: totalOpenings,
                roles: formData.internshipMode === 'SINGLE' ? roles.map(r => r.name).join(', ') : '',
                rolesData: formData.internshipMode === 'SINGLE' ? roles : [],
                location: locations.join(', '),
                requiredDocuments: requiredDocs,
                customQuestions: formData.internshipMode === 'SINGLE' ? formData.customQuestions : [],
                requirements: formData.internshipMode === 'SINGLE' ? formData.requirementTags.join(', ') : '',
                preferredColleges: formData.internshipMode === 'SINGLE' ? formData.preferredColleges : [],
                internshipType: formData.internshipType,
                fields: formData.internshipType === 'NON_STIPEND' ? formData.fields : []
            };

            if (formData.internshipMode === 'GROUP') {
                payload.department = 'MULTI';
            }

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

    const nextStep = () => {
        if (step === 1 && (!formData.title || (formData.internshipMode === 'SINGLE' && !formData.department))) {
            setError('Please fill in required basic details');
            return;
        }
        if (formData.internshipMode === 'SINGLE') {
            if (formData.internshipType !== 'NON_STIPEND') {
                if (step === 3 && roles.length === 0) {
                    setError('Add at least one role to continue');
                    return;
                }
            } else {
                if (step === 3 && formData.fields.length === 0) {
                    setError('Add at least one field to continue');
                    return;
                }
            }
        } else {
            // GROUP MODE skips step 3 and capacity of step 2
            if (step === 2 && formData.departmentGroups.length === 0) {
                setError('Add at least one department group to continue');
                return;
            }
            if (step === 2) {
                setStep(4); // Skip step 3 directly to 4 (Documents)
                return;
            }
            if (step === 4 && formData.departmentGroups.length === 0) {
                 // In case of back tracking
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        if (formData.internshipMode === 'GROUP' && step === 4) {
            setStep(2);
        } else {
            setStep(step - 1);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Programme Configuration</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Create New Internship</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                        {[1, 2, 3, 4, 5].map(s => (
                            <React.Fragment key={s}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${step === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : step > s ? 'bg-emerald-500/10 text-emerald-600' : 'bg-transparent text-outline/40'}`}>
                                    {step > s ? <span className="material-symbols-outlined text-sm">check</span> : s}
                                </div>
                                {s < 5 && <div className="w-4 h-[1px] bg-outline-variant/30" />}
                            </React.Fragment>
                        ))}
                    </div>
                    <button onClick={() => navigate('/admin/dashboard')} className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold text-outline hover:bg-surface-variant transition-colors border border-outline-variant/10">
                        <span className="material-symbols-outlined text-sm">close</span> Cancel
                    </button>
                </div>
            </section>

            <div className="bg-surface-container-low rounded-xl p-10 shadow-sm border border-outline-variant/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-outline-variant/10">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-error/5 border border-error/10 rounded-xl text-error text-xs font-bold flex items-center gap-3 animate-shake uppercase tracking-wider">
                        <span className="material-symbols-outlined">warning</span> {error}
                    </div>
                )}

                {/* STEP 1: BASIC DETAILS */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 1: <span className="text-primary/60 font-medium">Basic Information</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Programme identity and core operational parameters.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Internship Program Title" required tooltip="Visible to all students. Keep it descriptive.">
                                <input type="text" name="title" required value={formData.title} onChange={handleChange}
                                    placeholder="e.g. Graduate Engineering Trainee 2026" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                            </InputField>

                            {/* Mode Selection */}
                            {user?.role !== 'HOD' && (
                                <InputField label="Internship Mode" required tooltip="Choose Single Department or Multi-Department Group Mode">
                                    <Select
                                        value={formData.internshipMode}
                                        onChange={v => setFormData({...formData, internshipMode: v})}
                                        options={[
                                            { value: 'SINGLE', label: 'Single Department' },
                                            { value: 'GROUP', label: 'Group (Multi-Department)' }
                                        ]}
                                        size="lg"
                                    />
                                </InputField>
                            )}
                        </div>

                        {formData.internshipMode === 'SINGLE' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField label="Target Department" required>
                                    <Select
                                        value={formData.department}
                                        onChange={(value) => {
                                            handleChange({ target: { name: 'department', value } });
                                        }}
                                        options={[
                                            { value: '', label: '-- Select Department --' },
                                            ...departments.map(d => ({ value: d, label: d }))
                                        ]}
                                        placeholder="Select Department"
                                        size="lg"
                                    />
                                </InputField>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Internship Duration" required hint="Standard engagement period">
                                <Select
                                    value={formData.duration}
                                    onChange={(value) => {
                                        handleChange({ target: { name: 'duration', value } });
                                    }}
                                    options={[
                                        { value: '', label: '-- Select Duration --' },
                                        { value: '4 Weeks', label: '4 Weeks' },
                                        { value: '6 Weeks', label: '6 Weeks' },
                                        { value: '8 Weeks', label: '8 Weeks' },
                                        { value: '3 Months', label: '3 Months' },
                                        { value: '6 Months', label: '6 Months' }
                                    ]}
                                    placeholder="Select Duration"
                                    size="lg"
                                />
                            </InputField>

                            <InputField label="Internship Type" required tooltip="STIPEND/COLLABORATIVE use role-based flow. NON_STIPEND uses field-based flow.">
                                <Select
                                    value={formData.internshipType}
                                    onChange={(v) => {
                                        setFormData({
                                            ...formData, 
                                            internshipType: v,
                                            stipendType: v === 'COLLABORATIVE' ? 'COLLABORATIVE' : 'NON_COLLABORATIVE'
                                        });
                                    }}
                                    options={[
                                        { value: 'COLLABORATIVE', label: 'Collaborative (With Stipend)' },
                                        { value: 'NON_STIPEND', label: 'Non-Collaborative (No Stipend)' }
                                    ]}
                                    size="lg"
                                />
                            </InputField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {formData.internshipType === 'COLLABORATIVE' && (
                                <InputField label="Stipend Amount (₹)" hint="Monthly stipend amount in INR">
                                    <input type="number" name="stipendAmount" value={formData.stipendAmount} onChange={handleChange}
                                        placeholder="e.g. 10000" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                </InputField>
                            )}

                            <InputField label="Application Deadline" hint="Leave empty for no deadline">
                                <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange}
                                    className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                            </InputField>
                        </div>

                        <InputField label="Deployment Location" tooltip="Specify where the interns will be stationed. Leave empty if optional.">
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Select
                                        value={locationInput}
                                        onChange={setLocationInput}
                                        options={[
                                            { value: '', label: 'Select Location...' },
                                            ...PRESET_LOCATIONS.map(l => ({ value: l, label: l }))
                                        ]}
                                        placeholder="e.g. CSR HQ, Gachibowli"
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

                        <InputField label="Detailed Description" required hint="Explain what the program is about">
                            <textarea name="description" required value={formData.description} onChange={handleChange}
                                rows={4} placeholder="Briefly describe the internship objectives and scope..." className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 resize-none" />
                        </InputField>

                        <div className="pt-6 border-t border-outline-variant/10">
                            <button onClick={nextStep} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                {formData.internshipMode === 'GROUP' ? 'Continue to Department Groups' : 'Continue to Capacity & Questions'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: CAPACITY & QUESTIONS (SINGLE) OR DEPARTMENT GROUPS (GROUP) */}
                {step === 2 && formData.internshipMode === 'SINGLE' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 2: <span className="text-primary/60 font-medium">Capacity & Questions</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Define vacancy volume and custom application questions.</p>
                        </div>

                        <div className="p-8 bg-white border border-outline-variant/10 rounded-xl">
                            <InputField label="Total Available Seats" required hint="Total number of students you can accommodate">
                                <div className="flex items-center gap-6">
                                    <input
                                        type="number"
                                        name="manualOpenings"
                                        value={formData.manualOpenings}
                                        onChange={handleChange}
                                        placeholder="000"
                                        className="admin-input text-3xl font-black text-primary w-40 border-outline-variant/20 focus:border-primary/30"
                                    />
                                    <div className="flex-1 p-4 bg-primary/5 rounded-lg border border-primary/10 text-[10px] font-bold text-primary/70 leading-relaxed uppercase tracking-wide">
                                        <div className="flex items-center gap-2 mb-1 text-primary">
                                            <span className="material-symbols-outlined text-sm">lightbulb</span>
                                            <span>Manual Selection</span>
                                        </div>
                                        This program will follow a manual application review process. Define your capacity for planning purposes.
                                    </div>
                                </div>
                            </InputField>
                        </div>

                        {/* Quota Distribution Tracker */}
                        <div className="mt-8 p-8 bg-surface-container rounded-xl border border-outline-variant/10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary">pie_chart</span>
                                <div>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Seat Distribution Tracker</h3>
                                    <p className="text-[10px] text-outline/70 font-bold uppercase mt-1 tracking-widest">
                                        Use this to guide your manual selection process. Must equal 100%.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6 mb-8">
                                <InputField label={`Preferred Colleges: ${formData.quotaPercentages.preferred}%`} hint={`${Math.floor((formData.manualOpenings || 0) * (formData.quotaPercentages.preferred / 100))} seats`}>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={formData.quotaPercentages.preferred}
                                        onChange={(e) => {
                                            const pref = parseInt(e.target.value) || 0;
                                            let prem = formData.quotaPercentages.premier;
                                            if (pref + prem > 100) prem = 100 - pref;
                                            setFormData(prev => ({
                                                ...prev,
                                                quotaPercentages: { preferred: pref, premier: prem, normal: 100 - pref - prem }
                                            }));
                                        }}
                                        className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                </InputField>

                                <InputField label={`Premier (IIT/NIT): ${formData.quotaPercentages.premier}%`} hint={`${Math.floor((formData.manualOpenings || 0) * (formData.quotaPercentages.premier / 100))} seats`}>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={100 - formData.quotaPercentages.preferred} 
                                        value={formData.quotaPercentages.premier}
                                        onChange={(e) => {
                                            const prem = parseInt(e.target.value) || 0;
                                            setFormData(prev => ({
                                                ...prev,
                                                quotaPercentages: { ...prev.quotaPercentages, premier: prem, normal: 100 - prev.quotaPercentages.preferred - prem }
                                            }));
                                        }}
                                        className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </InputField>

                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Remaining Colleges</p>
                                        <p className="text-xs font-medium text-emerald-600">{Math.floor((formData.manualOpenings || 0) * (formData.quotaPercentages.normal / 100))} seats allocated</p>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-600">{formData.quotaPercentages.normal}%</span>
                                </div>
                            </div>

                            {/* Visual Progress Bar */}
                            {(() => {
                                const total = formData.quotaPercentages.preferred + formData.quotaPercentages.premier + formData.quotaPercentages.normal;
                                return (
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Distribution Overview</span>
                                            <span className="text-xs font-black text-emerald-600">{total}% Allocated</span>
                                        </div>
                                        <div className="w-full h-3 rounded-full flex overflow-hidden bg-surface-container-high border border-outline-variant/10">
                                            <div className="bg-amber-400 h-full transition-all" style={{ width: `${formData.quotaPercentages.preferred}%` }} title={`Preferred: ${formData.quotaPercentages.preferred}%`}></div>
                                            <div className="bg-indigo-500 h-full transition-all" style={{ width: `${formData.quotaPercentages.premier}%` }} title={`Premier: ${formData.quotaPercentages.premier}%`}></div>
                                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${formData.quotaPercentages.normal}%` }} title={`Normal: ${formData.quotaPercentages.normal}%`}></div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* NEW: Preferred Colleges Section */}
                        <div className="mt-8 p-8 bg-surface-container rounded-xl border border-outline-variant/10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary">account_balance</span>
                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Preferred Colleges</h3>
                            </div>
                            <p className="text-[10px] text-outline/70 font-bold uppercase mb-4">Add colleges to prioritize their students during the review process.</p>
                            
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <input type="text" value={preferredCollegeInput} onChange={e => setPreferredCollegeInput(e.target.value)}
                                        placeholder="e.g. IIT Madras, NIT Warangal" className="admin-input text-sm font-bold border-outline-variant/20" />
                                </div>
                                <button type="button" onClick={() => {
                                    if(preferredCollegeInput.trim()){
                                        setFormData({...formData, preferredColleges: [...formData.preferredColleges, preferredCollegeInput.trim()]});
                                        setPreferredCollegeInput('');
                                    }
                                }} className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase">Add College</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.preferredColleges.map((college, i) => (
                                    <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-xs">school</span> {college}
                                        <button onClick={() => setFormData({...formData, preferredColleges: formData.preferredColleges.filter((_, idx) => idx !== i)})} className="hover:text-error transition-colors ml-1">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                                {formData.preferredColleges.length === 0 && (
                                    <p className="w-full text-center py-4 text-outline/30 text-[10px] font-bold uppercase tracking-widest border border-dashed border-outline-variant/30 rounded-lg">No preferred colleges added.</p>
                                )}
                            </div>
                        </div>

                        {/* NEW: Custom Student Questions Section */}
                        <div className="mt-8 p-8 bg-surface-container rounded-xl border border-outline-variant/10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary">quiz</span>
                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Application Questions for Students</h3>
                            </div>
                            <p className="text-[10px] text-outline/70 font-bold uppercase mb-4">Add questions that students must answer during the application process.</p>
                            
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <input type="text" value={questionInput} onChange={e => setQuestionInput(e.target.value)}
                                        placeholder="e.g. Why are you interested in this internship?" className="admin-input text-sm font-bold border-outline-variant/20" />
                                </div>
                                <button type="button" onClick={() => {
                                    if(questionInput.trim()){
                                        setFormData({...formData, customQuestions: [...formData.customQuestions, questionInput.trim()]});
                                        setQuestionInput('');
                                    }
                                }} className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase">Add Question</button>
                            </div>
                            <div className="space-y-2">
                                {formData.customQuestions.map((q, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-outline-variant/10 rounded-lg">
                                        <p className="text-xs font-bold text-primary">Q{i+1}: {q}</p>
                                        <button onClick={() => setFormData({...formData, customQuestions: formData.customQuestions.filter((_, idx) => idx !== i)})} className="text-error">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))}
                                {formData.customQuestions.length === 0 && (
                                    <p className="text-center py-4 text-outline/30 text-[10px] font-bold uppercase tracking-widest border border-dashed border-outline-variant/30 rounded-lg">No custom questions added yet.</p>
                                )}
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

                {/* STEP 2: DEPARTMENT GROUPS (GROUP MODE) */}
                {step === 2 && formData.internshipMode === 'GROUP' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 2: <span className="text-primary/60 font-medium">Department Groups</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Add participating departments, capacities, and custom requirements.</p>
                        </div>

                        <div className="space-y-4">
                            <button onClick={() => setIsGroupModalOpen(true)} className="w-full p-6 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-3xl">add_business</span>
                                <span className="text-sm uppercase tracking-widest">Add Department Group</span>
                            </button>

                            {formData.departmentGroups.map((g, i) => (
                                <div key={i} className="p-6 bg-white border border-outline-variant/20 rounded-xl shadow-sm flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-primary text-lg">{g.title || `${g.department} Internship`}</h3>
                                        <div className="flex gap-4 mt-2 text-xs font-bold text-outline">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">domain</span> {g.department}</span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span> {g.openings} Openings</span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">badge</span> {g.rolesData.length} Roles</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setFormData({...formData, departmentGroups: formData.departmentGroups.filter((_, idx) => idx !== i)})} className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} disabled={formData.departmentGroups.length === 0} className="flex-1 py-4 bg-primary disabled:opacity-50 hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Documents <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>

                        <DepartmentGroupModal 
                            isOpen={isGroupModalOpen} 
                            onClose={() => setIsGroupModalOpen(false)} 
                            departments={departments}
                            internshipType={formData.internshipType}
                            onSave={(groupData) => {
                                setFormData({...formData, departmentGroups: [...formData.departmentGroups, groupData]});
                                setIsGroupModalOpen(false);
                            }}
                        />
                    </div>
                )}

                {/* STEP 3: ROLES OR FIELDS */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {formData.internshipType !== 'NON_STIPEND' ? (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 3: <span className="text-primary/60 font-medium">Available Roles</span></h2>
                                    <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Assign seats to specific positions within the programme.</p>
                                </div>

                                <div className="p-8 bg-white border border-outline-variant/10 rounded-xl flex flex-col md:flex-row gap-6">
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
                                            <p className="text-outline/50 font-bold uppercase text-[10px] tracking-widest leading-loose">No active roles defined. Assign at least one position to proceed with institutional configuration.</p>
                                        </div>
                                    ) : (
                                        roles.map((r, i) => (
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
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 3: <span className="text-primary/60 font-medium">Available Fields</span></h2>
                                    <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Define technical fields and locations for Non-Stipend internship.</p>
                                </div>

                                <div className="p-8 bg-white border border-outline-variant/10 rounded-xl space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField label="Field Name">
                                            <input type="text" value={fieldInput.fieldName} onChange={e => setFieldInput({...fieldInput, fieldName: e.target.value})}
                                                placeholder="e.g. Transmission Operations" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                        </InputField>
                                        <InputField label="Vacancies">
                                            <input type="number" min="1" value={fieldInput.vacancies} onChange={e => setFieldInput({...fieldInput, vacancies: e.target.value})}
                                                className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                        </InputField>
                                    </div>
                                    <InputField label="Field Description">
                                        <textarea value={fieldInput.description} onChange={e => setFieldInput({...fieldInput, description: e.target.value})}
                                            rows="2" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                    </InputField>
                                    
                                    <div className="space-y-4">
                                        <InputField label="Available Locations">
                                            <div className="flex gap-4">
                                                <input type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)}
                                                    placeholder="e.g. Vijayawada" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                                <button type="button" onClick={() => {
                                                    if(locationInput.trim()){
                                                        setFieldInput({...fieldInput, locations: [...fieldInput.locations, locationInput.trim()]});
                                                        setLocationInput('');
                                                    }
                                                }} className="h-[46px] px-6 bg-primary/10 text-primary rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all">Add Location</button>
                                            </div>
                                        </InputField>
                                        <div className="flex flex-wrap gap-2">
                                            {fieldInput.locations.map((loc, i) => (
                                                <span key={i} className="px-3 py-1 bg-surface-variant text-outline rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                                    {loc} <button onClick={() => setFieldInput({...fieldInput, locations: fieldInput.locations.filter((_, idx) => idx !== i)})} className="text-error">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="button" onClick={() => {
                                        if(fieldInput.fieldName && fieldInput.vacancies && fieldInput.locations.length > 0){
                                            setFormData({...formData, fields: [...formData.fields, fieldInput]});
                                            setFieldInput({fieldName: '', description: '', vacancies: '', locations: []});
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
                                    ) : (
                                        formData.fields.map((f, i) => (
                                            <div key={i} className="p-5 bg-white border border-outline-variant/10 rounded-xl shadow-sm group relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-primary text-lg tracking-tight uppercase">{f.fieldName}</h3>
                                                        <p className="text-[10px] text-outline/60 font-bold uppercase tracking-widest mt-1">{f.vacancies} Vacancies available</p>
                                                    </div>
                                                    <button onClick={() => setFormData({...formData, fields: formData.fields.filter((_, idx) => idx !== i)})} className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {f.locations.map((loc, li) => (
                                                        <span key={li} className="px-2 py-1 bg-primary/5 text-primary rounded-md text-[9px] font-bold uppercase tracking-wider border border-primary/10">{loc}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} disabled={formData.internshipType !== 'NON_STIPEND' ? roles.length === 0 : formData.fields.length === 0} className="flex-1 py-4 bg-primary disabled:opacity-50 hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Documents <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: REQUIRED DOCUMENTS */}
                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 4: <span className="text-primary/60 font-medium">Required Documents</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Specify mandatory evidentiary submissions for candidates.</p>
                        </div>

                        <div className="p-8 bg-white border border-outline-variant/10 rounded-xl flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <InputField label="Document Name (e.g. NOC Letter)">
                                    <input type="text" value={docNameInput} onChange={e => setDocNameInput(e.target.value)}
                                        placeholder="Enter document name..." className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                                </InputField>
                            </div>
                            <div className="w-56 flex items-end gap-6">
                                <InputField label="Format">
                                    <Select
                                        value={docTypeInput}
                                        onChange={setDocTypeInput}
                                        options={[
                                            { value: 'PDF', label: '📑 PDF Only' },
                                            { value: 'IMAGE', label: '🖼️ Image (JPG/PNG)' }
                                        ]}
                                        size="md"
                                    />
                                </InputField>
                                <div className="mb-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="mandatory-doc"
                                        checked={docMandatoryInput}
                                        onChange={e => setDocMandatoryInput(e.target.checked)}
                                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                                    />
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
                                            <p className="text-[10px] text-outline font-bold uppercase tracking-widest leading-none mt-1">
                                                {doc.type} FORMAT • {doc.mandatory ? 'Mandatory' : 'Optional'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setRequiredDocs(requiredDocs.filter((_, idx) => idx !== i))}
                                        className="p-2 text-outline/40 hover:text-error transition-colors opacity-0 group-hover:opacity-100">
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

                {/* STEP 5: FINAL PREVIEW */}
                {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 5: <span className="text-primary/60 font-medium">Finalize & Preview</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Review programmatic parameters and establish skill matrices.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Required Technical Skills / Qualifications" required hint="Add skills one by one (e.g. React, Python, Data Entry)">
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={requirementInput} 
                                            onChange={e => setRequirementInput(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                            placeholder="Enter a skill and press Enter..." 
                                            className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={addRequirement}
                                            className="px-6 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-surface-container-high/20 rounded-xl border border-dashed border-outline-variant/30">
                                        {formData.requirementTags.length === 0 && (
                                            <p className="text-[10px] text-outline/40 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Star size={12} /> Add at least 3-5 key skills for best auto-shortlisting results
                                            </p>
                                        )}
                                        {formData.requirementTags.map((tag, i) => (
                                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm animate-in zoom-in-95 duration-200">
                                                {tag}
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormData({
                                                        ...formData, 
                                                        requirementTags: formData.requirementTags.filter((_, idx) => idx !== i)
                                                    })} 
                                                    className="hover:text-amber-300 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </InputField>
                            <InputField label="Learn & Do (Job Description)" required hint="What the intern will actually do">
                                <textarea name="expectations" required value={formData.expectations} onChange={handleChange}
                                    rows={4} placeholder="• Assist in network monitoring&#10;• Hands-on with substation field work..." className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 resize-none" />
                            </InputField>
                        </div>

                        <div className="p-8 bg-surface-container-high/30 rounded-xl border border-outline-variant/20">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">info</span> Selection Architecture
                            </h3>
                            <div className="space-y-4 text-[11px] font-bold text-outline/80 leading-relaxed uppercase tracking-tight">
                                <p className="flex items-start gap-4">
                                    <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-primary/20">1</span>
                                    <span>Applications will be collected until the deadline.</span>
                                </p>
                                <p className="flex items-start gap-4">
                                    <span className="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-outline shrink-0 border border-outline-variant/20">2</span>
                                    <span>The committee will manually review each candidate's profile, resume, and answers to custom questions.</span>
                                </p>
                                <p className="flex items-start gap-4">
                                    <span className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 shrink-0 border border-emerald-200">3</span>
                                    <span>Final shortlisting and hiring decisions will be made based on manual evaluation.</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={prevStep} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/50 transition-all hover:scale-[1.02]">
                                {loading ? <span className="animate-pulse">Deploying Program...</span> : <><span className="material-symbols-outlined">rocket_launch</span> Launch Internship Program</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default CreateInternshipForm;
