import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
    Plus, X, ArrowLeft, Briefcase, Users, FileText, 
    MapPin, Clock, Star, Trash2, Check, Info, 
    ChevronRight, AlertTriangle, Lightbulb, FileCheck 
} from 'lucide-react';
import { collegesData } from '../../data/colleges';

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
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [departments, setDepartments] = useState([]);

    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/admin/config');
                setDepartments(res.data.data.departments || []);
            } catch (err) {
                console.error(err);
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
        topUniversityQuota: 50, // Default 50%
        priorityCollege: '',
        priorityCollegeQuota: 10, // Default 10%
        manualOpenings: ''
    });

    // Sub-states
    const [roles, setRoles] = useState([]);
    const [roleNameInput, setRoleNameInput] = useState('');
    const [roleOpeningsInput, setRoleOpeningsInput] = useState(1);
    
    const [locations, setLocations] = useState([]);
    const [locationInput, setLocationInput] = useState('');

    const [requiredDocs, setRequiredDocs] = useState([
        { id: 'RESUME', label: 'Resume / CV', type: 'PDF' },
        { id: 'PASSPORT_PHOTO', label: 'Passport Size Photo', type: 'IMAGE' }
    ]);
    const [docNameInput, setDocNameInput] = useState('');
    const [docTypeInput, setDocTypeInput] = useState('PDF');

    const totalOpenings = roles.reduce((sum, r) => sum + r.openings, 0) || parseInt(formData.manualOpenings) || 0;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
            setRequiredDocs([...requiredDocs, { id, label: docNameInput, type: docTypeInput }]);
            setDocNameInput('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/internships', {
                ...formData,
                openingsCount: totalOpenings,
                roles: roles.map(r => r.name).join(', '),
                rolesData: roles,
                location: locations.join(', '),
                requiredDocuments: requiredDocs,
                quotaPercentages: { topUniversity: parseInt(formData.topUniversityQuota) },
                priorityCollege: formData.priorityCollege || null,
                priorityCollegeQuota: parseInt(formData.priorityCollegeQuota) || 0
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create internship');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && (!formData.title || !formData.department)) {
            setError('Please fill in required basic details');
            return;
        }
        if (step === 3 && roles.length === 0) {
            setError('Add at least one role to continue');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    // Live Calculation Logic for Visualization
    const pPct = parseInt(formData.priorityCollegeQuota) || 0;
    const tPct = parseInt(formData.topUniversityQuota) || 0;
    const gPct = Math.max(0, 100 - pPct - tPct);
    
    const pSeats = Math.round((totalOpenings * pPct) / 100);
    const tSeats = Math.round((totalOpenings * tPct) / 100);
    const gSeats = Math.max(0, totalOpenings - pSeats - tSeats);

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

                            <InputField label="Target Department" required>
                                <select name="department" required value={formData.department} onChange={handleChange} className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30">
                                    <option value="">-- Select Department --</option>
                                    {departments.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </InputField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Internship Duration" required hint="Standard engagement period">
                                <select name="duration" required value={formData.duration} onChange={handleChange} className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30">
                                    <option value="">-- Select Duration --</option>
                                    <option>4 Weeks</option><option>6 Weeks</option><option>8 Weeks</option>
                                    <option>3 Months</option><option>6 Months</option>
                                </select>
                            </InputField>

                            <InputField label="Application Deadline" hint="Leave empty for no deadline">
                                <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange}
                                    className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30" />
                            </InputField>

                            <InputField label="Deployment Location" tooltip="Specify where the interns will be stationed. Leave empty if optional.">
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input list="locations-list" value={locationInput} onChange={e => setLocationInput(e.target.value)}
                                            placeholder="e.g. CSR HQ, Gachibowli" className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 flex-1" />
                                        <button type="button" onClick={() => addLocation()} className="px-4 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90">Add</button>
                                        <datalist id="locations-list">
                                            {PRESET_LOCATIONS.map(l => <option key={l} value={l} />)}
                                        </datalist>
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
                        </div>

                        <InputField label="Detailed Description" required hint="Explain what the program is about">
                            <textarea name="description" required value={formData.description} onChange={handleChange}
                                rows={4} placeholder="Briefly describe the internship objectives and scope..." className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 resize-none" />
                        </InputField>

                        <div className="pt-6 border-t border-outline-variant/10">
                            <button onClick={nextStep} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Seat Distribution <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: SEAT DISTRIBUTION */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-primary tracking-tight mb-1 uppercase tracking-[0.05em]">Step 2: <span className="text-primary/60 font-medium">Seat Distribution</span></h2>
                            <p className="text-xs text-outline font-medium uppercase tracking-wider opacity-70">Define vacancy volume and strategic allocation logic.</p>
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
                                            <span>Institutional Logic</span>
                                        </div>
                                        Important: Our automated system will pick the best candidates precisely up to this institutional limit.
                                    </div>
                                </div>
                            </InputField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                            <div className="space-y-6">
                                <InputField label="Preferred College" tooltip="Students from this specific institution will be selected first.">
                                    <div className="relative">
                                        <input list="colleges-list" name="priorityCollege" value={formData.priorityCollege} onChange={handleChange}
                                            placeholder="Search & Select College..." className="admin-input pl-12 font-bold border-outline-variant/20 focus:border-primary/30" />
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-500">grade</span>
                                        <datalist id="colleges-list">
                                            {collegesData.slice(0, 500).map((c, idx) => <option key={idx} value={c.label} />)}
                                        </datalist>
                                    </div>
                                </InputField>

                                <InputField label="Reserved for Preferred College (%)" hint={`${pPct}% of seats (${pSeats}) reserved`}>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="100" step="5" name="priorityCollegeQuota" value={pPct} onChange={handleChange} className="flex-1 accent-sky-500 h-1.5 bg-outline-variant/20 rounded-full appearance-none cursor-pointer" />
                                        <span className="w-16 text-center font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100/50 text-xs">{pPct}%</span>
                                    </div>
                                </InputField>
                            </div>

                            <div className="space-y-6">
                                <InputField label="Top Tier Institutes %" tooltip="Reservation for IIT, NIT, IIIT, and Top 100 NIRF institutes.">
                                    <div className="relative">
                                        <div className="admin-input bg-surface-container-high/50 font-bold text-outline/80 flex items-center gap-3 border-outline-variant/20">
                                            <span className="material-symbols-outlined text-primary/60">verified_user</span>
                                            <span className="text-xs uppercase tracking-tight">IIT, NIT, IIIT & NIRF ≤ 100</span>
                                        </div>
                                    </div>
                                </InputField>

                                <InputField label="Reserved for Top Colleges (%)" hint={`${tPct}% of seats (${tSeats}) reserved`}>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="100" step="5" name="topUniversityQuota" value={tPct} onChange={handleChange} className="flex-1 accent-primary h-1.5 bg-outline-variant/20 rounded-full appearance-none cursor-pointer" />
                                        <span className="w-16 text-center font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 text-xs">{tPct}%</span>
                                    </div>
                                </InputField>
                            </div>
                        </div>

                        <div className="mt-6 p-8 bg-primary rounded-xl text-white shadow-xl shadow-primary/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Fulfillment Visualizer</h3>
                                <span className={`text-[9px] font-bold px-3 py-1 rounded border uppercase tracking-widest ${pPct + tPct > 100 ? 'bg-error text-white border-error/50' : 'bg-white/10 text-white border-white/20'}`}>
                                    {pPct + tPct > 100 ? 'Quota Overflow' : 'Logic Verified'}
                                </span>
                            </div>

                            <div className="h-4 w-full flex rounded-full overflow-hidden mb-8 border-2 border-white/10 bg-white/5">
                                <div style={{ width: `${pPct}%` }} className="bg-sky-400 h-full transition-all duration-500 flex items-center justify-center text-[7px] font-bold text-sky-950 uppercase tracking-tighter">Preferred</div>
                                <div style={{ width: `${tPct}%` }} className="bg-white/90 h-full transition-all duration-500 flex items-center justify-center text-[7px] font-bold text-primary uppercase tracking-tighter">Top Tier</div>
                                <div style={{ width: `${gPct}%` }} className="bg-white/20 h-full transition-all duration-500 flex items-center justify-center text-[7px] font-bold uppercase tracking-tighter">Open Pool</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                    <p className="text-sky-300 text-3xl font-black">{pSeats}</p>
                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-tight">Institutional<br/>Preference</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white text-3xl font-black">{tSeats}</p>
                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-tight">National Tier<br/>Reserved</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white/70 text-3xl font-black">{gSeats}</p>
                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-tight">General Merit<br/>Unrestricted</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={() => setStep(1)} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} disabled={pPct + tPct > 100} className="flex-1 py-4 bg-primary disabled:opacity-50 hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
                                Continue to Roles <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: ROLES */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                            <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary font-bold text-xs">R{i+1}</div>
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

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={() => setStep(2)} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={nextStep} disabled={roles.length === 0} className="flex-1 py-4 bg-primary disabled:opacity-50 hover:bg-primary/90 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-primary/10 transition-all active:scale-[0.99]">
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
                            <div className="w-56">
                                <InputField label="Acceptable Format">
                                    <select value={docTypeInput} onChange={e => setDocTypeInput(e.target.value)} className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30">
                                        <option value="PDF">📑 PDF Only</option>
                                        <option value="IMAGE">🖼️ Image (JPG/PNG)</option>
                                    </select>
                                </InputField>
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
                                            <p className="font-bold text-primary tracking-tight text-sm uppercase">{doc.label}</p>
                                            <p className="text-[10px] text-outline font-bold uppercase tracking-widest leading-none mt-1">{doc.type} FORMAT</p>
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
                            <button onClick={() => setStep(3)} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
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
                            <InputField label="Candidate Requirements" required hint="Qualities, Skills, Academic criteria">
                                <textarea name="requirements" required value={formData.requirements} onChange={handleChange} 
                                    rows={4} placeholder="• Minimum 7.0 CGPA&#10;• Final year students preferred..." className="admin-input text-sm font-bold border-outline-variant/20 focus:border-primary/30 resize-none" />
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
                                    <span className="w-6 h-6 rounded bg-sky-100 flex items-center justify-center text-[10px] font-bold text-sky-600 shrink-0 border border-sky-200">1</span>
                                    <span>First, the system will look for students from <strong className="text-primary font-black underline decoration-sky-300 underline-offset-4">{formData.priorityCollege || 'your Preferred College'}</strong>. It will pick the top performers by CGPA up to <strong>{pPct}%</strong> of seats.</span>
                                </p>
                                <p className="flex items-start gap-4">
                                    <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-primary/20">2</span>
                                    <span>Next, it will fill the <strong>{tPct}%</strong> Top Tier quota using students from <strong>IITs, NITs, and IIITs</strong>, plus any leftover seats from step 1.</span>
                                </p>
                                <p className="flex items-start gap-4">
                                    <span className="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-outline shrink-0 border border-outline-variant/20">3</span>
                                    <span>Finally, all remaining seats will be filled by picking the <strong>highest CGPA students</strong> from any college in the pool.</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-outline-variant/10">
                            <button onClick={() => setStep(4)} className="px-6 py-4 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline hover:bg-surface-variant transition-all">Previous</button>
                            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/50 transition-all hover:scale-[1.02]">
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
