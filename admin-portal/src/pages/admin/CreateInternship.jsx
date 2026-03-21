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
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-indigo-200 uppercase tracking-tight">
            {label} {required && <span className="text-red-500">*</span>}
            {tooltip && (
                <div className="group relative cursor-help">
                    <Info size={14} className="text-indigo-400" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl font-medium">
                        {tooltip}
                    </div>
                </div>
            )}
        </label>
        {children}
        {hint && <p className="text-[11px] text-slate-400 font-bold italic mt-1.5">{hint}</p>}
    </div>
);

const CreateInternshipForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

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
        <div className="max-w-4xl mx-auto pb-20">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1" /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                                {step > s ? <Check size={14} /> : s}
                            </div>
                            {s < 5 && <div className={`w-8 h-1 mx-1 rounded-full ${step > s ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] p-10 shadow-2xl shadow-indigo-100/50 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-3 animate-shake">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                {/* STEP 1: BASIC DETAILS */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">Step 1: <span className="text-indigo-600">Basic Information</span></h2>
                            <p className="text-slate-400 font-medium">Tell us about the internship program and its core details.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Internship Program Title" required tooltip="Visible to all students. Keep it descriptive.">
                                <input type="text" name="title" required value={formData.title} onChange={handleChange}
                                    placeholder="e.g. Software Engineering Apprenticeship 2026" className="admin-input text-lg font-bold" />
                            </InputField>

                            <InputField label="Department / Category" required>
                                <select name="department" required value={formData.department} onChange={handleChange} className="admin-input font-bold">
                                    <option value="">-- Choose Category --</option>
                                    <option value="TECHNICAL">⚙️ TECHNICAL (Engineering, IT, R&D)</option>
                                    <option value="NON-TECHNICAL">💼 NON-TECHNICAL (Finance, HR, Admin)</option>
                                </select>
                            </InputField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Internship Duration" required hint="Standard engagement period">
                                <select name="duration" required value={formData.duration} onChange={handleChange} className="admin-input font-bold">
                                    <option value="">-- Select Duration --</option>
                                    <option>4 Weeks</option><option>6 Weeks</option><option>8 Weeks</option>
                                    <option>3 Months</option><option>6 Months</option>
                                </select>
                            </InputField>

                            <InputField label="Application Deadline" hint="Leave empty for no deadline">
                                <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange}
                                    className="admin-input" />
                            </InputField>
                        </div>

                        <InputField label="Detailed Description" required hint="Explain what the program is about">
                            <textarea name="description" required value={formData.description} onChange={handleChange}
                                rows={4} placeholder="Briefly describe the internship objectives..." className="admin-input resize-none" />
                        </InputField>

                        <div className="pt-6">
                            <button onClick={nextStep} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-95">
                                Continue to Seat Distribution <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: SEAT DISTRIBUTION */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">Step 2: <span className="text-amber-500">Seat Distribution</span></h2>
                            <p className="text-slate-400 font-medium italic">Define how many students you want and who should be selected first.</p>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-950/40 rounded-[2rem] border border-slate-100 dark:border-white/5">
                            <InputField label="Total Available Seats" required hint="Total number of students you can accommodate">
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="number" 
                                        name="manualOpenings" 
                                        value={formData.manualOpenings} 
                                        onChange={handleChange}
                                        placeholder="Enter total seats (e.g. 100)" 
                                        className="admin-input text-2xl font-black text-indigo-600 w-48" 
                                    />
                                    <div className="flex-1 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 text-[11px] font-bold text-indigo-700 leading-relaxed uppercase">
                                        <Lightbulb size={16} className="mb-1" />
                                        Important: Our automated system will pick the best candidates precisely up to this limit.
                                    </div>
                                </div>
                            </InputField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                            <div className="space-y-6">
                                <InputField label="Preferred College" tooltip="Students from this specific institution will be selected first.">
                                    <div className="relative">
                                        <input list="colleges-list" name="priorityCollege" value={formData.priorityCollege} onChange={handleChange}
                                            placeholder="Search & Select College..." className="admin-input pl-12 font-bold border-amber-200 bg-amber-50/20" />
                                        <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                                        <datalist id="colleges-list">
                                            {collegesData.slice(0, 500).map((c, idx) => <option key={idx} value={c.label} />)}
                                        </datalist>
                                    </div>
                                </InputField>

                                <InputField label="Reserved for Preferred College (%)" hint={`${pPct}% of seats (${pSeats}) reserved`}>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="100" step="5" name="priorityCollegeQuota" value={pPct} onChange={handleChange} className="flex-1 accent-amber-500 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                                        <span className="w-16 text-center font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-xl">{pPct}%</span>
                                    </div>
                                </InputField>
                            </div>

                            <div className="space-y-6">
                                <InputField label="Top Tier Institutes %" tooltip="Reservation for IIT, NIT, IIIT, and Top 100 NIRF institutes.">
                                    <div className="relative">
                                        <div className="admin-input bg-indigo-50/30 font-bold text-slate-600 flex items-center gap-3">
                                            <ShieldCheck size={20} className="text-indigo-600" />
                                            IIT, NIT, IIIT & NIRF ≤ 100
                                        </div>
                                    </div>
                                </InputField>

                                <InputField label="Reserved for Top Colleges (%)" hint={`${tPct}% of seats (${tSeats}) reserved`}>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="100" step="5" name="topUniversityQuota" value={tPct} onChange={handleChange} className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                                        <span className="w-16 text-center font-black text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-xl">{tPct}%</span>
                                    </div>
                                </InputField>
                            </div>
                        </div>

                        <div className="mt-6 p-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Selection Visualizer</h3>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${pPct + tPct > 100 ? 'bg-red-500 text-white border-red-400' : 'bg-emerald-500 text-white border-emerald-400'}`}>
                                    {pPct + tPct > 100 ? '⚠️ TOTAL EXCEEDS 100%' : '✅ SCALE VALID'}
                                </span>
                            </div>

                            <div className="h-6 w-full flex rounded-full overflow-hidden mb-8 border-4 border-white/5">
                                <div style={{ width: `${pPct}%` }} className="bg-amber-400 h-full transition-all duration-500 flex items-center justify-center text-[8px] font-black text-amber-950">PREFERRED</div>
                                <div style={{ width: `${tPct}%` }} className="bg-indigo-500 h-full transition-all duration-500 flex items-center justify-center text-[8px] font-black">TOP COLLEGES</div>
                                <div style={{ width: `${gPct}%` }} className="bg-slate-700 h-full transition-all duration-500 flex items-center justify-center text-[8px] font-black">GENERAL MERIT</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-amber-400 text-2xl font-black">{pSeats}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Preferred College Students</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-indigo-400 text-2xl font-black">{tSeats}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Top Tier Institute Students</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-200 text-2xl font-black">{gSeats}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">General Merit (Any College)</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setStep(1)} className="px-8 py-5 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Back</button>
                            <button onClick={nextStep} disabled={pPct + tPct > 100} className="flex-1 py-5 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all">
                                Continue to Roles <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: ROLES */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">Step 3: <span className="text-emerald-500">Available Roles</span></h2>
                            <p className="text-slate-400 font-medium italic">Assign seats to specific positions within the internship.</p>
                        </div>

                        <div className="p-8 bg-emerald-50/30 rounded-[2rem] border border-emerald-100 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <InputField label="Role/Position Name">
                                    <input type="text" value={roleNameInput} onChange={e => setRoleNameInput(e.target.value)}
                                        placeholder="e.g. Graduate Engineer Trainee" className="admin-input font-bold" />
                                </InputField>
                            </div>
                            <div className="w-48">
                                <InputField label="Seats for this Role">
                                    <input type="number" min="1" value={roleOpeningsInput} onChange={e => setRoleOpeningsInput(e.target.value)}
                                        className="admin-input font-black" />
                                </InputField>
                            </div>
                            <div className="flex items-end">
                                <button type="button" onClick={addRole} className="h-[52px] px-8 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all">
                                    <Plus size={20} /> Add Role
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {roles.length === 0 ? (
                                <div className="p-10 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                                    <Users size={32} className="mx-auto mb-4 text-slate-200" />
                                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No roles added yet. Add at least one to continue.</p>
                                </div>
                            ) : (
                                roles.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-black tracking-tighter">R{i+1}</div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tighter">{r.name}</p>
                                                <p className="text-xs text-slate-400 font-bold">{r.openings} Positions available</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setRoles(roles.filter((_, idx) => idx !== i))} className="p-3 text-red-100 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setStep(2)} className="px-8 py-5 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Back</button>
                            <button onClick={nextStep} disabled={roles.length === 0} className="flex-1 py-5 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all">
                                Continue to Documents <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: REQUIRED DOCUMENTS (NEW) */}
                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">Step 4: <span className="text-rose-500">Required Documents</span></h2>
                            <p className="text-slate-400 font-medium italic">Specify exactly what documents candidates must upload to apply.</p>
                        </div>

                        <div className="p-8 bg-rose-50/30 rounded-[2rem] border border-rose-100 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <InputField label="Document Name (e.g. NOC Letter)">
                                    <input type="text" value={docNameInput} onChange={e => setDocNameInput(e.target.value)}
                                        placeholder="Enter document name..." className="admin-input font-bold" />
                                </InputField>
                            </div>
                            <div className="w-48">
                                <InputField label="Acceptable Format">
                                    <select value={docTypeInput} onChange={e => setDocTypeInput(e.target.value)} className="admin-input font-black">
                                        <option value="PDF">📑 PDF Only</option>
                                        <option value="IMAGE">🖼️ Image (JPG/PNG)</option>
                                    </select>
                                </InputField>
                            </div>
                            <div className="flex items-end">
                                <button type="button" onClick={addDoc} className="h-[52px] px-8 bg-rose-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all">
                                    <Plus size={20} /> Add Requirement
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {requiredDocs.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${doc.type === 'PDF' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {doc.type === 'PDF' ? <FileText size={18} /> : <FileCheck size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 uppercase tracking-tighter text-sm">{doc.label}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{doc.type} FORMAT</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setRequiredDocs(requiredDocs.filter((_, idx) => idx !== i))} 
                                        className="p-3 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setStep(3)} className="px-8 py-5 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Back</button>
                            <button onClick={nextStep} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all">
                                Finalize & Preview <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 5: FINAL PREVIEW */}
                {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">Step 5: <span className="text-sky-500">Finalize & Preview</span></h2>
                            <p className="text-slate-400 font-medium italic">Review everything and set candidate requirements.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Candidate Requirements" required hint="Qualities, Skills, Academic criteria">
                                <textarea name="requirements" required value={formData.requirements} onChange={handleChange} 
                                    rows={4} placeholder="• Minimum 7.0 CGPA&#10;• Final year students preferred..." className="admin-input resize-none" />
                            </InputField>
                            <InputField label="Learn & Do (Job Description)" required hint="What the intern will actually do">
                                <textarea name="expectations" required value={formData.expectations} onChange={handleChange}
                                    rows={4} placeholder="• Assist in network monitoring&#10;• Hands-on with substation field work..." className="admin-input resize-none" />
                            </InputField>
                        </div>

                        <div className="p-8 bg-sky-50/30 rounded-[2.5rem] border border-sky-100/50">
                            <h3 className="text-sm font-black text-sky-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info size={16} /> How your selection will happen
                            </h3>
                            <div className="space-y-4 text-sm font-medium text-slate-600 leading-relaxed">
                                <p className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                                    <span>First, the system will look for students from <strong className="text-sky-900 font-black underline decoration-sky-300 underline-offset-4">{formData.priorityCollege || 'your Preferred College'}</strong>. It will pick the top performers by CGPA up to <strong>{pPct}%</strong> of seats.</span>
                                </p>
                                <p className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                                    <span>Next, it will fill the <strong>{tPct}%</strong> Top Tier quota using students from <strong>IITs, NITs, and IIITs</strong>, plus any leftover seats from step 1.</span>
                                </p>
                                <p className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                                    <span>Finally, all remaining seats will be filled by picking the <strong>highest CGPA students</strong> from any college in the pool.</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setStep(4)} className="px-8 py-5 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Back</button>
                            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-300 transition-all hover:scale-[1.02]">
                                {loading ? <span className="animate-pulse">Launching Program...</span> : <><Briefcase size={20} /> Launch Internship Program</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ShieldCheck = ({ size, className }) => (
    <div className={className}>
        <div className="relative group">
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
    </div>
);

export default CreateInternshipForm;
