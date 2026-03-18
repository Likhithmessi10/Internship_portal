import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, GraduationCap, MapPin, AlertCircle, CheckCircle, Clock, ShieldCheck, Zap, Award, BookOpen, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const StudentDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                console.log('>>> FETCHED PROFILE (Dashboard):', res.data.data);
                setProfile(res.data.data);
            } catch (error) {
                console.log("No profile yet", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Welcome Banner */}
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-3xl p-10 mb-8 text-white shadow-2xl relative overflow-hidden group border border-white/5 dark:border-white/10">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {profile?.photoUrl ? (
                            <img src={profile.photoUrl} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-3xl font-bold">{profile?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl font-black font-rajdhani mb-2 text-white flex items-center gap-3 tracking-tight">
                                {t('dashboard.welcome')} <span className="text-amber-400">{profile ? profile.fullName.split(' ')[0] : t('nav.student')}</span>! 👋
                            </h1>
                            <p className="text-indigo-200/80 font-medium text-lg">Ready to charge up your career with <span className="text-white font-bold">APTRANSCO</span>?</p>
                        </div>
                    </div>
                    <div>
                        {!profile ? (
                            <Link to="/student/profile/edit" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2">
                                <Zap className="w-5 h-5" /> {t('profile.update')}
                            </Link>
                        ) : (
                            <Link to="/student/internships" className="bg-white hover:bg-gray-50 text-indigo-950 font-black py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 group/btn">
                                <Briefcase className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" /> {t('dashboard.browse')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {!profile && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm">
                    <AlertCircle className="text-amber-500 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-amber-800 dark:text-amber-200 font-bold text-lg mb-1">{t('dashboard.actionRequired')}</h3>
                        <p className="text-amber-700 dark:text-amber-300 text-sm mb-4">{t('dashboard.actionDesc')}</p>
                        <Link to="/student/profile/edit" className="btn-primary py-2 px-4 shadow-none inline-flex">{t('dashboard.setupNow')}</Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Activities & Tracking) */}
                <div className="lg:col-span-2 space-y-8">
                    
                     {/* APTRANSCO Privileges */}
                    <div>
                        <h2 className="text-2xl font-black font-rajdhani mb-6 flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-wider">
                            <ShieldCheck className="text-indigo-600 dark:text-indigo-400 w-7 h-7" /> {t('dashboard.privileges')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="glass-card bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-100/50 dark:border-indigo-500/20 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                    <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="font-black text-indigo-900 dark:text-indigo-100 text-base mb-2">{t('dashboard.certTitle')}</h3>
                                <p className="text-sm text-indigo-700/70 dark:text-indigo-400 font-medium">{t('dashboard.certDesc')}</p>
                            </div>
                            <div className="glass-card bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-100/50 dark:border-emerald-500/20 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-black text-emerald-900 dark:text-emerald-100 text-base mb-2">{t('dashboard.projectsTitle')}</h3>
                                <p className="text-sm text-emerald-700/70 dark:text-emerald-400 font-medium">{t('dashboard.projectsDesc')}</p>
                            </div>
                            <div className="glass-card bg-amber-50/50 dark:bg-amber-950/40 border-amber-100/50 dark:border-amber-500/20 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                    <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-black text-amber-900 dark:text-amber-100 text-base mb-2">{t('dashboard.mentorsTitle')}</h3>
                                <p className="text-sm text-amber-700/70 dark:text-amber-400 font-medium">{t('dashboard.mentorsDesc')}</p>
                            </div>
                        </div>
                    </div>

                     {/* Application Tracking */}
                    <div className="card glass-card border-indigo-100/50 dark:border-white/5 premium-shadow">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black font-rajdhani flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-wider">
                                <Clock className="text-indigo-600 dark:text-indigo-400 w-7 h-7" /> {t('dashboard.journey')}
                            </h2>
                        </div>

                        {!profile?.applications || profile.applications.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-white/5">
                                <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">{t('dashboard.noApps')}</p>
                                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">{t('dashboard.visitInternships')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {profile.applications.map(app => (
                                    <div key={app.id} className="p-5 border border-gray-100 dark:border-white/5 rounded-xl hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-gray-900 dark:text-indigo-200">{app.internship?.title || 'Internship Position'}</h4>
                                                <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded font-mono font-bold tracking-tighter">
                                                    {app.trackingId}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                                    ${app.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400' :
                                                        app.status === 'SHORTLISTED' ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-400' :
                                                            app.status === 'HIRED' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' :
                                                                'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> {app.internship?.location || 'APTRANSCO'} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                 {/* Right Column (Profile Summary) */}
                <div className="lg:col-span-1">
                    <div className="card glass-card sticky top-28 border-indigo-100/50 dark:border-white/5 premium-shadow">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black font-rajdhani flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-wider">
                                <User className="text-indigo-600 dark:text-indigo-400 w-7 h-7" /> {t('dashboard.profileGlance')}
                            </h2>
                            <Link to="/student/profile/edit" className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-800/60 transition-colors">{t('dashboard.edit')}</Link>
                        </div>

                        {profile ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-black/5 dark:border-white/5">
                                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">{t('dashboard.collegeRoll')}</p>
                                        <p className="font-mono text-xs font-black text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700 inline-block">{profile.collegeRollNumber || '—'}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                                    <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('dashboard.academicSetup')}</p>
                                    <p className="font-bold text-gray-900 dark:text-indigo-200">{profile.collegeName}</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mt-1">{profile.branch} • Year {profile.yearOfStudy}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-white/5 pt-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('dashboard.cgpa')}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                                <div className="bg-emerald-500 h-2 rounded-full" style={{width: `${(profile.cgpa / 10) * 100}%`}}></div>
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-slate-300 text-sm">{profile.cgpa}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('dashboard.aadhaar')}</p>
                                        <p className="font-bold text-gray-900 dark:text-slate-300 text-sm">XXXX-{(profile.aadhar || profile.aadhaarNumber || '').slice(-4)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/5">
                                    <User className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{t('dashboard.constructProfile')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
