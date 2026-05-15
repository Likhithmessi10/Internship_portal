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
const ACTIVE_STATUSES = ['SELECTED', 'REPORTED', 'HIRED', 'APPROVED', 'ONGOING', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED'];
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
    const [reapplyAppId, setReapplyAppId] = useState(null);
    const [reapplyLocation, setReapplyLocation] = useState('');
    const [reapplyLoading, setReapplyLoading] = useState(false);
    const [reapplyMsg, setReapplyMsg] = useState('');

    // Work log state
    const [workLogs, setWorkLogs]           = useState([]);
    const [workLogsLoading, setWorkLogsLoading] = useState(false);
    const [workLogDate, setWorkLogDate]     = useState(new Date().toISOString().slice(0, 10));
    const [workLogDesc, setWorkLogDesc]     = useState('');
    const [workLogHours, setWorkLogHours]   = useState('');
    const [workLogSaving, setWorkLogSaving] = useState(false);
    const [workLogMsg, setWorkLogMsg]       = useState('');

    // Joining confirmation state (student sets dates after being hired)
    const [confirmJoiningDate, setConfirmJoiningDate] = useState('');
    const [confirmEndDate, setConfirmEndDate]         = useState('');
    const [confirmSaving, setConfirmSaving]           = useState(false);
    const [confirmMsg, setConfirmMsg]                 = useState('');

    // Fetch work logs when active HIRED/ONGOING/COMPLETED app is known
    const activeAppId = profile?.applications?.find(a => ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status))?.id;
    useEffect(() => {
        if (activeAppId) fetchWorkLogs(activeAppId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAppId]);

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

    // Joining docs shown only while pending upload/verification — hide once verified or hired
    const joiningDocsUnlocked = ['SELECTED', 'REPORTED', 'DOCUMENTS_PENDING'].includes(activeApp?.status);

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

    const handleReapply = async (appId) => {
        if (!reapplyLocation) return;
        setReapplyLoading(true);
        setReapplyMsg('');
        try {
            await api.put(`/students/applications/${appId}/reapply-location`, { preferredLocation: reapplyLocation });
            setReapplyMsg('Application resubmitted! The HOD will review your request for the new location.');
            setReapplyAppId(null);
            setReapplyLocation('');
            const res = await api.get('/students/profile');
            setProfile(res.data.data);
        } catch (err) {
            setReapplyMsg(err.response?.data?.message || 'Failed to resubmit. Please try again.');
        } finally {
            setReapplyLoading(false);
        }
    };

    const fetchWorkLogs = async (appId) => {
        setWorkLogsLoading(true);
        try {
            const res = await api.get(`/students/applications/${appId}/work-logs`);
            setWorkLogs(res.data.data || []);
        } catch { /* silent */ }
        finally { setWorkLogsLoading(false); }
    };

    const handleWorkLogSubmit = async (appId) => {
        if (!workLogDate || !workLogDesc.trim()) return;
        setWorkLogSaving(true);
        setWorkLogMsg('');
        try {
            await api.post(`/students/applications/${appId}/work-log`, {
                date: workLogDate,
                description: workLogDesc.trim(),
                hoursWorked: workLogHours || undefined
            });
            setWorkLogDesc('');
            setWorkLogHours('');
            setWorkLogMsg('✓ Log saved!');
            fetchWorkLogs(appId);
            setTimeout(() => setWorkLogMsg(''), 3000);
        } catch (err) {
            setWorkLogMsg(err.response?.data?.message || 'Failed to save.');
        } finally { setWorkLogSaving(false); }
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

                    {/* Daily Work Log */}
                    {/* "Are you willing to work?" — shown when HIRED but joining date not yet set */}
                    {activeApp?.status === 'HIRED' && !activeApp?.joiningDate && (
                        <div className="bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-600 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                    <AlertCircle size={24} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-0.5">Action Required</p>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Are you willing to work?</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        You have been hired for this internship. Please confirm your willingness to join and set your joining and end dates.
                                    </p>
                                </div>
                            </div>
                            {!confirmMsg ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Joining Date</label>
                                            <input type="date" value={confirmJoiningDate}
                                                min={new Date().toISOString().slice(0, 10)}
                                                onChange={e => setConfirmJoiningDate(e.target.value)}
                                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">End Date</label>
                                            <input type="date" value={confirmEndDate}
                                                min={confirmJoiningDate || new Date().toISOString().slice(0, 10)}
                                                onChange={e => setConfirmEndDate(e.target.value)}
                                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300" />
                                        </div>
                                    </div>
                                    <button
                                        disabled={!confirmJoiningDate || !confirmEndDate || confirmSaving}
                                        onClick={async () => {
                                            setConfirmSaving(true);
                                            try {
                                                await api.put(`/students/applications/${activeApp.id}/confirm-joining`, {
                                                    joiningDate: confirmJoiningDate,
                                                    endDate: confirmEndDate,
                                                });
                                                setConfirmMsg('✓ Joining confirmed! Your dates have been saved.');
                                                // Refresh profile so joiningDate is updated
                                                const res = await api.get('/students/profile');
                                                setProfile(res.data.data);
                                            } catch (err) {
                                                setConfirmMsg('✗ ' + (err.response?.data?.message || 'Failed to confirm. Please try again.'));
                                            } finally {
                                                setConfirmSaving(false);
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl disabled:opacity-40 transition-colors flex items-center gap-2"
                                    >
                                        {confirmSaving ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Confirming…</> : <>✓ Yes, I'm willing to join</>}
                                    </button>
                                </div>
                            ) : (
                                <p className={`text-sm font-bold px-4 py-3 rounded-xl ${confirmMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                    {confirmMsg}
                                </p>
                            )}
                        </div>
                    )}

                    {activeApp && ['HIRED', 'ONGOING', 'COMPLETED'].includes(activeApp.status) && (() => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        const todayLogged = workLogs.some(l => l.date?.slice(0, 10) === todayStr);
                        return (
                            <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-0.5">Daily Internship Log</p>
                                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                            <ClipboardList size={20} className="text-indigo-500" /> What did you work on today?
                                        </h2>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{workLogs.length} entries</span>
                                </div>

                                {/* Submit form */}
                                {activeApp.status !== 'COMPLETED' && (
                                    <div className="space-y-3 mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Date</label>
                                                <input type="date" value={workLogDate} max={todayStr}
                                                    onChange={e => setWorkLogDate(e.target.value)}
                                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Hours</label>
                                                <input type="number" min="0.5" max="12" step="0.5" placeholder="e.g. 8"
                                                    value={workLogHours} onChange={e => setWorkLogHours(e.target.value)}
                                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">What did you work on?</label>
                                            <textarea rows={3} value={workLogDesc} onChange={e => setWorkLogDesc(e.target.value)}
                                                placeholder="Describe your work today — tasks completed, what you learned, challenges faced..."
                                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-300" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleWorkLogSubmit(activeApp.id)}
                                                disabled={workLogSaving || !workLogDesc.trim()}
                                                className="px-5 py-2 bg-indigo-600 text-white text-xs font-black uppercase rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-2">
                                                {workLogSaving ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><ClipboardList size={14} /> {todayLogged && workLogDate === todayStr ? 'Update Today\'s Log' : 'Save Log'}</>}
                                            </button>
                                            {workLogMsg && <span className={`text-xs font-bold ${workLogMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{workLogMsg}</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Past logs */}
                                {workLogsLoading ? (
                                    <div className="py-6 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /></div>
                                ) : workLogs.length === 0 ? (
                                    <p className="text-xs text-slate-400 font-medium text-center py-4">No logs yet. Start logging your daily work above!</p>
                                ) : (
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {[...workLogs].reverse().map((log, i) => {
                                            const d = new Date(log.date);
                                            const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                                            return (
                                                <div key={log.id || i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div className="w-12 text-center shrink-0">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">{DAYS[d.getDay()]}</p>
                                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{d.getDate()}</p>
                                                        <p className="text-[9px] text-slate-400">{d.toLocaleDateString('en-IN', { month: 'short' })}</p>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{log.description}</p>
                                                        {log.hoursWorked && <p className="text-[10px] font-bold text-indigo-500 mt-0.5">{log.hoursWorked}h worked</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

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
                                    const isRejectedLearning = app.status === 'REJECTED' && app.internship?.internshipType === 'NON_STIPEND';
                                    const locNameFn = (l) => typeof l === 'string' ? l : (l?.name || '');
                                    const altLocations = (Array.isArray(app.field?.locations) ? app.field.locations : [])
                                        .filter(l => locNameFn(l) !== app.preferredLocation);
                                    const showReapply = reapplyAppId === app.id;
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
                                                            {app.field?.fieldName && <span>{app.field.fieldName} · </span>}
                                                            {app.preferredLocation && <span>{app.preferredLocation} · </span>}
                                                            Applied {new Date(app.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest text-center min-w-[140px] ${cfg.cls}`}>
                                                    {cfg.label}
                                                </div>
                                            </div>

                                            {/* Alternate location option for rejected learning internships */}
                                            {isRejectedLearning && altLocations.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    {!showReapply ? (
                                                        <button
                                                            onClick={() => { setReapplyAppId(app.id); setReapplyLocation(''); setReapplyMsg(''); }}
                                                            className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider hover:underline"
                                                        >
                                                            <MapPin size={13} /> Apply for a different location
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                                Choose an alternate location for <strong>{app.field?.fieldName}</strong>:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {altLocations.map(loc => {
                                                                    const name = locNameFn(loc);
                                                                    const vac  = typeof loc === 'object' && loc?.vacancies ? ` (${loc.vacancies})` : '';
                                                                    return (
                                                                        <button key={name}
                                                                            onClick={() => setReapplyLocation(name)}
                                                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                                                                reapplyLocation === name
                                                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                                                                            }`}>
                                                                            {name}{vac}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {reapplyMsg && (
                                                                <p className={`text-xs font-semibold ${reapplyMsg.includes('resubmitted') ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                    {reapplyMsg}
                                                                </p>
                                                            )}
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleReapply(app.id)}
                                                                    disabled={!reapplyLocation || reapplyLoading}
                                                                    className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                                                                >
                                                                    {reapplyLoading ? 'Submitting…' : 'Resubmit Application'}
                                                                </button>
                                                                <button
                                                                    onClick={() => { setReapplyAppId(null); setReapplyMsg(''); }}
                                                                    className="px-4 py-1.5 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
