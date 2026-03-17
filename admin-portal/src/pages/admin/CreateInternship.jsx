import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Plus, X, ArrowLeft, Briefcase, Users, FileText, MapPin, Clock, Star } from 'lucide-react';
import { collegesData } from '../../data/colleges';

const PRESET_LOCATIONS = [
    'ANY', 'Vijayawada HQ', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Kurnool',
    'Rajahmundry', 'Nellore', 'Kadapa', 'Anantapur', 'Eluru'
];

const InputField = ({ label, required, hint, children }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

const CreateInternshipForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Role capacities
    const [roleNameInput, setRoleNameInput] = useState('');
    const [roleOpeningsInput, setRoleOpeningsInput] = useState(1);
    const [roleQuotaInput, setRoleQuotaInput] = useState(50); // Default 50% for the role
    const [roles, setRoles] = useState([]); // [{name, openings, topUnivQuota}]

    // Location chips
    const [locationInput, setLocationInput] = useState('');
    const [locations, setLocations] = useState([]);

    const [requiredDocs, setRequiredDocs] = useState(['RESUME', 'NOC_LETTER', 'PASSPORT_PHOTO']); // Default common ones
    const availableDocs = [
        { id: 'RESUME', label: 'Resume / CV' },
        { id: 'NOC_LETTER', label: 'No Objection Certificate (NOC)' },
        { id: 'PRINCIPAL_LETTER', label: 'Principal Recommendation' },
        { id: 'HOD_LETTER', label: 'HOD Recommendation' },
        { id: 'MARKSHEET', label: 'Educational Marksheets' },
        { id: 'PASSPORT_PHOTO', label: 'Passport Size Photo' },
    ];

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
        priorityCollegeQuota: 10, // Default 10% for priority college
        manualOpenings: ''
    });

    const toggleDoc = (id) => {
        if (requiredDocs.includes(id)) setRequiredDocs(requiredDocs.filter(x => x !== id));
        else setRequiredDocs([...requiredDocs, id]);
    };

    const totalOpenings = roles.reduce((sum, r) => sum + r.openings, 0);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Roles
    const addRole = (name) => {
        const rName = (name || roleNameInput).trim();
        const rOpens = parseInt(roleOpeningsInput);
        const rQuota = parseInt(roleQuotaInput);
        if (rName && rOpens > 0 && !roles.find(r => r.name === rName)) {
            setRoles([...roles, { name: rName, openings: rOpens, topUnivQuota: rQuota }]);
        }
        setRoleNameInput('');
        setRoleOpeningsInput(1);
        setRoleQuotaInput(50);
    };
    const removeRole = (name) => setRoles(roles.filter(x => x.name !== name));

    // Locations
    const addLocation = (loc) => {
        const l = (loc || locationInput).trim();
        if (!l) return;
        if (l === 'ANY') { setLocations(['ANY']); setLocationInput(''); return; }
        const next = locations.filter(x => x !== 'ANY');
        if (!next.includes(l)) setLocations([...next, l]);
        setLocationInput('');
    };
    const removeLocation = (l) => setLocations(locations.filter(x => x !== l));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (roles.length === 0) { setError('Please add at least one available role.'); return; }
        if (locations.length === 0) { setError('Please select at least one location.'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/admin/internships', {
                ...formData,
                openingsCount: parseInt(formData.manualOpenings) || totalOpenings,
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

    return (
        <div className="max-w-3xl mx-auto">
            {/* Premium Header/Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-[2.5rem] p-8 mb-6 text-white shadow-2xl relative overflow-hidden group border border-white/5 dark:border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate('/dashboard')} className="w-12 h-12 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner hover:bg-white/20 transition-all hover:rotate-6">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black font-rajdhani mb-1 text-white uppercase tracking-tighter">
                                Create <span className="text-amber-400">Internship</span>
                            </h1>
                            <p className="text-indigo-200/70 font-medium text-sm tracking-wide uppercase text-[10px] font-bold tracking-[0.3em]">
                                Post a new internship opportunity
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2">
                    <X size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Basic Info */}
                <div className="admin-card">
                    <h2 className="text-base font-bold text-gray-800 dark:text-indigo-100 mb-5 flex items-center gap-2">
                        <Briefcase size={16} className="text-indigo-500" /> Basic Information
                    </h2>
                    <div className="space-y-5">
                        <InputField label="Internship Title" required>
                            <input type="text" name="title" required value={formData.title} onChange={handleChange}
                                placeholder="e.g. Software Engineering Internship" className="admin-input" />
                        </InputField>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Department" required>
                                <select name="department" required value={formData.department} onChange={handleChange} className="admin-input font-bold">
                                    <option value="">-- Select --</option>
                                    <option value="TECHNICAL">TECHNICAL</option>
                                    <option value="NON-TECHNICAL">NON-TECHNICAL</option>
                                </select>
                            </InputField>
                            <InputField label="Total Openings" required hint="Manual override or auto-calc">
                                <input 
                                    type="number" 
                                    name="manualOpenings"
                                    value={formData.manualOpenings || totalOpenings}
                                    onChange={handleChange}
                                    placeholder={totalOpenings.toString()}
                                    className="admin-input font-black text-indigo-600 dark:text-indigo-400"
                                />
                            </InputField>
                            <InputField label="Application Deadline" hint="Optional">
                                <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange}
                                    className="admin-input" />
                            </InputField>
                        </div>
                        <InputField label="Description" required>
                            <textarea name="description" required value={formData.description} onChange={handleChange}
                                rows={4} placeholder="Describe the internship programme..." className="admin-input resize-none" />
                        </InputField>
                    </div>
                </div>

                {/* Roles */}
                <div className="admin-card">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" /> Available Roles & Capacities
                    </h2>
                    
                    <p className="text-xs text-gray-400 mb-5 font-medium">Define the specific positions available within this internship. Set a unique quota % for each role if needed.</p>

                    <div className="space-y-4 mb-4 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-white/5">
                        <div>
                            <label className="block text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <Plus size={12} /> Role Name
                            </label>
                            <input type="text" value={roleNameInput} onChange={e => setRoleNameInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole())}
                                placeholder="e.g. Graduate Engineer Trainee, Finance Analyst..." className="admin-input font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Openings</label>
                                <input type="number" min="1" value={roleOpeningsInput} onChange={e => setRoleOpeningsInput(e.target.value)}
                                    className="admin-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Top Univ. Quota: {roleQuotaInput}%</label>
                                <input type="range" min="0" max="100" step="5" value={roleQuotaInput} onChange={e => setRoleQuotaInput(e.target.value)}
                                    className="w-full h-8 accent-indigo-600" />
                            </div>
                        </div>
                        <button type="button" onClick={() => addRole()}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm flex items-center gap-2 justify-center shadow-md">
                            <Plus size={16} /> Add Role to Internship
                        </button>
                    </div>

                    {roles.length > 0 && (
                        <div className="flex flex-col gap-3 mt-6">
                            {roles.map(r => (
                                <div key={r.name} className="flex items-center justify-between pl-6 pr-4 py-4 bg-white/50 dark:bg-slate-900/40 border border-indigo-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex flex-col">
                                        <span className="text-base font-black text-gray-800 dark:text-indigo-200">{r.name}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest">
                                                Top Univ. Quota: {r.topUnivQuota}%
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-700" />
                                            <span className="text-[10px] text-gray-400 font-bold">{r.openings} Positions</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => removeRole(r.name)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Requirements & Expectations */}
                <div className="admin-card">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                        <FileText size={16} className="text-indigo-500" /> Requirements & Expectations
                    </h2>
                    <div className="space-y-5">
                        <InputField label="Candidate Requirements" required hint="Qualifications, skills, CGPA etc.">
                            <textarea name="requirements" required value={formData.requirements} onChange={handleChange}
                                rows={4} placeholder="• Min CGPA 7.0&#10;• EEE / ECE preferred&#10;• Basic electrical knowledge" className="admin-input resize-none" />
                        </InputField>
                        <InputField label="What Interns Will Do / Learn" required hint="Expectations & daily tasks">
                            <textarea name="expectations" required value={formData.expectations} onChange={handleChange}
                                rows={4} placeholder="• Work in substations&#10;• SCADA monitoring&#10;• Weekly technical sessions" className="admin-input resize-none" />
                        </InputField>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Required Documents for Application</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableDocs.map(doc => (
                                    <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${requiredDocs.includes(doc.id) ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 ring-1 ring-indigo-200 dark:ring-indigo-500/20' : 'bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'}`}>
                                        <input
                                            type="checkbox"
                                            checked={requiredDocs.includes(doc.id)}
                                            onChange={() => toggleDoc(doc.id)}
                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-slate-700 focus:ring-indigo-500"
                                        />
                                        <span className={`text-sm font-semibold ${requiredDocs.includes(doc.id) ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-slate-400'}`}>{doc.label}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-wider">Students will only see upload fields for these selected documents</p>
                        </div>
                    </div>
                </div>

                {/* Locations */}
                <div className="admin-card">
                    <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-500" /> Locations
                    </h2>
                    <p className="text-xs text-gray-400 mb-3">Click a preset or type a custom location. Select "ANY" to accept all locations.</p>

                    {/* Preset quick-add buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {PRESET_LOCATIONS.map(l => (
                            <button key={l} type="button" onClick={() => addLocation(l)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
                                    ${locations.includes(l)
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                                    } ${l === 'ANY' ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : ''}`}>
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* Custom input */}
                    <div className="flex gap-2">
                        <input type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                            placeholder="Custom location..." className="admin-input flex-1" />
                        <button type="button" onClick={() => addLocation()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm flex items-center gap-1">
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    {/* Selected chips */}
                    {locations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {locations.map(l => (
                                <span key={l} className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-semibold
                                    ${l === 'ANY' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                    <MapPin size={11} /> {l}
                                    <button type="button" onClick={() => removeLocation(l)} className="hover:bg-gray-200 rounded-full p-0.5"><X size={11} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logistics */}
                <div className="admin-card">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                        <Clock size={16} className="text-indigo-500" /> Duration & Openings
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <InputField label="Duration" required>
                            <select name="duration" required value={formData.duration} onChange={handleChange} className="admin-input font-bold">
                                <option value="">-- Select --</option>
                                <option>4 Weeks</option><option>6 Weeks</option><option>8 Weeks</option>
                                <option>3 Months</option><option>6 Months</option>
                            </select>
                        </InputField>
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Top Priority College" hint="Nominate for absolute priority (Optional)">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Star size={16} className="text-amber-400" />
                                    </div>
                                    <input 
                                        list="colleges-list"
                                        name="priorityCollege"
                                        value={formData.priorityCollege}
                                        onChange={handleChange}
                                        placeholder="Search college..."
                                        className="admin-input pl-11 font-bold border-amber-200/50 bg-amber-50/10 focus:ring-amber-400"
                                    />
                                    <datalist id="colleges-list">
                                        {collegesData.slice(0, 500).map((c, idx) => (
                                            <option key={idx} value={c.label} />
                                        ))}
                                    </datalist>
                                </div>
                            </InputField>
                            <InputField label="Priority College Intake (%)" hint={`Calculates to ${Math.round(((parseInt(formData.manualOpenings) || totalOpenings) * (parseInt(formData.priorityCollegeQuota) || 0)) / 100)} reserved seats`}>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        name="priorityCollegeQuota"
                                        min="0" max="100"
                                        value={formData.priorityCollegeQuota}
                                        onChange={handleChange}
                                        className="admin-input font-black text-amber-600 w-24"
                                    />
                                    <span className="text-amber-600 font-bold">% Intake</span>
                                </div>
                            </InputField>
                        </div>
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10">
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-[0.2em] mb-1">
                                Priority Influence:
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                                Students from this specific college will be prioritized first, up to the <strong>Intake Capacity</strong>. Extra students will fall to the standard pool.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
                        <InputField label="General Top University Quota (%)" hint="Target reservation across all roles (if not specified per-role)">
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    name="topUniversityQuota" 
                                    min="0" 
                                    max="100" 
                                    step="5"
                                    value={formData.topUniversityQuota} 
                                    onChange={handleChange}
                                    className="flex-1 accent-indigo-600 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" 
                                />
                                <span className="bg-indigo-600 text-white font-black px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 min-w-[70px] text-center">
                                    {formData.topUniversityQuota}%
                                </span>
                            </div>
                        </InputField>
                        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">
                                Priority Mapping:
                            </p>
                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                                Students from NIRF Rank ≤ 100 institutes OR IIT, NIT, IIIT, and Central Universities will be auto-categorized into this quota.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pb-12">
                    <button type="button" onClick={() => navigate('/dashboard')}
                        className="px-8 py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 flex items-center gap-3">
                        {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Publishing...</> : <><Briefcase size={16} /> Publish Internship</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateInternshipForm;
