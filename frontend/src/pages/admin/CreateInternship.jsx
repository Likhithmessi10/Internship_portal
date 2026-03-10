import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Plus, X, ArrowLeft, Briefcase, Users, FileText, MapPin, Clock } from 'lucide-react';

const PRESET_LOCATIONS = [
    'ANY', 'Vijayawada HQ', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Kurnool',
    'Rajahmundry', 'Nellore', 'Kadapa', 'Anantapur', 'Eluru'
];

const InputField = ({ label, required, hint, children }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
    const [roles, setRoles] = useState([]); // [{name, openings}]

    // Location chips
    const [locationInput, setLocationInput] = useState('');
    const [locations, setLocations] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        requirements: '',
        expectations: '',
        duration: '',
        applicationDeadline: ''
    });

    const totalOpenings = roles.reduce((sum, r) => sum + r.openings, 0);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Roles
    const addRole = () => {
        const rName = roleNameInput.trim();
        const rOpens = parseInt(roleOpeningsInput);
        if (rName && rOpens > 0 && !roles.find(r => r.name === rName)) {
            setRoles([...roles, { name: rName, openings: rOpens }]);
        }
        setRoleNameInput('');
        setRoleOpeningsInput(1);
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
                openingsCount: totalOpenings,
                roles: roles.map(r => r.name).join(', '),
                rolesData: roles,
                location: locations.join(', ')
            });
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create internship');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Create Internship</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Post a new internship opportunity</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2">
                    <X size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Info */}
                <div className="admin-card">
                    <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <Briefcase size={16} className="text-indigo-500" /> Basic Information
                    </h2>
                    <div className="space-y-5">
                        <InputField label="Internship Title" required>
                            <input type="text" name="title" required value={formData.title} onChange={handleChange}
                                placeholder="e.g. Software Engineering Internship" className="admin-input" />
                        </InputField>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Department" required>
                                <select name="department" required value={formData.department} onChange={handleChange} className="admin-input">
                                    <option value="">-- Select --</option>
                                    <option>Electrical Engineering</option>
                                    <option>IT & SCADA</option>
                                    <option>Civil & Construction</option>
                                    <option>Finance & Accounts</option>
                                    <option>Renewable Integration</option>
                                    <option>Protection & Control</option>
                                    <option>Telecom & Metering</option>
                                    <option>Planning & Projects</option>
                                    <option>Human Resources</option>
                                </select>
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
                    <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" /> Available Roles & Capacities
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Role Name</label>
                            <input type="text" value={roleNameInput} onChange={e => setRoleNameInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole())}
                                placeholder="e.g. Frontend Developer, Data Analyst..." className="admin-input flex-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Openings</label>
                            <div className="flex gap-2">
                                <input type="number" min="1" value={roleOpeningsInput} onChange={e => setRoleOpeningsInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole())}
                                    className="admin-input w-24" />
                                <button type="button" onClick={addRole}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm flex items-center gap-1 flex-1 justify-center shadow-md">
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                        </div>
                    </div>
                    {roles.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4 space-y-2">
                            {roles.map(r => (
                                <div key={r.name} className="flex items-center justify-between pl-4 pr-3 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                    <span className="text-sm font-bold text-gray-800">{r.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold bg-white text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">{r.openings} Openings</span>
                                        <button type="button" onClick={() => removeRole(r.name)} className="text-gray-400 hover:text-red-500 p-1"><X size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Requirements & Expectations */}
                <div className="admin-card">
                    <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <FileText size={16} className="text-indigo-500" /> Requirements & Expectations
                    </h2>
                    <div className="space-y-5">
                        <InputField label="Requirements" required hint="Qualifications, skills, CGPA etc.">
                            <textarea name="requirements" required value={formData.requirements} onChange={handleChange}
                                rows={4} placeholder="• Min CGPA 7.0&#10;• EEE / ECE preferred&#10;• Basic electrical knowledge" className="admin-input resize-none" />
                        </InputField>
                        <InputField label="Expectations" required hint="What interns will do and learn">
                            <textarea name="expectations" required value={formData.expectations} onChange={handleChange}
                                rows={4} placeholder="• Work in substations&#10;• SCADA monitoring&#10;• Weekly technical sessions" className="admin-input resize-none" />
                        </InputField>
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
                    <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <Clock size={16} className="text-indigo-500" /> Duration & Openings
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Duration" required>
                            <select name="duration" required value={formData.duration} onChange={handleChange} className="admin-input">
                                <option value="">-- Select --</option>
                                <option>4 Weeks</option><option>6 Weeks</option><option>8 Weeks</option>
                                <option>3 Months</option><option>6 Months</option>
                            </select>
                        </InputField>
                        <InputField label="Total Openings" required>
                            <div className="admin-input bg-gray-50 text-gray-500 font-bold flex items-center shadow-none cursor-not-allowed border-dashed">
                                {totalOpenings} slots (Calculated from Roles)
                            </div>
                        </InputField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-4">
                    <button type="button" onClick={() => navigate('/admin/dashboard')}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-colors disabled:opacity-60 flex items-center gap-2">
                        {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Publishing...</> : <><Briefcase size={16} /> Publish Internship</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateInternshipForm;
