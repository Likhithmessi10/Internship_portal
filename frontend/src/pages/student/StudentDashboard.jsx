import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { MEDIA_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import {
    FileText, Briefcase, GraduationCap, MapPin, AlertCircle,
    CheckCircle, Clock, ShieldCheck, Zap, Award, BookOpen,
    User, X, Landmark, CreditCard, Shield, Star, ClipboardList,
    Upload, Calendar, ChevronRight, Mail, Phone, ExternalLink,
    IndianRupee, FileCheck, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// Active statuses — covers all non-terminal post-selection states
const ACTIVE_STATUSES = ['SELECTED', 'REPORTED', 'HIRED', 'APPROVED', 'ONGOING'];
const JOINING_DOCS = [
    { id: 'NOC', label: 'No Objection Certificate', hint: 'From your college / institution' },
    { id: 'BOND', label: 'Bond / Service Agreement', hint: 'Signed commitment form' },
    { id: 'UNDERTAKING', label: 'Undertaking Form', hint: 'Personal declaration' },
];

const STATUS_CONFIG = {
    SUBMITTED:              { label: 'Under Review',         cls: 'bg-amber-100 text-amber-700' },
    SHORTLISTED:            { label: 'Shortlisted',          cls: 'bg-blue-100 text-blue-700' },
    UNDER_COMMITTEE_REVIEW: { label: 'Committee Review',     cls: 'bg-purple-100 text-purple-700' },
    SELECTED:               { label: 'Selected — Upload Docs', cls: 'bg-emerald-500 text-white' },
    REPORTED:               { label: 'Reported',             cls: 'bg-teal-500 text-white' },
    HIRED:                  { label: 'Hired',                cls: 'bg-emerald-500 text-white' },
    APPROVED:               { label: 'Approved',             cls: 'bg-emerald-500 text-white' },
    ONGOING:                { label: 'Ongoing',              cls: 'bg-emerald-500 text-white' },
    COMPLETED:              { label: 'Completed',            cls: 'bg-slate-500 text-white' },
    WAITLISTED:             { label: 'Waitlisted',           cls: 'bg-orange-100 text-orange-700' },
    REJECTED:               { label: 'Not Selected',         cls: 'bg-red-100 text-red-700' },
};

const StudentDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joiningFiles, setJoiningFiles] = useState({});
    const [joiningUploading, setJoiningUploading] = useState(false);
    const [joiningMsg, setJoiningMsg] = useState('');
    const [joiningError, setJoiningError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                setProfile(res.data.data);
            } catch (error) {
                console.log('No profile yet', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Find the most relevant active application
    const activeApp = profile?.applications?.find(app => ACTIVE_STATUSES.includes(app.status))
        || profile?.applications?.find(app => app.status === 'COMPLETED');

    const isActive = activeApp && ACTIVE_STATUSES.includes(activeApp.status);

    // Joining documents are unlocked once status is SELECTED, REPORTED or HIRED
    const joiningDocsUnlocked = ['SELECTED', 'REPORTED', 'HIRED'].includes(activeApp?.status);

    // Uploaded joining doc types already on file
    const uploadedJoiningTypes = new Set(
        (activeApp?.documents || []).filter(d => ['NOC', 'BOND', 'UNDERTAKING'].includes(d.type)).map(d => d.type)
    );
    const joiningDocsComplete = JOINING_DOCS.every(d => uploadedJoiningTypes.has(d.id));

    const handleJoiningFileChange = (e, docId) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setJoiningError('Only PDF files are accepted.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setJoiningError('File too large. Max 5MB.');
            return;
        }
        setJoiningError('');
        setJoiningFiles(prev => ({ ...prev, [docId]: file }));
    };

    const handleJoiningSubmit = async (e) => {
        e.preventDefault();
        if (Object.keys(joiningFiles).length === 0) {
            setJoiningError('Please select at least one file to upload.');
            return;
        }
        setJoiningUploading(true);
        setJoiningError('');
        const formData = new FormData();
        Object.entries(joiningFiles).forEach(([id, file]) => formData.append(id, file));
        try {
            await api.post(`/students/applications/${activeApp.id}/joining-documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setJoiningMsg('Documents uploaded successfully.');
            setJoiningFiles({});
            // Refresh profile to reflect new docs
            const res = await api.get('/students/profile');
            setProfile(res.data.data);
        } catch (err) {
            setJoiningError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setJoiningUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">

            {/* Welcome Banner */}
            {isActive ? (
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black text-white border border-white/10 shrink-0">
                                {profile?.fullName?.charAt(0)}
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest mb-1">
                                    <Zap size={10} className="text-yellow-400" />
                                    {activeApp.status === 'SELECTED' 
                                        ? (joiningDocsComplete ? 'Selected — Verification Pending' : 'Selected — Upload Joining Docs') :
                                     activeApp.status === 'REPORTED' ? 'Reported — Verification Pending' :
                                     'Active Internship'}
                                </div>
                                <h1 className="text-3xl font-black font-rajdhani tracking-tight leading-none mb-1">
                                    {activeApp.status === 'SELECTED'
                                        ? <>Congratulations, <span className="text-yellow-400">{profile?.fullName?.split(' ')[0]}</span>!</>
                                        : <>Welcome back, <span className="text-yellow-400">{profile?.fullName?.split(' ')[0]}</span>!</>}
                                </h1>
                                <p className="text-indigo-100/60 font-medium text-base">
                                    {activeApp.status === 'SELECTED'
                                        ? (joiningDocsComplete 
                                            ? 'All documents uploaded! Please report to the PRTI office for physical verification to complete your onboarding.'
                                            : 'You have been selected! Please upload your joining documents below and report to the PRTI office for physical verification.')
                                        : activeApp.status === 'REPORTED'
                                        ? 'Your reporting is confirmed. Please wait for PRTI to verify your documents and mark you as HIRED.'
                                        : <>You are an official intern at <span className="text-white font-bold">APTRANSCO</span>.</>}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0">
                            {profile?.rollNumber && (
                                <div className="bg-indigo-500/20 px-5 py-4 rounded-2xl border border-indigo-400/30 text-center min-w-[160px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-0.5">Roll Number</p>
                                    <p className="text-base font-black text-white uppercase">{profile.rollNumber}</p>
                                </div>
                            )}
                            <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/10 text-center min-w-[160px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-0.5">Assigned Role</p>
                                <p className="text-base font-black text-white uppercase">{activeApp?.assignedRole || 'Associate'}</p>
                            </div>
                            {activeApp?.stipendAmount && (
                                <div className="bg-emerald-500/10 px-5 py-4 rounded-2xl border border-emerald-500/20 text-center min-w-[160px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Monthly Stipend</p>
                                    <p className="text-base font-black text-white flex items-center justify-center gap-1">
                                        <IndianRupee size={14} className="text-emerald-400" />
                                        {Number(activeApp.stipendAmount).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-indigo-900 dark:bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black shrink-0 border border-white/10">
                                {profile?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black font-rajdhani tracking-tight mb-0.5">
                                    Welcome, <span className="text-yellow-400">{profile ? profile.fullName.split(' ')[0] : 'Student'}</span>! 👋
                                </h1>
                                <p className="text-indigo-200/60 font-medium text-sm">Ready to charge up your career with <span className="text-white font-bold">APTRANSCO</span>?</p>
                            </div>
                        </div>
                        <Link to={profile ? '/student/internships' : '/student/profile/edit'}
                            className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-black py-2.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            {profile ? <Briefcase size={16} /> : <Zap size={16} />}
                            {profile ? t('dashboard.browse') : t('profile.update')}
                        </Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 space-y-6">

                    {/* Joining Documents Section — visible only when REPORTED or HIRED */}
                    {joiningDocsUnlocked && (
                        <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-0.5">
                                        {joiningDocsComplete ? 'Joining Formalities Complete' : 'Action Required'}
                                    </p>
                                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileCheck size={20} className="text-teal-600" /> Complete Joining Formalities
                                    </h2>
                                </div>
                                {joiningDocsComplete && <CheckCircle size={24} className="text-emerald-500 shrink-0" />}
                            </div>

                            <div className="space-y-3 mb-6">
                                {JOINING_DOCS.map(doc => {
                                    const uploaded = uploadedJoiningTypes.has(doc.id);
                                    const staged = joiningFiles[doc.id];
                                    return (
                                        <div key={doc.id} className={`rounded-2xl border p-4 flex items-center gap-4 transition-all ${uploaded ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50'}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${uploaded ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                                                {uploaded
                                                    ? <CheckCircle size={18} className="text-emerald-600" />
                                                    : <FileText size={18} className="text-slate-400" />}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className={`text-sm font-black ${uploaded ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>{doc.label}</p>
                                                <p className="text-xs text-slate-400 font-medium truncate">
                                                    {staged ? <span className="text-indigo-600 font-bold">{staged.name} (staged)</span> : uploaded ? 'Submitted' : doc.hint}
                                                </p>
                                            </div>
                                            {!uploaded && (
                                                <>
                                                    <input type="file" id={`joining-${doc.id}`} accept="application/pdf" className="hidden"
                                                        onChange={e => handleJoiningFileChange(e, doc.id)} />
                                                    <label htmlFor={`joining-${doc.id}`}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 ${staged ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                                        {staged ? 'Change' : 'Upload'}
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {joiningError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2">
                                    <AlertCircle size={16} /> {joiningError}
                                </div>
                            )}
                            {joiningMsg && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2">
                                    <CheckCircle size={16} /> {joiningMsg}
                                </div>
                            )}

                            {!joiningDocsComplete && Object.keys(joiningFiles).length > 0 && (
                                <button
                                    onClick={handleJoiningSubmit}
                                    disabled={joiningUploading}
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {joiningUploading
                                        ? <><div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full"></div> Uploading...</>
                                        : <><Upload size={16} /> Submit Joining Documents ({Object.keys(joiningFiles).length} file{Object.keys(joiningFiles).length !== 1 ? 's' : ''})</>}
                                </button>
                            )}
                            {joiningDocsComplete && (
                                <p className="text-xs text-emerald-600 font-bold text-center">All joining documents submitted. PRTI will verify and complete your onboarding.</p>
                            )}
                        </div>
                    )}

                    {/* Attendance */}
                    {isActive && ['HIRED', 'ONGOING', 'COMPLETED', 'APPROVED'].includes(activeApp?.status) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Attendance History</p>
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Calendar size={20} /></div>
                                </div>
                                <div className="flex items-end justify-between mb-3">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white font-rajdhani">
                                        {activeApp.attendance?.daysAttended || 0} <span className="text-base text-slate-400 font-bold uppercase">/ {activeApp.attendance?.totalDays || 0} Days</span>
                                    </div>
                                    <div className="text-emerald-500 font-black text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {activeApp.attendance?.totalDays > 0
                                            ? Math.round((activeApp.attendance.daysAttended / activeApp.attendance.totalDays) * 100)
                                            : 0}%
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000"
                                        style={{ width: `${activeApp.attendance?.totalDays > 0 ? (activeApp.attendance.daysAttended / activeApp.attendance.totalDays) * 100 : 0}%` }}>
                                    </div>
                                </div>
                                <Link to="/student/attendance" className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">
                                    Full Report <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Applications Tracking */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock size={20} className="text-indigo-600" />
                                {isActive ? 'Active Enrollment' : 'Application Tracking'}
                            </h2>
                        </div>

                        {!profile?.applications || profile.applications.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Applications Found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {profile.applications.map(app => {
                                    const cfg = STATUS_CONFIG[app.status] || { label: app.status, cls: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <div key={app.id} className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                                                        <Briefcase size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{app.internship?.title}</h4>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                            {app.internship?.location} • Applied {new Date(app.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest text-center min-w-[140px] ${cfg.cls}`}>
                                                    {cfg.label}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Mentor Card */}
                    {isActive && activeApp?.mentor && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Assigned Mentor</p>
                            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-3xl font-black text-indigo-600 border border-slate-100 dark:border-slate-800 shadow-inner mb-4">
                                    {activeApp.mentor?.name?.charAt(0) || 'M'}
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">{activeApp.mentor?.name}</h3>
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">APTRANSCO Expert Mentor</p>
                            </div>
                            <div className="pt-6 space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600"><Mail size={20} /></div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-xs font-black text-slate-400 uppercase mb-0.5">Contact</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{activeApp.mentor?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600"><Phone size={20} /></div>
                                    <div className="text-left">
                                        <p className="text-xs font-black text-slate-400 uppercase mb-0.5">Phone</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{activeApp.mentor?.phone || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
