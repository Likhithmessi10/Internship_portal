import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import {
    FileText, Briefcase, GraduationCap, MapPin, AlertCircle,
    CheckCircle, Clock, ShieldCheck, Zap, Award, BookOpen,
    User, X, Landmark, CreditCard, Shield, Star, ClipboardList,
    Upload, Calendar, ChevronRight, Mail, Phone, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import WorkSubmissionModal from './WorkSubmissionModal';

const StudentDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stipendModalApp, setStipendModalApp] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                setProfile(res.data.data);

                // Fetch work assignments if hired
                if (res.data.data.applications?.some(app => ['HIRED', 'CA_APPROVED', 'ONGOING'].includes(app.status))) {
                    const workRes = await api.get('/students/work');
                    setAssignments(workRes.data.data || []);
                }
            } catch (error) {
                console.log("No profile yet", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const hiredApp = profile?.applications?.find(app => ['HIRED', 'CA_APPROVED', 'ONGOING'].includes(app.status));
    const isHired = !!hiredApp;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003087] dark:border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full transition-colors duration-300">
            {/* Conditional Welcome Banner */}
            {isHired ? (
                <div className="bg-gradient-to-br from-[#001c4d] via-[#003087] to-[#004dc7] dark:from-[#090e17] dark:via-[#0c1421] dark:to-[#1a2b4d] rounded-[3rem] p-10 lg:p-16 mb-12 text-white shadow-[0_20px_50px_rgba(0,48,135,0.3)] relative overflow-hidden group border border-blue-400/20">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-400/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-10 text-center xl:text-left">
                        <div className="flex flex-col xl:flex-row items-center gap-8">
                            <div className="relative">
                                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-black text-white">
                                        {profile?.fullName?.charAt(0)}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-4 border-[#003087] dark:border-[#0c1421]">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>

                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white/80">
                                    <Zap size={12} className="text-yellow-400" /> Professional Internship Program
                                </div>
                                <h1 className="text-5xl lg:text-6xl font-black font-rajdhani mb-4 tracking-tighter leading-none">
                                    Congratulations, <span className="text-yellow-400">{profile?.fullName.split(' ')[0]}</span>!
                                </h1>
                                <p className="text-blue-100/70 font-medium text-lg lg:max-w-2xl leading-relaxed">
                                    You are now an official intern at <span className="text-white font-bold">APTRANSCO</span>. Your journey to excellence in the power sector begins here.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 min-w-[240px]">
                            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-inner">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#aac4e8] mb-1">Assigned Role</p>
                                <p className="text-xl font-black text-white uppercase">{hiredApp?.assignedRole || 'Associate Intern'}</p>
                            </div>
                            <div className="bg-emerald-500/20 backdrop-blur-xl p-6 rounded-3xl border border-emerald-500/30 shadow-inner flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1">Status</p>
                                    <p className="text-xl font-black text-white uppercase">Active</p>
                                </div>
                                <CheckCircle className="text-emerald-400" size={32} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[#00266b] dark:bg-[#090e17] rounded-[2.5rem] p-8 lg:p-12 mb-10 text-white shadow-2xl relative overflow-hidden group border border-transparent dark:border-slate-800">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#0044bb] dark:bg-blue-900/40 opacity-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                            <div className="w-[100px] h-[100px] rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                <span className="text-4xl font-black">{profile?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-black font-rajdhani mb-2 text-white flex items-center justify-center sm:justify-start gap-3 tracking-tight">
                                    {t('dashboard.welcome')} <span className="text-[#D4A017] dark:text-yellow-400">{profile ? profile.fullName.split(' ')[0] : t('nav.student')}</span>! 👋
                                </h1>
                                <p className="text-[#aac4e8] dark:text-slate-400 font-medium text-lg lg:max-w-xl">Ready to charge up your career with the prestigious <span className="text-white font-bold">APTRANSCO</span>?</p>
                            </div>
                        </div>
                        {!profile ? (
                            <Link to="/student/profile/edit" className="bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-extrabold py-3.5 px-8 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2">
                                <Zap className="w-5 h-5" /> {t('profile.update')}
                            </Link>
                        ) : (
                            <Link to="/student/internships" className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-[#003087] dark:text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3">
                                <Briefcase className="w-5 h-5" /> {t('dashboard.browse')}
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
                {/* Left Column (Activities & Tracking) */}
                <div className="lg:col-span-2 space-y-10">

                    {isHired && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-700">
                            {/* Attendance Component */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm group">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#003087] dark:text-blue-400">Attendance Tracker</h3>
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><Calendar size={20} /></div>
                                </div>
                                <div className="flex items-end justify-between mb-4">
                                    <div className="text-4xl font-black text-slate-900 dark:text-white font-rajdhani">
                                        {hiredApp.attendance?.daysAttended || 0} <span className="text-lg text-slate-400">/ {hiredApp.attendance?.totalDays || 0} Days</span>
                                    </div>
                                    <div className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                        {hiredApp.attendance?.totalDays > 0 ? Math.round((hiredApp.attendance.daysAttended / hiredApp.attendance.totalDays) * 100) : 0}% Present
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mb-6 border border-slate-200 dark:border-slate-700">
                                    <div
                                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                        style={{ width: `${hiredApp.attendance?.totalDays > 0 ? (hiredApp.attendance.daysAttended / hiredApp.attendance.totalDays) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <Link
                                    to="/student/attendance"
                                    className="w-full py-3 border-2 border-slate-100 dark:border-slate-700 hover:border-[#003087]/30 dark:hover:border-blue-500/30 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    View Full History <ChevronRight size={14} />
                                </Link>
                            </div>

                            {/* Work Completion Component */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm group">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#003087] dark:text-blue-400">Task Completion</h3>
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><ClipboardList size={20} /></div>
                                </div>
                                <div className="flex items-end justify-between mb-4">
                                    <div className="text-4xl font-black text-slate-900 dark:text-white font-rajdhani">
                                        {assignments.filter(a => a.status === 'COMPLETED').length} <span className="text-lg text-slate-400">/ {assignments.length} Tasks</span>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 mb-6">
                                    {[...Array(Math.max(5, assignments.length))].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < assignments.filter(a => a.status === 'COMPLETED').length ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}
                                        ></div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => document.getElementById('work-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full py-3 border-2 border-slate-100 dark:border-slate-700 hover:border-[#003087]/30 dark:hover:border-blue-500/30 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    Submit New Work <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Journeys/Applications Tracking */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-10 shadow-sm">
                        <h2 className="text-2xl font-black font-rajdhani flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-wide mb-8">
                            <Clock className="text-[#003087] dark:text-blue-500 w-7 h-7" /> {isHired ? 'Active Internship' : t('dashboard.journey')}
                        </h2>

                        {!profile?.applications || profile.applications.length === 0 ? (
                            <div className="text-center py-16 px-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mb-2">{t('dashboard.noApps')}</p>
                                <p className="text-slate-400 dark:text-slate-500 text-sm">{t('dashboard.visitInternships')}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {profile.applications.map(app => (
                                    <div key={app.id} className={`p-8 border rounded-[2rem] transition-all flex flex-col md:flex-row justify-between md:items-center gap-8 group hover:shadow-xl hover:-translate-y-1
                                        ${['HIRED', 'CA_APPROVED', 'ONGOING'].includes(app.status)
                                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700'
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-500/20'}`}>

                                        <div className="flex flex-col sm:flex-row items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-md group-hover:scale-110 transition-transform">
                                                <Briefcase className={['HIRED', 'CA_APPROVED', 'ONGOING'].includes(app.status) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} size={28} />
                                            </div>
                                            <div className="text-center sm:text-left">
                                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                                                    <h4 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">{app.internship?.title}</h4>
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm
                                                        ${app.status === 'PENDING' ? 'bg-[#fffced] text-[#a37e13] border-[#f5d787]' :
                                                            ['HIRED', 'CA_APPROVED', 'ONGOING'].includes(app.status) ? 'bg-emerald-500 text-white border-emerald-400' :
                                                                'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {app.status === 'CA_APPROVED' || app.status === 'HIRED' || app.status === 'ONGOING' ? 'SELECTED' : app.status}
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center sm:justify-start gap-2 text-sm">
                                                    <MapPin size={16} className="text-slate-400" /> {app.internship?.location || 'APTRANSCO'} <span className="text-slate-300 mx-1">|</span> Applied on {new Date(app.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {['HIRED', 'CA_APPROVED', 'ONGOING'].includes(app.status) && (
                                                <button
                                                    onClick={() => setStipendModalApp(app)}
                                                    className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
                                                        ${app.stipend ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                >
                                                    {app.stipend ? <><CheckCircle size={15} /> Banking Active</> : <><Landmark size={15} /> Banking Setup</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Mentor & Resources) */}
                <div className="lg:col-span-1 space-y-10">
                    {/* Mentor Card */}
                    {isHired && hiredApp.mentor && (
                        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                            <h2 className="text-xl font-black font-rajdhani flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-wide mb-8">
                                <User className="text-blue-500 w-6 h-6" /> Assigned Mentor
                            </h2>

                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-slate-100 to-white dark:from-slate-700 dark:to-slate-800 border-2 border-white dark:border-slate-600 shadow-2xl flex items-center justify-center mb-6 overflow-hidden">
                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{hiredApp.mentor.name?.charAt(0)}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{hiredApp.mentor.name}</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6">APTRANSCO Expert Mentor</p>

                                <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-8"></div>

                                <div className="w-full space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400"><Mail size={18} /></div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Email Address</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate w-full">{hiredApp.mentor.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer">
                                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400"><ExternalLink size={18} /></div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Quick Action</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Request Meeting</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-center text-slate-400 font-bold italic leading-relaxed px-4">
                                "Connect with your mentor for technical guidance and program requirements."
                            </p>
                        </div>
                    )}

                    {/* Resources & Analytics */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-10 shadow-sm sticky top-28">
                        <h2 className="text-xl font-black font-rajdhani flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-wide mb-8">
                            <Zap className="text-yellow-500 w-6 h-6" /> Program Tools
                        </h2>

                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-yellow-500/30 transition-all">
                                <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase text-sm tracking-tight">Guidelines</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">Review the mandatory safety and operational standards.</p>
                                <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                    Download PDF <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all">
                                <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase text-sm tracking-tight">Community</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">Connect with other batchmates on the portal.</p>
                                <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                    Join Discussions <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Work Assignments Detailed Section */}
            {(isHired && assignments.length > 0) && (
                <div id="work-section" className="mt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h2 className="text-3xl font-black font-rajdhani flex items-center gap-4 text-slate-900 dark:text-white uppercase tracking-tighter">
                                <ClipboardList className="text-[#003087] dark:text-blue-500 w-8 h-8" /> Internship Tasks
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium ml-12">Submit and track your weekly internship tasks</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">Filters: All Work</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {assignments.map(work => (
                            <div key={work.id} className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-[3rem] p-10 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                                {work.status === 'COMPLETED' && (
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-2xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                                )}

                                <div className="flex justify-between items-start mb-8">
                                    <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 duration-500 ${work.status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
                                        <Briefcase size={24} />
                                    </div>
                                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm animate-in zoom-in duration-500
                                        ${work.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                                        {work.status}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight leading-none">{work.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed line-clamp-2">{work.description}</p>

                                {work.submission ? (
                                    <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
                                            <CheckCircle size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Submission Completed</span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 italic leading-relaxed">"{work.submission.submissionText}"</p>

                                        {work.submission.mentorFeedback && (
                                            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-blue-500/10 shadow-sm">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Mentor's Verdict</p>
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">{work.submission.mentorFeedback}</p>
                                                {work.submission.mentorRating && (
                                                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-xl w-fit">
                                                        <Star className="text-yellow-500 fill-yellow-500" size={14} />
                                                        <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">Rating: {work.submission.mentorRating}/5</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedAssignment(work);
                                            setShowSubmissionModal(true);
                                        }}
                                        className="w-full mb-10 py-4 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-2xl transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                                    >
                                        <Upload size={18} /> Upload Progress Report
                                    </button>
                                )}

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                        <Calendar size={16} className="text-blue-500/40" />
                                        Deadline: {work.dueDate ? new Date(work.dueDate).toLocaleDateString() : 'Continuous'}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                                        <User size={14} className="opacity-50" /> {work.mentor?.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {stipendModalApp && (
                <StipendModal
                    application={stipendModalApp}
                    onClose={() => setStipendModalApp(null)}
                    onSuccess={(updatedStipend) => {
                        setProfile(prev => ({
                            ...prev,
                            applications: prev.applications.map(a =>
                                a.id === stipendModalApp.id ? { ...a, stipend: updatedStipend } : a
                            )
                        }));
                        setStipendModalApp(null);
                    }}
                />
            )}

            {showSubmissionModal && selectedAssignment && (
                <WorkSubmissionModal
                    assignment={selectedAssignment}
                    onClose={(success) => {
                        setShowSubmissionModal(false);
                        if (success) {
                            api.get('/students/work').then(res => setAssignments(res.data.data || []));
                        }
                    }}
                />
            )}
        </div>
    );
};

const StipendModal = ({ application, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        panNumber: application.stipend?.panNumber || '',
        bankAccount: application.stipend?.bankAccount || '',
        ifscCode: application.stipend?.ifscCode || '',
        bankName: application.stipend?.bankName || '',
        bankBranch: application.stipend?.bankBranch || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/students/applications/${application.id}/stipend`, data);
            onSuccess(res.data.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save stipend details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 my-auto">
                <div className="bg-[#00266b] dark:bg-black/40 p-10 lg:p-14 text-white border-b border-white/5">
                    <div className="flex justify-between items-center mb-8">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 rotate-3">
                            <Landmark size={32} className="text-yellow-400" />
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter font-rajdhani">Banking Portal</h3>
                    <p className="text-[#aac4e8] dark:text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-3">Secure verification for stipend disbursement</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 lg:p-14 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Permanent Account Number (PAN)</label>
                            <div className="relative group">
                                <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input type="text" value={data.panNumber} onChange={e => setData({ ...data, panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl text-lg font-black tracking-widest focus:border-blue-500 focus:outline-none transition-all" required />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Financial Institution (Bank Name)</label>
                            <div className="relative group">
                                <Landmark className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input type="text" value={data.bankName} onChange={e => setData({ ...data, bankName: e.target.value })} placeholder="e.g. State Bank of India" className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black focus:border-blue-500 focus:outline-none transition-all" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">IFSC Code</label>
                            <input type="text" value={data.ifscCode} onChange={e => setData({ ...data, ifscCode: e.target.value.toUpperCase() })} placeholder="SBIN0001234" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black tracking-widest focus:border-blue-500 focus:outline-none transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bank Branch</label>
                            <input type="text" value={data.bankBranch} onChange={e => setData({ ...data, bankBranch: e.target.value })} placeholder="Main Branch" className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black focus:border-blue-500 focus:outline-none transition-all" required />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Account Number</label>
                            <div className="relative group">
                                <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input type="text" value={data.bankAccount} onChange={e => setData({ ...data, bankAccount: e.target.value })} placeholder="300012345678" className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl text-lg font-black tracking-widest focus:border-blue-500 focus:outline-none transition-all" required />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs">
                        {loading ? <div className="animate-spin w-6 h-6 border-4 border-white/20 border-t-white rounded-full"></div> : <><CheckCircle size={20} /> Authorize Banking Details</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentDashboard;
