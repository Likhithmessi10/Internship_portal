import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, GraduationCap, MapPin, AlertCircle, CheckCircle, Clock, ShieldCheck, Zap, Award, BookOpen, User, X, Landmark, CreditCard, Shield, Star } from 'lucide-react';
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003087] dark:border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full transition-colors duration-300">
            {/* Welcome Banner */}
            <div className="bg-[#00266b] dark:bg-[#090e17] rounded-[2.5rem] p-8 lg:p-12 mb-10 text-white shadow-2xl relative overflow-hidden group border border-transparent dark:border-slate-800 transition-colors duration-300">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#0044bb] dark:bg-blue-900/40 opacity-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4A017] dark:bg-yellow-600/30 opacity-30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                        {profile?.photoUrl ? (
                            <img src={profile.photoUrl} alt="Profile" className="w-[100px] h-[100px] rounded-full border-4 border-white/20 shadow-xl object-cover shrink-0" />
                        ) : (
                            <div className="w-[100px] h-[100px] rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                <span className="text-4xl font-black">{profile?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black font-rajdhani mb-2 text-white flex items-center justify-center sm:justify-start gap-3 tracking-tight">
                                {t('dashboard.welcome')} <span className="text-[#D4A017] dark:text-yellow-400">{profile ? profile.fullName.split(' ')[0] : t('nav.student')}</span>! 👋
                            </h1>
                            <p className="text-[#aac4e8] dark:text-slate-400 font-medium text-lg lg:max-w-xl">
                                Ready to charge up your career with the prestigious <span className="text-white font-bold">APTRANSCO</span>?
                            </p>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto">
                        {!profile ? (
                            <Link to="/student/profile/edit" className="w-full sm:w-auto justify-center bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-extrabold py-3.5 px-8 rounded-2xl transition-all shadow-xl hover:shadow-yellow-500/20 active:scale-95 flex items-center gap-2">
                                <Zap className="w-5 h-5" /> {t('profile.update')}
                            </Link>
                        ) : (
                            <Link to="/student/internships" className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-[#003087] dark:text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 group/btn">
                                <Briefcase className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" /> {t('dashboard.browse')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {!profile && (
                <div className="bg-[#fff9e6] dark:bg-yellow-500/10 border border-[#f5d787] dark:border-yellow-500/20 rounded-2xl p-6 mb-10 flex items-start gap-4 shadow-sm transition-colors duration-300">
                    <AlertCircle className="text-[#b88c14] dark:text-yellow-500 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-[#8a680b] dark:text-yellow-400 font-bold text-lg mb-1">{t('dashboard.actionRequired')}</h3>
                        <p className="text-[#a37e13] dark:text-yellow-200/70 text-sm mb-4">{t('dashboard.actionDesc')}</p>
                        <Link to="/student/profile/edit" className="bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-bold py-2 px-5 rounded-xl shadow-none inline-flex transition-colors">{t('dashboard.setupNow')}</Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column (Activities & Tracking) */}
                <div className="lg:col-span-2 space-y-10">
                    
                     {/* APTRANSCO Privileges */}
                    <div>
                        <h2 className="text-2xl font-black font-rajdhani mb-6 flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-wide">
                            <ShieldCheck className="text-[#003087] dark:text-blue-500 w-7 h-7" /> {t('dashboard.privileges')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-[#eff4ff] dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-5">
                                    <Award className="w-6 h-6 text-[#003087] dark:text-blue-400" />
                                </div>
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-2">{t('dashboard.certTitle')}</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{t('dashboard.certDesc')}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-[#fffced] dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-5">
                                    <Zap className="w-6 h-6 text-[#D4A017] dark:text-yellow-400" />
                                </div>
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-2">{t('dashboard.projectsTitle')}</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{t('dashboard.projectsDesc')}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-[#eff4ff] dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-5">
                                    <BookOpen className="w-6 h-6 text-[#003087] dark:text-blue-400" />
                                </div>
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-2">{t('dashboard.mentorsTitle')}</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{t('dashboard.mentorsDesc')}</p>
                            </div>
                        </div>
                    </div>

                     {/* Application Tracking */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-8 shadow-sm transition-colors duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black font-rajdhani flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-wide">
                                <Clock className="text-[#003087] dark:text-blue-500 w-7 h-7" /> {t('dashboard.journey')}
                            </h2>
                        </div>

                        {!profile?.applications || profile.applications.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-slate-400 font-medium">{t('dashboard.noApps')}</p>
                                <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">{t('dashboard.visitInternships')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {profile.applications.map(app => (
                                    <div key={app.id} className="p-6 border border-gray-100 dark:border-slate-700 rounded-2xl hover:border-[#003087]/30 dark:hover:border-blue-500/50 hover:bg-[#eff4ff]/30 dark:hover:bg-slate-700/50 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-5 group">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h4 className="font-extrabold text-lg text-gray-900 dark:text-white">{app.internship?.title || 'Internship Position'}</h4>
                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md font-mono font-bold tracking-widest uppercase">
                                                    #{app.trackingId.substring(0, 8)}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                                    ${app.status === 'PENDING' ? 'bg-[#fffced] dark:bg-yellow-500/10 text-[#a37e13] dark:text-yellow-400 border border-[#f5d787] dark:border-yellow-500/20' :
                                                        app.status === 'SHORTLISTED' ? 'bg-[#eff4ff] dark:bg-blue-500/10 text-[#003087] dark:text-blue-400 border border-[#b3cfff] dark:border-blue-500/20' :
                                                            app.status === 'HIRED' || app.status === 'CA_APPROVED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                                                                'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                                    }`}>
                                                    {app.status === 'CA_APPROVED' ? 'SELECTED' : app.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-2">
                                                <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500" /> {app.internship?.location || 'APTRANSCO'} • <span className="text-gray-400 dark:text-slate-500 mx-1">|</span> Applied on {new Date(app.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {['HIRED', 'CA_APPROVED'].includes(app.status) && (
                                            <button 
                                                onClick={() => setStipendModalApp(app)}
                                                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto mt-4 sm:mt-0
                                                    ${app.stipend ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-[#003087] dark:bg-blue-600 text-white hover:bg-[#00266b] dark:hover:bg-blue-700 border border-transparent'}
                                                `}
                                            >
                                                {app.stipend ? <><CheckCircle size={15}/> Bank Details Added</> : <><Landmark size={15}/> Complete Stipend Profile</>}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Application Analytics) */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-8 shadow-sm transition-colors duration-300 sticky top-28">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black font-rajdhani flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-wide">
                                <Award className="text-[#003087] dark:text-blue-500 w-7 h-7" /> My Analytics
                            </h2>
                        </div>

                        {profile ? (
                            <div className="space-y-4">
                                {/* Total Applied */}
                                <div className="bg-[#eff4ff] dark:bg-blue-500/10 p-5 rounded-2xl border border-[#b3cfff] dark:border-blue-500/20 flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-blue-900/50 p-2.5 rounded-xl shadow-sm">
                                            <Briefcase className="w-5 h-5 text-[#003087] dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#003087] dark:text-blue-400 uppercase tracking-widest">Total Applied</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">All applications</p>
                                        </div>
                                    </div>
                                    <span className="font-rajdhani text-4xl font-black text-[#003087] dark:text-blue-400">{profile.applications?.length || 0}</span>
                                </div>

                                {/* Shortlisted */}
                                <div className="bg-[#fffced] dark:bg-yellow-500/10 p-5 rounded-2xl border border-[#f5d787] dark:border-yellow-500/20 flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-yellow-900/40 p-2.5 rounded-xl shadow-sm">
                                            <Star className="w-5 h-5 text-[#D4A017] dark:text-yellow-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#a37e13] dark:text-yellow-400 uppercase tracking-widest">Shortlisted</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">In consideration</p>
                                        </div>
                                    </div>
                                    <span className="font-rajdhani text-4xl font-black text-[#a37e13] dark:text-yellow-400">{profile.applications?.filter(a => a.status === 'SHORTLISTED').length || 0}</span>
                                </div>

                                {/* Selected */}
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-emerald-900/40 p-2.5 rounded-xl shadow-sm">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Selected</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">Hired for internship</p>
                                        </div>
                                    </div>
                                    <span className="font-rajdhani text-4xl font-black text-emerald-700 dark:text-emerald-400">{profile.applications?.filter(a => ['HIRED', 'CA_APPROVED'].includes(a.status)).length || 0}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200 dark:border-slate-700">
                                    <FileText className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium px-4">Complete your profile to unlock analytics.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Stipend Modal */}
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
            alert('Stipend details saved successfully!');
            onSuccess(res.data.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save stipend details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="bg-[#00266b] dark:bg-slate-900 p-8 text-white border-b border-white/10 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                            <Landmark size={24} className="text-[#D4A017] dark:text-yellow-400" />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-wide font-rajdhani">Stipend Profile</h3>
                    <p className="text-[#aac4e8] dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Provide your banking details for processing</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">PAN Card Number</label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" value={data.panNumber} onChange={e => setData({...data, panNumber: e.target.value.toUpperCase()})} placeholder="ABCDE1234F" className="admin-input pl-12 w-full font-mono font-bold transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#003087] dark:focus:ring-blue-500 py-3" required />
                            </div>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                            <div className="relative">
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" value={data.bankName} onChange={e => setData({...data, bankName: e.target.value})} placeholder="e.g. State Bank of India" className="admin-input pl-12 w-full font-bold transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#003087] dark:focus:ring-blue-500 py-3" required />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">IFS Code</label>
                            <input type="text" value={data.ifscCode} onChange={e => setData({...data, ifscCode: e.target.value.toUpperCase()})} placeholder="SBIN0001234" className="admin-input w-full font-mono font-bold px-4 transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#003087] dark:focus:ring-blue-500 py-3" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Bank Branch</label>
                            <input type="text" value={data.bankBranch} onChange={e => setData({...data, bankBranch: e.target.value})} placeholder="Main Branch" className="admin-input w-full font-bold px-4 transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#003087] dark:focus:ring-blue-500 py-3" required />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" value={data.bankAccount} onChange={e => setData({...data, bankAccount: e.target.value})} placeholder="300012345678" className="admin-input pl-12 w-full font-mono font-bold transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#003087] dark:focus:ring-blue-500 py-3" required />
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full py-4 bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-black rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-4">
                        {loading ? <div className="animate-spin w-5 h-5 border-2 border-[#00266b]/20 border-t-[#00266b] dark:border-slate-900/20 dark:border-t-slate-900 rounded-full"></div> : <><CheckCircle size={16}/> Save Banking Details</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentDashboard;
