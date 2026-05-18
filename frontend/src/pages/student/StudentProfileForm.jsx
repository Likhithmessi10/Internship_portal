import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import AsyncCreatableSelect from 'react-select/async-creatable';
import api, { MEDIA_URL } from '../../utils/api';
import { collegesData } from '../../data/colleges';
import { User, GraduationCap, Briefcase, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Zap, Linkedin, Github, Camera, X } from 'lucide-react';

const StudentProfileForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(1);

    const [initialProfile, setInitialProfile] = useState(null);

    // Initial empty state
    const [formData, setFormData] = useState({
        fullName: '', rollNumber: '', collegeRollNumber: '', phone: '', dob: '', address: '', aadhaarNumber: '',
        collegeName: '', manualCollegeName: '', university: '', degree: '', branch: '', yearOfStudy: 1,
        cgpa: '', collegeCategory: 'OTHER', nirfRanking: '',
        hasExperience: false, hasProjects: false, hasCertifications: false,
        experienceDesc: '', projectsDesc: '', certificationsDesc: '', skills: '',
        linkedinUrl: '', githubUrl: ''
    });

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                if (res.data.data) {
                    const d = res.data.data;
                    setInitialProfile(d); // Store original for comparison
                    // Format date for inputs
                    const dDob = d.dob ? new Date(d.dob).toISOString().split('T')[0] : '';
                    setFormData(prev => ({
                        ...prev,
                        ...d,
                        dob: dDob,
                        aadhaarNumber: d.aadhaarNumber || '',
                        id: d.id // Ensure ID is present for checking Update vs Submit
                    }));
                    if (d.photoUrl) {
                        setPhotoPreview(getMediaUrl(d.photoUrl));
                    }
                }
            } catch (err) {
                console.log("No profile to load or server error:", err.message);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('data:')) return url;
        if (url.startsWith('http')) return url;
        return `${MEDIA_URL}/${url.replace(/\\/g, '/')}`;
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

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

    const validate = () => {
        const requiredFields = {
            1: ['fullName', 'collegeRollNumber', 'aadhaarNumber', 'phone', 'dob', 'address'],
            2: ['university', 'degree', 'branch', 'cgpa'],
            4: ['linkedinUrl', 'githubUrl']
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

        // Validate URLs on step 4
        if (activeTab === 4) {
            const urlPattern = /^https?:\/\/.+\..+/i;
            if (formData.linkedinUrl && !urlPattern.test(formData.linkedinUrl)) {
                setError('LinkedIn URL must start with http:// or https://');
                return false;
            }
            if (formData.githubUrl && !urlPattern.test(formData.githubUrl)) {
                setError('GitHub URL must start with http:// or https://');
                return false;
            }
        }

        const fieldsToHero = requiredFields[activeTab] || [];
        for (const f of fieldsToHero) {
            if (!formData[f]) {
                setError(activeTab === 4
                    ? 'Please provide both your LinkedIn and GitHub URLs before submitting.'
                    : 'Please fill in all required fields on this step');
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

        // LinkedIn and GitHub URLs are mandatory on first submission
        if (!formData.linkedinUrl || !formData.githubUrl) {
            setActiveTab(4);
            setError('Please provide both your LinkedIn and GitHub URLs.');
            return;
        }
        const urlPattern = /^https?:\/\/.+\..+/i;
        if (!urlPattern.test(formData.linkedinUrl) || !urlPattern.test(formData.githubUrl)) {
            setActiveTab(4);
            setError('LinkedIn and GitHub URLs must start with http:// or https://');
            return;
        }

        setLoading(true);
        setError('');

        const finalCollegeName = formData.collegeName === "Other Recognized University / College"
            ? formData.manualCollegeName
            : formData.collegeName;
        
        const finalNirf = (formData.nirfRanking && formData.nirfRanking !== 'N/A') ? parseInt(formData.nirfRanking) : null;
        const finalCgpa = parseFloat(formData.cgpa) || 0;

        const submissionData = new FormData();
        
        // Append all text fields
        Object.keys(formData).forEach(key => {
            if (key === 'collegeName') submissionData.append(key, finalCollegeName);
            else if (key === 'nirfRanking') submissionData.append(key, finalNirf);
            else if (key === 'cgpa') submissionData.append(key, finalCgpa);
            else if (formData[key] !== null && formData[key] !== undefined) {
                submissionData.append(key, formData[key]);
            }
        });

        // Append photo if selected
        if (photo) {
            submissionData.append('photo', photo);
        }

        try {
            const res = await api.post('/students/profile', submissionData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updatedProfile = res.data.data;

            // Determine specific alert message
            let msg = 'Profile updated successfully!';
            const rollChanged = formData.collegeRollNumber !== (initialProfile?.collegeRollNumber || '');

            if (rollChanged) msg = 'roll number changed';
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
            // Always block default form submission on Enter — submission only via Deploy button.
            e.preventDefault();
            if (activeTab < 4 && validate()) nextTab();
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
        <div className="w-full max-w-7xl mx-auto py-4 lg:py-6 px-4 h-[calc(100vh-40px)] flex flex-col overflow-hidden text-slate-900 dark:text-white">
            <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden">
                {/* Left Sidebar: Vertical Stepper */}
                <div className="w-full lg:w-72 flex-shrink-0 flex lg:flex-col gap-3 overflow-x-hidden lg:overflow-y-hidden no-scrollbar py-2">
                    <div className="mb-6 hidden lg:block px-2">
                        <h1 className="text-2xl font-black font-rajdhani uppercase tracking-tight leading-none">Profile Configuration</h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Complete all steps to unlock applications</p>
                    </div>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const isCompleted = activeTab > tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-4 p-4 lg:p-5 rounded-3xl transition-all border-2 text-left group shrink-0 lg:shrink
                                    ${isActive 
                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20 scale-[1.02]' 
                                        : isCompleted
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'}`}
                            >
                                <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110
                                    ${isActive ? 'bg-white/20' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : tab.icon}
                                </div>
                                <div className="hidden lg:block">
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>Step 0{tab.id}</p>
                                    <h3 className="text-sm font-black uppercase tracking-wide leading-tight">{tab.title}</h3>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Content: Horizontal Card */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl shadow-indigo-600/5 relative flex flex-col overflow-hidden transition-all duration-500">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl mb-6 text-sm font-black uppercase tracking-widest flex items-center gap-3 mx-8 mt-8 shadow-lg shadow-red-500/10 animate-shake">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form id="profile-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-8 lg:p-12">
                            {/* TAB 1: PERSONAL INFO */}
                            <div className={activeTab === 1 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                                <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-wider font-rajdhani">Personal Information</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Identity & Contact Details</p>
                                    </div>
                                    <div className="flex flex-col items-center group">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
                                                {photoPreview ? (
                                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-10 h-10 text-indigo-200 dark:text-slate-700" />
                                                )}
                                            </div>
                                            <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-900 flex items-center justify-center cursor-pointer hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all">
                                                <Camera className="w-4 h-4" />
                                                <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Legal Name</label>
                                        <input type="text" name="fullName" className="input-field" value={formData.fullName || ""} onChange={handleChange} placeholder="As per Aadhaar" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Aadhaar Number</label>
                                        <input type="text" name="aadhaarNumber" className="input-field" value={formData.aadhaarNumber || ""} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">College Roll No.</label>
                                        <input type="text" name="collegeRollNumber" className="input-field font-mono" value={formData.collegeRollNumber || ""} onChange={handleChange} placeholder="e.g. 21BE0012" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                                        <input type="tel" name="phone" className="input-field" value={formData.phone || ""} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Date of Birth</label>
                                        <input type="date" name="dob" className="input-field" value={formData.dob || ""} onChange={handleChange} />
                                    </div>
                                    <div className="lg:col-span-3 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Residential Address</label>
                                        <textarea name="address" rows="3" className="input-field py-4 resize-none h-32" value={formData.address || ""} onChange={handleChange} placeholder="Full communication address..."></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* TAB 2: ACADEMICS */}
                            <div className={activeTab === 2 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                                <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black uppercase tracking-wider font-rajdhani">Academic Credentials</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">College & Degree Information</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Select College</label>
                                            <AsyncCreatableSelect
                                                cacheOptions
                                                defaultOptions={collegesData.slice(0, 50)}
                                                loadOptions={loadOptions}
                                                value={formData.collegeName ? { label: formData.collegeName, value: formData.collegeName } : null}
                                                onChange={handleCollegeChange}
                                                onCreateOption={handleCreateCollege}
                                                placeholder="Search for your college..."
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">University Name</label>
                                            <input type="text" name="university" className="input-field" value={formData.university || ""} onChange={handleChange} placeholder="Affiliated University" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Degree</label>
                                            <input type="text" name="degree" className="input-field" value={formData.degree || ""} onChange={handleChange} placeholder="E.g. B.Tech" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Branch/Spec.</label>
                                            <input type="text" name="branch" className="input-field" value={formData.branch || ""} onChange={handleChange} placeholder="E.g. EEE" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Year of Study</label>
                                            <select name="yearOfStudy" className="input-field appearance-none" value={formData.yearOfStudy} onChange={handleChange}>
                                                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Current CGPA</label>
                                            <input type="number" step="0.01" name="cgpa" className="input-field" value={formData.cgpa || ""} onChange={handleChange} placeholder="Scale of 10" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TAB 3: EXPERIENCE */}
                            <div className={activeTab === 3 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                                <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black uppercase tracking-wider font-rajdhani">Experience & Skills</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Portfolio & Technical Background</p>
                                </div>

                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <label className={`flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer group shadow-sm
                                            ${formData.hasExperience ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.hasExperience ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-600'}`}><Briefcase size={20} /></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Internships</span>
                                            </div>
                                            <input type="checkbox" name="hasExperience" checked={formData.hasExperience} onChange={handleChange} className="w-6 h-6 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" />
                                        </label>
                                        <label className={`flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer group shadow-sm
                                            ${formData.hasProjects ? 'bg-amber-50/50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-amber-500/30'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.hasProjects ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-600'}`}><Zap size={20} /></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Projects</span>
                                            </div>
                                            <input type="checkbox" name="hasProjects" checked={formData.hasProjects} onChange={handleChange} className="w-6 h-6 rounded-lg border-2 border-slate-300 text-amber-600 focus:ring-amber-500 transition-all cursor-pointer" />
                                        </label>
                                        <label className={`flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer group shadow-sm
                                            ${formData.hasCertifications ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.hasCertifications ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600'}`}><CheckCircle size={20} /></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Certifications</span>
                                            </div>
                                            <input type="checkbox" name="hasCertifications" checked={formData.hasCertifications} onChange={handleChange} className="w-6 h-6 rounded-lg border-2 border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer" />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {formData.hasExperience && (
                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Describe Experience</label>
                                                <textarea name="experienceDesc" rows="4" className="input-field py-4 resize-none h-32" value={formData.experienceDesc || ""} onChange={handleChange} placeholder="Highlight previous roles, roles, and responsibilities..."></textarea>
                                            </div>
                                        )}
                                        {formData.hasProjects && (
                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Highlight Projects</label>
                                                <textarea name="projectsDesc" rows="4" className="input-field py-4 resize-none h-32" value={formData.projectsDesc || ""} onChange={handleChange} placeholder="Major academic or personal projects..."></textarea>
                                        </div>
                                        )}
                                        {formData.hasCertifications && (
                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">List Certifications</label>
                                                <textarea name="certificationsDesc" rows="4" className="input-field py-4 resize-none h-32" value={formData.certificationsDesc || ""} onChange={handleChange} placeholder="Professional certifications, licenses, and badges..."></textarea>
                                            </div>
                                        )}
                                        <div className="lg:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Technical Skills</label>
                                            <div className="relative group">
                                                <input 
                                                    type="text" 
                                                    className="input-field pr-20" 
                                                    placeholder="Type skill and press Tab or Comma..." 
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            e.stopPropagation(); // Prevent form from going to next tab
                                                        }
                                                        if (e.key === 'Tab' || e.key === ',' || e.key === 'Enter') {
                                                            const val = e.target.value.trim().replace(',', '');
                                                            if (val) {
                                                                e.preventDefault();
                                                                const currentSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()) : [];
                                                                if (!currentSkills.includes(val)) {
                                                                    const newSkills = [...currentSkills, val].join(', ');
                                                                    setFormData({ ...formData, skills: newSkills });
                                                                    e.target.value = '';
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-slate-400 group-focus-within:text-indigo-500 transition-colors">Press Tab</div>
                                            </div>
                                            
                                            {formData.skills && (
                                                <div className="flex flex-wrap gap-2 mt-4 p-5 bg-slate-50 dark:bg-slate-950/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-in fade-in duration-500">
                                                    {formData.skills.split(',').map((skill, index) => {
                                                        const s = skill.trim();
                                                        if (!s) return null;
                                                        return (
                                                            <div key={index} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest shadow-sm flex items-center gap-3 group/skill hover:border-indigo-400 transition-all animate-in zoom-in-95 duration-200">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover/skill:scale-125 transition-transform"></div>
                                                                {s}
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = formData.skills.split(',').map(x => x.trim()).filter(x => x !== s).join(', ');
                                                                        setFormData({ ...formData, skills: updated });
                                                                    }}
                                                                    className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all ml-1"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TAB 4: SOCIAL URLs */}
                            <div className={activeTab === 4 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                                <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black uppercase tracking-wider font-rajdhani">Digital Presence</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">LinkedIn & Portfolio URLs</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-[#0077b5]/30 transition-all">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5]"><Linkedin size={20} /></div>
                                            <label className="text-[10px] font-black uppercase tracking-widest">LinkedIn URL</label>
                                        </div>
                                        <input type="url" name="linkedinUrl" className="input-field bg-white dark:bg-slate-900" placeholder="https://linkedin.com/in/yourname" value={formData.linkedinUrl || ""} onChange={handleChange} />
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-slate-900/30 transition-all">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900/10 dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white"><Github size={20} /></div>
                                            <label className="text-[10px] font-black uppercase tracking-widest">GitHub URL</label>
                                        </div>
                                        <input type="url" name="githubUrl" className="input-field bg-white dark:bg-slate-900" placeholder="https://github.com/yourname" value={formData.githubUrl || ""} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-6 lg:px-12 flex items-center justify-between shrink-0">
                        <button
                            type="button"
                            onClick={activeTab === 1 ? () => navigate('/student/dashboard') : prevTab}
                            className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 dark:hover:text-amber-400 transition-all flex items-center gap-2 group"
                        >
                            {activeTab === 1 ? 'Discard Changes' : <><ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</>}
                        </button>

                        <div className="flex gap-4">
                            {activeTab < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => validate() && nextTab()}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/10 active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs group"
                                >
                                    Proceed Next <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button form="profile-form" type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-indigo-950 font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3 text-xs uppercase tracking-widest group">
                                    {loading ? (
                                        <><div className="animate-spin w-4 h-4 border-4 border-indigo-950/20 border-t-indigo-950 rounded-full"></div> Processing...</>
                                    ) : (
                                        <><CheckCircle className="w-4 h-4" /> {formData.id ? 'Save Changes' : 'Deploy Profile'}</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfileForm;
