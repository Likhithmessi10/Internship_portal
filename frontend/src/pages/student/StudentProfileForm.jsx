import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import AsyncCreatableSelect from 'react-select/async-creatable';
import api from '../../utils/api';
import { collegesData } from '../../data/colleges';
import { User, GraduationCap, Briefcase, Camera, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Zap, Linkedin, Github } from 'lucide-react';

const StudentProfileForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(1);

    const [initialProfile, setInitialProfile] = useState(null);

    // Initial empty state
    const [formData, setFormData] = useState({
        fullName: '', rollNumber: '', collegeRollNumber: '', phone: '', dob: '', address: '', aadhar: '', aadhaarNumber: '', photoUrl: '',
        collegeName: '', manualCollegeName: '', university: '', degree: '', branch: '', yearOfStudy: 1,
        cgpa: '', collegeCategory: 'OTHER', nirfRanking: '',
        hasExperience: false, hasProjects: false, hasCertifications: false,
        experienceDesc: '', projectsDesc: '', skills: '',
        linkedinUrl: '', githubUrl: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                if (res.data.data) {
                    console.log('>>> FETCHED PROFILE (Dashboard):', res.data.data);
                    const d = res.data.data;
                    setInitialProfile(d); // Store original for comparison
                    // Format date for inputs
                    const dDob = d.dob ? new Date(d.dob).toISOString().split('T')[0] : '';
                    setFormData(prev => ({
                        ...prev,
                        ...d,
                        dob: dDob,
                        aadhaarNumber: d.aadhaarNumber || d.aadhar || '',
                        id: d.id // Ensure ID is present for checking Update vs Submit
                    }));
                }
            } catch (err) {
                console.log("No profile to load or server error:", err.message);
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

    // Filter and limit options for better performance
    const filterColleges = (inputValue) => {
        if (!inputValue) return collegesData.slice(0, 50);

        const lowerInput = inputValue.toLowerCase();
        const filtered = [];

        for (let i = 0; i < collegesData.length; i++) {
            if (collegesData[i].label.toLowerCase().includes(lowerInput)) {
                filtered.push(collegesData[i]);
            }
            if (filtered.length >= 50) break; // Hard limit for performance
        }
        return filtered;
    };

    const loadOptions = (inputValue, callback) => {
        // Simple timeout to avoid excessive processing while typing
        const results = filterColleges(inputValue);
        callback(results);
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

    const validate = () => {
        const requiredFields = {
            1: ['fullName', 'collegeRollNumber', 'aadhaarNumber', 'phone', 'dob', 'address'],
            2: ['university', 'degree', 'branch', 'cgpa']
        };

        // Check if college is selected
        if (activeTab === 2 && !formData.collegeName) {
            setError('Please search and select your institution');
            return false;
        }

        // Check if manual college is entered if "Other" is selected
        if (activeTab === 2 && formData.collegeName === "Other Recognized University / College" && !formData.manualCollegeName) {
            setError('Please enter your college name manually');
            return false;
        }

        if (activeTab === 2 && parseFloat(formData.cgpa) > 10) {
            setError('CGPA must be between 0 and 10');
            return false;
        }

        const fieldsToHero = requiredFields[activeTab] || [];
        for (const f of fieldsToHero) {
            if (!formData[f]) {
                setError(`Please fill in all required fields on this step`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Final validation of all required fields before submission
        const allRequiredFields = [
            'fullName', 'collegeRollNumber', 'aadhaarNumber', 'phone', 'dob', 'address',
            'university', 'degree', 'branch', 'cgpa'
        ];

        for (const f of allRequiredFields) {
            if (!formData[f]) {
                if (['fullName', 'collegeRollNumber', 'aadhaarNumber', 'phone', 'dob', 'address'].includes(f)) setActiveTab(1);
                else setActiveTab(2);
                setError(`Incomplete profile: ${f} is required`);
                return;
            }
        }

        if (!formData.collegeName) {
            setActiveTab(2);
            setError('Please select your institution');
            return;
        }

        setLoading(true);
        setError('');

        const submissionData = {
            ...formData,
            aadhar: formData.aadhaarNumber,
            collegeName: formData.collegeName === "Other Recognized University / College"
                ? formData.manualCollegeName
                : formData.collegeName,
            nirfRanking: (formData.nirfRanking && formData.nirfRanking !== 'N/A') ? parseInt(formData.nirfRanking) : null,
            cgpa: parseFloat(formData.cgpa) || 0
        };

        try {
            console.log('>>> Submitting Profile Data:', submissionData);
            const res = await api.post('/students/profile', submissionData);
            const updatedProfile = res.data.data;

            // Determine specific alert message
            let msg = 'Profile updated successfully!';
            const photoChanged = formData.photoUrl !== (initialProfile?.photoUrl || '');
            const rollChanged = formData.collegeRollNumber !== (initialProfile?.collegeRollNumber || '');

            if (photoChanged && rollChanged) msg = 'profile picture edited and roll number changed';
            else if (photoChanged) msg = 'profile picture edited';
            else if (rollChanged) msg = 'roll number changed';
            else if (updatedProfile.rollNumber && !initialProfile?.rollNumber) {
                msg = `Profile verified! Your APTRANSCO Roll Number is: ${updatedProfile.rollNumber}`;
            }

            alert(msg);
            navigate('/student/dashboard');
        } catch (err) {
            console.error('>>> Profile Update Error:', err.response?.data);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (activeTab < 4) {
                if (validate()) nextTab();
            } else {
                handleSubmit();
            }
        }
    };

    const nextTab = () => setActiveTab(prev => Math.min(prev + 1, 4));
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
        { id: 3, title: "Experience", icon: <Briefcase className="w-5 h-5" /> },
        { id: 4, title: "Social URLs", icon: <Linkedin className="w-5 h-5" /> }
    ];

    return (
        <div className="max-w-4xl mx-auto py-6">
            {/* Premium Header/Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-[2.5rem] p-10 mb-8 text-white shadow-2xl relative overflow-hidden group border border-white/5 dark:border-white/10">
                {/* Decorative Blur Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner group-hover:rotate-6 transition-transform">
                        <User className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black font-rajdhani mb-2 text-white flex items-center gap-3 tracking-tight">
                            BUILD YOUR <span className="text-amber-400 text-premium">PROFILE</span>
                        </h1>
                        <p className="text-indigo-200/80 font-medium text-lg">
                            Complete your details to unlock <span className="text-white font-bold uppercase tracking-widest text-sm">One-Click</span> applications.
                        </p>
                    </div>
                </div>
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
                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/30 shadow-2xl scale-110'
                                        : activeTab > tab.id
                                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-white/5 text-gray-400 dark:text-slate-600 hover:border-indigo-400 hover:text-indigo-400'
                                    }`}
                            >
                                {activeTab > tab.id ? <CheckCircle className="w-6 h-6" /> : tab.icon}
                            </button>
                            <span className={`mt-3 font-black text-[10px] uppercase tracking-[0.2em] hidden sm:block transition-all
                                ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-gray-400 dark:text-slate-600'}`}>
                                {tab.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card bg-white dark:bg-slate-900 border-black/5 dark:border-white/10 rounded-[2.5rem] premium-shadow relative transition-all duration-500">

                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl mb-6 text-sm font-black uppercase tracking-widest flex items-center gap-3 mx-8 mt-8 shadow-lg shadow-red-500/10 animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="relative z-10">

                    {/* TAB 1: PERSONAL INFO */}
                    <div className={activeTab === 1 ? 'block' : 'hidden'}>
                        <div className="p-6 sm:p-10 pb-32">
                            <div className="mb-8 flex items-center gap-6 pb-8 border-b border-gray-100">
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-white/10 shadow-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                                        {formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-gray-300 dark:text-slate-600" />
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
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-wider font-rajdhani">Profile Picture</h3>
                                    <p className="text-[10px] text-gray-500 dark:text-indigo-400/60 font-black uppercase tracking-[0.2em]">Upload a professional photo. Max 2MB.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Full Legal Name</label>
                                    <input type="text" name="fullName" className="input-field" value={formData.fullName} onChange={handleChange} placeholder="As per Aadhaar" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">College/University Roll Number</label>
                                    <input type="text" name="collegeRollNumber" className="input-field font-mono" value={formData.collegeRollNumber} onChange={handleChange} placeholder="e.g. 21BE0012" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Aadhaar Number</label>
                                    <input type="text" name="aadhaarNumber" className="input-field font-mono" value={formData.aadhaarNumber} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Phone Number</label>
                                    <input type="tel" name="phone" className="input-field" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Date of Birth</label>
                                    <input type="date" name="dob" className="input-field" value={formData.dob} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Permanent Address</label>
                                    <textarea name="address" className="input-field h-32 resize-none" value={formData.address} onChange={handleChange} placeholder="House No, Street, City, Pincode..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 2: ACADEMICS */}
                    <div className={activeTab === 2 ? 'block' : 'hidden'}>
                        <div className="p-8 sm:p-10 pb-32">
                            <div className="mb-10 border-b border-gray-100 dark:border-white/5 pb-10">
                                <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                                    <GraduationCap className="w-4 h-4" /> Select Your Institution
                                </label>
                                <AsyncCreatableSelect
                                    cacheOptions
                                    defaultOptions={collegesData.slice(0, 50)}
                                    loadOptions={loadOptions}
                                    value={formData.collegeName ? { label: formData.collegeName, value: formData.collegeName } : null}
                                    onChange={handleCollegeChange}
                                    onCreateOption={handleCreateCollege}
                                    placeholder="Search for your college/institute..."
                                    isSearchable
                                    formatCreateLabel={(inputValue) => `Not listed? Add "${inputValue}" manually`}
                                    noOptionsMessage={({ inputValue }) =>
                                        !inputValue ? "Start typing to search..." : "No matches found. You can add it manually by pressing Enter."
                                    }
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            padding: '8px',
                                            borderRadius: '1.25rem',
                                            backgroundColor: 'transparent',
                                            borderColor: 'rgba(99, 102, 241, 0.2)',
                                            boxShadow: 'none',
                                            '&:hover': { borderColor: '#6366f1' }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                                            borderRadius: '1.25rem',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                            padding: '8px',
                                            overflow: 'hidden',
                                            zIndex: 50
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused
                                                ? 'rgba(99, 102, 241, 0.1)'
                                                : 'transparent',
                                            color: state.isFocused
                                                ? '#6366f1'
                                                : document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155',
                                            padding: '12px 16px',
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#6366f1',
                                            fontWeight: '800'
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            color: document.documentElement.classList.contains('dark') ? 'white' : '#1e293b'
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#94a3b8'
                                        })
                                    }}
                                />
                                {!formData.collegeName && <p className="text-[10px] text-amber-500 font-black uppercase tracking-wider mt-3 px-1">Required: If your college isn't listed, type the name and press Enter to add it manually.</p>}
                                {formData.collegeName && formData.collegeName === "Other Recognized University / College" && (
                                    <div className="mt-6">
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Manually Enter College Name</label>
                                        <input
                                            type="text"
                                            name="manualCollegeName"
                                            className="input-field border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-500/10"
                                            placeholder="Full name of your institution..."
                                            value={formData.manualCollegeName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-indigo-50 dark:bg-indigo-950/40 p-6 rounded-[1.5rem] border border-indigo-100 dark:border-white/5 shadow-inner">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Institution Category</label>
                                        <p className="font-black text-indigo-900 dark:text-indigo-200 text-lg uppercase tracking-tight">{formData.collegeCategory || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">NIRF Ranking</label>
                                        <p className="font-black text-indigo-900 dark:text-indigo-200 text-lg">{formData.nirfRanking || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">University Affiliation</label>
                                    <input type="text" name="university" className="input-field" value={formData.university} onChange={handleChange} placeholder="e.g. JNTU Kakinada" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Degree</label>
                                    <input type="text" name="degree" placeholder="e.g. B.Tech / M.Tech" className="input-field" value={formData.degree} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Branch / Specialization</label>
                                    <input type="text" name="branch" placeholder="e.g. Electrical & Electronics" className="input-field" value={formData.branch} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Year</label>
                                        <select name="yearOfStudy" className="input-field py-3.5" value={formData.yearOfStudy} onChange={handleChange}>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                            <option value="5">5th Year (Dual)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">CGPA (Out of 10)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="10"
                                            name="cgpa"
                                            className="input-field"
                                            value={formData.cgpa}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (val > 10) return; // Prevent typing > 10
                                                handleChange(e);
                                            }}
                                            placeholder="e.g. 8.5"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 3: EXPERIENCE */}
                    <div className={activeTab === 3 ? 'block' : 'hidden'}>
                        <div className="p-8 sm:p-10 pb-32">
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-6 mb-10 flex gap-4 shadow-lg shadow-amber-500/5">
                                <Zap className="w-6 h-6 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                <div>
                                    <h4 className="font-black text-amber-900 dark:text-amber-200 mb-1 text-sm uppercase tracking-wider font-rajdhani">Stand Out from the Crowd</h4>
                                    <p className="text-xs font-bold text-amber-800/80 dark:text-amber-400/60 leading-relaxed uppercase tracking-tighter">Adding your projects and technical skills significantly boosts your chances of being selected for specialized grid operations internships.</p>
                                </div>
                            </div>

                            <div className="space-y-6 px-1">
                                <div className="border border-gray-100 dark:border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all bg-gray-50/30 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-4 mb-4">
                                        <input type="checkbox" id="hasExperience" name="hasExperience" className="w-6 h-6 text-indigo-600 rounded-lg border-gray-300 dark:border-white/10 dark:bg-slate-800 transition-all cursor-pointer" checked={formData.hasExperience} onChange={handleChange} />
                                        <label htmlFor="hasExperience" className="font-black text-gray-900 dark:text-white uppercase tracking-widest cursor-pointer font-rajdhani">Previous Internships</label>
                                    </div>
                                    {formData.hasExperience && (
                                        <textarea name="experienceDesc" className="input-field bg-white dark:bg-slate-900/60 h-32" placeholder="Describe your roles, responsibilities, and achievements at previous internships..." value={formData.experienceDesc} onChange={handleChange}></textarea>
                                    )}
                                </div>

                                <div className="border border-gray-100 dark:border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all bg-gray-50/30 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-4 mb-4">
                                        <input type="checkbox" id="hasProjects" name="hasProjects" className="w-6 h-6 text-indigo-600 rounded-lg border-gray-300 dark:border-white/10 dark:bg-slate-800 transition-all cursor-pointer" checked={formData.hasProjects} onChange={handleChange} />
                                        <label htmlFor="hasProjects" className="font-black text-gray-900 dark:text-white uppercase tracking-widest cursor-pointer font-rajdhani">Major Projects / Thesis</label>
                                    </div>
                                    {formData.hasProjects && (
                                        <textarea name="projectsDesc" className="input-field bg-white dark:bg-slate-900/60 h-32" placeholder="Highlight 1-2 major projects relevant to power systems, IT, or management..." value={formData.projectsDesc} onChange={handleChange}></textarea>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Technical & Soft Skills</label>
                                    <input type="text" name="skills" className="input-field" placeholder="E.g. MATLAB, AutoCAD, Python, Project Management (Comma separated)" value={formData.skills} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 4: SOCIAL URLs */}
                    <div className={activeTab === 4 ? 'block' : 'hidden'}>
                        <div className="p-8 sm:p-10 pb-32">
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6 mb-10 flex gap-4 shadow-lg shadow-indigo-500/5">
                                <Linkedin className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-black text-indigo-900 dark:text-indigo-200 mb-1 text-sm uppercase tracking-wider font-rajdhani">Professional Online Presence</h4>
                                    <p className="text-xs font-bold text-indigo-800/80 dark:text-indigo-400/60 leading-relaxed uppercase tracking-tighter">Share your LinkedIn and GitHub profiles to showcase your professional network and technical projects to HODs and mentors.</p>
                                </div>
                            </div>

                            <div className="space-y-6 px-1">
                                <div className="border border-gray-100 dark:border-white/5 rounded-2xl p-6 hover:border-[#0077b5]/30 dark:hover:border-[#0077b5]/30 transition-all bg-gray-50/30 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#0077b5]/10 flex items-center justify-center">
                                            <Linkedin className="w-5 h-5 text-[#0077b5]" />
                                        </div>
                                        <div>
                                            <label htmlFor="linkedinUrl" className="font-black text-gray-900 dark:text-white uppercase tracking-widest cursor-pointer font-rajdhani">LinkedIn Profile URL</label>
                                            <p className="text-[9px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Optional - Share your professional profile</p>
                                        </div>
                                    </div>
                                    <input
                                        type="url"
                                        id="linkedinUrl"
                                        name="linkedinUrl"
                                        className="input-field bg-white dark:bg-slate-900/60"
                                        placeholder="https://www.linkedin.com/in/your-name"
                                        value={formData.linkedinUrl}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="border border-gray-100 dark:border-white/5 rounded-2xl p-6 hover:border-gray-700/30 dark:hover:border-gray-600/30 transition-all bg-gray-50/30 dark:bg-slate-900/40">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-700/10 dark:bg-gray-600/10 flex items-center justify-center">
                                            <Github className="w-5 h-5 text-gray-700 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <label htmlFor="githubUrl" className="font-black text-gray-900 dark:text-white uppercase tracking-widest cursor-pointer font-rajdhani">GitHub Profile URL</label>
                                            <p className="text-[9px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Optional - Showcase your coding projects</p>
                                        </div>
                                    </div>
                                    <input
                                        type="url"
                                        id="githubUrl"
                                        name="githubUrl"
                                        className="input-field bg-white dark:bg-slate-900/60"
                                        placeholder="https://github.com/your-username"
                                        value={formData.githubUrl}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Visibility Note
                                    </p>
                                    <p className="text-[9px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                                        These URLs will be visible to HODs and PRTI members when reviewing your application. Keep them professional and up-to-date.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 p-8 flex items-center justify-between sticky bottom-0 z-20">
                        <button
                            type="button"
                            onClick={activeTab === 1 ? () => navigate('/student/dashboard') : prevTab}
                            className="text-gray-500 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-indigo-600 dark:hover:text-amber-400 transition-all flex items-center gap-2 group"
                        >
                            {activeTab === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</>}
                        </button>

                        {activeTab < 4 ? (
                            <button
                                type="button"
                                onClick={() => validate() && nextTab()}
                                className="bg-indigo-950 dark:bg-white hover:bg-black dark:hover:bg-indigo-50 text-white dark:text-indigo-950 font-black py-4 px-10 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs group/btn"
                            >
                                Check Next <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-indigo-950 font-black py-4 px-12 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3 text-lg group/btn">
                                {loading ? (
                                    <><div className="animate-spin w-5 h-5 border-4 border-indigo-950/20 border-t-indigo-950 rounded-full"></div> Committing...</>
                                ) : (
                                    <><CheckCircle className="w-6 h-6 group-hover/btn:scale-110 transition-transform" /> {formData.id ? 'Update Profile' : 'Submit Profile'}</>
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
