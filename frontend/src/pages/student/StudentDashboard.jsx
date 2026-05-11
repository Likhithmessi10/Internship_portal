import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api, { MEDIA_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import {
    FileText, Briefcase, GraduationCap, MapPin, AlertCircle,
    CheckCircle, Clock, ShieldCheck, Zap, Award, BookOpen,
    User, X, Landmark, CreditCard, Shield, Star, ClipboardList,
    Upload, Calendar, ChevronRight, Mail, Phone, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const StudentDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stipendModalApp, setStipendModalApp] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                setProfile(res.data.data);
            } catch (error) {
                console.log("No profile yet", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const hiredApp = profile?.applications?.find(app => ['APPROVED', 'HIRED'].includes(app.status));
    const isHired = !!hiredApp;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Conditional Welcome Banner */}
            {isHired ? (
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black text-white border border-white/10 shrink-0">
                                {profile?.fullName?.charAt(0)}
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest mb-1">
                                    <Zap size={10} className="text-yellow-400" /> Active Internship
                                </div>
                                <h1 className="text-3xl font-black font-rajdhani tracking-tight leading-none mb-1">
                                    Congratulations, <span className="text-yellow-400">{profile?.fullName.split(' ')[0]}</span>!
                                </h1>
                                <p className="text-indigo-100/60 font-medium text-base">
                                    You are an official intern at <span className="text-white font-bold">APTRANSCO</span>. Your journey begins here.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0">
                            {profile?.rollNumber && (
                                <div className="bg-indigo-500/20 px-5 py-4 rounded-2xl border border-indigo-400/30 text-center min-w-[160px] animate-in slide-in-from-right-4 duration-500">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-0.5">Roll Number</p>
                                    <p className="text-base font-black text-white uppercase">{profile.rollNumber}</p>
                                </div>
                            )}
                            <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/10 text-center min-w-[160px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-0.5">Assigned Role</p>
                                <p className="text-base font-black text-white uppercase">{hiredApp?.assignedRole || 'Associate'}</p>
                            </div>
                            <div className="bg-emerald-500/10 px-5 py-4 rounded-2xl border border-emerald-500/20 text-center min-w-[160px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Status</p>
                                <p className="text-base font-black text-white uppercase flex items-center justify-center gap-2">
                                    Active <CheckCircle size={16} className="text-emerald-400" />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-indigo-900 dark:bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
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
                        <Link to={profile ? "/student/internships" : "/student/profile/edit"} 
                            className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-black py-2.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            {profile ? <Briefcase size={16} /> : <Zap size={16} />} 
                            {profile ? t('dashboard.browse') : t('profile.update')}
                        </Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                {/* Main Stats Area */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {isHired && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Attendance */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Attendance History</p>
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Calendar size={20} /></div>
                                </div>
                                <div className="flex items-end justify-between mb-3">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white font-rajdhani">
                                        {hiredApp.attendance?.daysAttended || 0} <span className="text-base text-slate-400 font-bold uppercase">/ {hiredApp.attendance?.totalDays || 0} Days</span>
                                    </div>
                                    <div className="text-emerald-500 font-black text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {hiredApp.attendance?.totalDays > 0 ? Math.round((hiredApp.attendance.daysAttended / hiredApp.attendance.totalDays) * 100) : 0}%
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${hiredApp.attendance?.totalDays > 0 ? (hiredApp.attendance.daysAttended / hiredApp.attendance.totalDays) * 100 : 0}%` }}></div>
                                </div>
                                <Link to="/student/attendance" className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">
                                    Full Report <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Applications Table-like View */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock size={20} className="text-indigo-600" /> {isHired ? 'Active Enrollment' : 'Application Tracking'}
                            </h2>
                        </div>

                        {!profile?.applications || profile.applications.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Applications Found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {profile.applications.map(app => (
                                    <div key={app.id} className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                                                    <Briefcase size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{app.internship?.title}</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{app.internship?.location} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest text-center min-w-[140px]
                                                ${app.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                                                app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700' :
                                                ['APPROVED', 'HIRED'].includes(app.status) ? 'bg-emerald-500 text-white' :
                                                'bg-red-100 text-red-700'}`}>
                                                {app.status === 'SUBMITTED' ? 'Reviewing' : app.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar Area */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Mentor Card */}
                    {isHired && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Assigned Mentor</p>
                            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-3xl font-black text-indigo-600 border border-slate-100 dark:border-slate-800 shadow-inner mb-4">
                                    {hiredApp.mentor?.name?.charAt(0) || 'M'}
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">{hiredApp.mentor?.name}</h3>
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">APTRANSCO Expert Mentor</p>
                            </div>
                            <div className="pt-6 space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 group cursor-pointer hover:border-indigo-500/30 transition-all">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600"><Mail size={20} /></div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-xs font-black text-slate-400 uppercase mb-0.5">Contact</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{hiredApp.mentor?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 group cursor-pointer hover:border-emerald-500/30 transition-all">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600"><Phone size={20} /></div>
                                    <div className="text-left">
                                        <p className="text-xs font-black text-slate-400 uppercase mb-0.5">Phone</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{hiredApp.mentor?.phone || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Announcements / Quick Info - Removed for professional look */}
                </div>
            </div>

        </div>
    );
};

export default StudentDashboard;
