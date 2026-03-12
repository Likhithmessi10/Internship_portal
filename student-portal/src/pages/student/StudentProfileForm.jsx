import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import api from '../../utils/api';
import { collegesData } from '../../data/colleges';
import { User, GraduationCap, Briefcase, Camera, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Zap } from 'lucide-react';

const StudentProfileForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(1);

    // Initial empty state
    const [formData, setFormData] = useState({
        fullName: '', phone: '', dob: '', address: '', aadhar: '', aadhaarNumber: '', photoUrl: '',
        collegeName: '', manualCollegeName: '', university: '', degree: '', branch: '', yearOfStudy: 1,
        cgpa: '', collegeCategory: 'OTHER', nirfRanking: '',
        hasExperience: false, hasProjects: false, hasCertifications: false,
        experienceDesc: '', projectsDesc: '', skills: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                if (res.data.data) {
                    const d = res.data.data;
                    // Format date for inputs
                    const dDob = d.dob ? new Date(d.dob).toISOString().split('T')[0] : '';
                    setFormData({ ...d, dob: dDob, aadhaarNumber: d.aadhaarNumber || d.aadhar || '' });
                }
            } catch {
                console.log("No profile to load");
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleCollegeChange = (selectedOption) => {
        if (selectedOption) {
            setFormData({
                ...formData,
                collegeName: selectedOption.label,
                collegeCategory: selectedOption.category || 'OTHER',
                nirfRanking: selectedOption.nirf || ''
            });
        }
    };

    const handleCreateCollege = (inputValue) => {
        setFormData({
            ...formData,
            collegeName: inputValue,
            collegeCategory: 'OTHER',
            nirfRanking: ''
        });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photoUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Ensure aadhar compatibility with backend
        const submissionData = { 
            ...formData, 
            aadhar: formData.aadhaarNumber,
            // If the generic "Other" was selected, use the manual name
            collegeName: formData.collegeName === "Other Recognized University / College" 
                ? formData.manualCollegeName 
                : formData.collegeName
        };

        try {
            await api.post('/students/profile', submissionData);
            navigate('/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const nextTab = () => setActiveTab(prev => Math.min(prev + 1, 3));
    const prevTab = () => setActiveTab(prev => Math.max(prev - 1, 1));

    if (fetching) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const tabs = [
        { id: 1, title: "Personal Info", icon: <User className="w-5 h-5" /> },
        { id: 2, title: "Academics", icon: <GraduationCap className="w-5 h-5" /> },
        { id: 3, title: "Experience", icon: <Briefcase className="w-5 h-5" /> }
    ];

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl lg:text-4xl font-black font-rajdhani text-gray-900 mb-2">Build Your APTRANSCO Profile</h1>
                <p className="text-gray-500 font-medium max-w-xl mx-auto text-sm">Complete your profile to unlock one-click applications to our premier internship programs.</p>
            </div>

            {/* Stepper Navigation */}
            <div className="flex justify-center mb-10 overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-4 max-w-2xl w-full px-4 relative">
                    {/* Background Progress Line */}
                    <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-200 -translate-y-1/2 z-0 hidden sm:block rounded-full"></div>
                    <div className="absolute top-1/2 left-8 h-1 bg-indigo-600 -translate-y-1/2 z-0 hidden sm:block transition-all duration-500 rounded-full" style={{ width: `${((activeTab - 1) / 2) * 100}%` }}></div>

                    {tabs.map((tab) => (
                        <div key={tab.id} className="relative z-10 flex flex-col items-center flex-1">
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-sm
                                ${activeTab === tab.id
                                    ? 'bg-indigo-600 border-white text-white shadow-indigo-200 shadow-xl scale-110'
                                    : activeTab > tab.id
                                        ? 'bg-emerald-500 border-white text-white'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100 hover:text-indigo-400'
                                }`}
                            >
                                {activeTab > tab.id ? <CheckCircle className="w-6 h-6" /> : tab.icon}
                            </button>
                            <span className={`mt-3 font-bold text-xs uppercase tracking-wider hidden sm:block transition-colors
                                ${activeTab === tab.id ? 'text-indigo-900' : 'text-gray-400'}`}>
                                {tab.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card shadow-xl shadow-indigo-100/50 border-0 ring-1 ring-gray-100 overflow-hidden relative">
                
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 mx-6 mt-6">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative z-10">
                    
                    {/* TAB 1: PERSONAL INFO */}
                    <div className={activeTab === 1 ? 'block' : 'hidden'}>
                        <div className="p-6 sm:p-10">
                            <div className="mb-8 flex items-center gap-6 pb-8 border-b border-gray-100">
                                <div className="relative group cursor-pointer">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handlePhotoUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center overflow-hidden relative">
                                        {formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-gray-300" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    {!formData.photoUrl && (
                                        <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full p-2 border-2 border-white shadow-sm">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Profile Picture</h3>
                                    <p className="text-sm text-gray-500 font-medium">Upload a professional photo. Max size 2MB.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Legal Name</label>
                                    <input type="text" name="fullName" required className="input-field" value={formData.fullName} onChange={handleChange} placeholder="As per Aadhaar" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Aadhaar Number</label>
                                    <input type="text" name="aadhaarNumber" required className="input-field font-mono" value={formData.aadhaarNumber} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                                    <input type="tel" name="phone" required className="input-field" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Date of Birth</label>
                                    <input type="date" name="dob" required className="input-field" value={formData.dob} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Permanent Address</label>
                                    <textarea name="address" required className="input-field h-24 resize-none" value={formData.address} onChange={handleChange} placeholder="House No, Street, City, Pincode..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 2: ACADEMICS */}
                    <div className={activeTab === 2 ? 'block' : 'hidden'}>
                        <div className="p-6 sm:p-10">
                            <div className="mb-8 border-b border-gray-100 pb-8">
                                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Select Your Institution
                                </label>
                                <CreatableSelect
                                    options={collegesData}
                                    value={formData.collegeName ? { label: formData.collegeName, value: formData.collegeName } : null}
                                    onChange={handleCollegeChange}
                                    onCreateOption={handleCreateCollege}
                                    placeholder="Search for your college/institute..."
                                    isSearchable
                                    formatCreateLabel={(inputValue) => `Not listed? Add "${inputValue}" manually`}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            padding: '4px',
                                            borderRadius: '0.75rem',
                                            borderColor: '#e5e7eb',
                                            boxShadow: 'none',
                                            '&:hover': { borderColor: '#c7d2fe' }
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? '#e0e7ff' : 'white',
                                            color: state.isFocused ? '#3730a3' : '#111827',
                                            cursor: 'pointer'
                                        })
                                    }}
                                />
                                {!formData.collegeName && <p className="text-xs text-amber-500 font-medium mt-2">Required: If your college isn't listed, type the name and press Enter to add it manually.</p>}
                                {formData.collegeName && formData.collegeName === "Other Recognized University / College" && (
                                    <div className="mt-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Manually Enter College Name</label>
                                        <input 
                                            type="text" 
                                            name="manualCollegeName" 
                                            className="input-field border-indigo-200 bg-indigo-50/20" 
                                            placeholder="Full name of your institution..." 
                                            value={formData.manualCollegeName} 
                                            onChange={handleChange} 
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/50">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Institution Category</label>
                                        <p className="font-bold text-indigo-900">{formData.collegeCategory || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">NIRF Ranking</label>
                                        <p className="font-bold text-indigo-900">{formData.nirfRanking || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">University Affiliation</label>
                                    <input type="text" name="university" required className="input-field" value={formData.university} onChange={handleChange} placeholder="e.g. JNTU Kakinada" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Degree</label>
                                    <input type="text" name="degree" required placeholder="e.g. B.Tech / M.Tech" className="input-field" value={formData.degree} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Branch / Specialization</label>
                                    <input type="text" name="branch" required placeholder="e.g. Electrical & Electronics" className="input-field" value={formData.branch} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Year</label>
                                        <select name="yearOfStudy" required className="input-field py-3.5" value={formData.yearOfStudy} onChange={handleChange}>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                            <option value="5">5th Year (Dual)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">CGPA (Out of 10)</label>
                                        <input type="number" step="0.01" max="10" name="cgpa" required className="input-field" value={formData.cgpa} onChange={handleChange} placeholder="e.g. 8.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 3: EXPERIENCE */}
                    <div className={activeTab === 3 ? 'block' : 'hidden'}>
                        <div className="p-6 sm:p-10">
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mb-8 flex gap-4">
                                <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-amber-900 mb-1 text-sm">Stand Out from the Crowd</h4>
                                    <p className="text-sm font-medium text-amber-800/80">Adding your projects and technical skills significantly boosts your chances of being selected for specialized grid operations internships.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="border border-gray-100 rounded-xl p-5 hover:border-indigo-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <input type="checkbox" id="hasExperience" name="hasExperience" className="w-5 h-5 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500" checked={formData.hasExperience} onChange={handleChange} />
                                        <label htmlFor="hasExperience" className="font-bold text-gray-900 cursor-pointer">Previous Internships</label>
                                    </div>
                                    {formData.hasExperience && (
                                        <textarea name="experienceDesc" className="input-field bg-white" placeholder="Describe your roles, responsibilities, and achievements at previous internships..." value={formData.experienceDesc} onChange={handleChange} rows="3"></textarea>
                                    )}
                                </div>

                                <div className="border border-gray-100 rounded-xl p-5 hover:border-indigo-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <input type="checkbox" id="hasProjects" name="hasProjects" className="w-5 h-5 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500" checked={formData.hasProjects} onChange={handleChange} />
                                        <label htmlFor="hasProjects" className="font-bold text-gray-900 cursor-pointer">Major Projects / Thesis</label>
                                    </div>
                                    {formData.hasProjects && (
                                        <textarea name="projectsDesc" className="input-field bg-white" placeholder="Highlight 1-2 major projects relevant to power systems, IT, or management..." value={formData.projectsDesc} onChange={handleChange} rows="3"></textarea>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Technical & Soft Skills</label>
                                    <input type="text" name="skills" className="input-field" placeholder="E.g. MATLAB, AutoCAD, Python, Project Management (Comma separated)" value={formData.skills} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
                        <button 
                            type="button" 
                            onClick={activeTab === 1 ? () => navigate('/student/dashboard') : prevTab} 
                            className="text-gray-600 font-bold hover:text-gray-900 transition-colors flex items-center gap-2"
                        >
                            {activeTab === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" /> Back</>}
                        </button>
                        
                        {activeTab < 3 ? (
                            <button type="button" onClick={nextTab} className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2">
                                Check Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center gap-2 text-lg">
                                {loading ? (
                                    <><div className="animate-spin w-4 h-4 border-2 border-white/60 border-t-white rounded-full"></div> Committing...</>
                                ) : (
                                    <><CheckCircle className="w-5 h-5" /> Submit Profile</>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentProfileForm;
