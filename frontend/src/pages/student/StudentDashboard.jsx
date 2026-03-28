import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, GraduationCap, MapPin, AlertCircle, CheckCircle, Clock, ShieldCheck, Zap, Award, BookOpen, User, X, Landmark, CreditCard, Shield, ClipboardList, Upload, Calendar } from 'lucide-react';
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
                console.log('>>> FETCHED PROFILE (Dashboard):', res.data.data);
                setProfile(res.data.data);

                // Fetch work assignments if hired
                if (res.data.data.applications?.some(app => app.status === 'HIRED')) {
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
                                                            app.status === 'HIRED' || app.status === 'CA_APPROVED' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' :
                                                                'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                                    }`}>
                                                    {app.status === 'CA_APPROVED' ? 'SELECTED' : app.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> {app.internship?.location || 'APTRANSCO'} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {['HIRED', 'CA_APPROVED'].includes(app.status) && (
                                            <button
                                                onClick={() => setStipendModalApp(app)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2
                                                    ${app.stipend ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-600 text-white hover:bg-black'}
                                                `}
                                            >
                                                {app.stipend ? <><CheckCircle size={14} /> Bank Details Added</> : <><Landmark size={14} /> Complete Stipend Profile</>}
                                            </button>
                                        )}
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
                                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(profile.cgpa / 10) * 100}%` }}></div>
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
            {/* Work Assignments Section */}
            {assignments.length > 0 && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h2 className="text-2xl font-black font-rajdhani mb-6 flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-wider">
                        <ClipboardList className="text-indigo-600 dark:text-indigo-400 w-7 h-7" /> {t('dashboard.workAssignments') || 'Work Assignments'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {assignments.map(work => (
                            <div key={work.id} className="glass-card bg-white dark:bg-slate-900/40 border border-indigo-100/50 dark:border-white/5 rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Briefcase size={20} />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                        ${work.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                                    `}>
                                        {work.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{work.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-6 line-clamp-2">{work.description}</p>

                                {/* Submission Display */}
                                {work.submission ? (
                                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                                            <CheckCircle size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">Submitted</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-slate-300 mb-3 line-clamp-2">{work.submission.submissionText}</p>
                                        {work.submission.mentorFeedback && (
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-white/5">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mentor Feedback</p>
                                                <p className="text-sm text-gray-700 dark:text-slate-300">{work.submission.mentorFeedback}</p>
                                                {work.submission.mentorRating && (
                                                    <div className="mt-2 flex items-center gap-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Rating:</span>
                                                        <span className="text-sm">{'⭐'.repeat(work.submission.mentorRating)}</span>
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
                                        className="w-full mb-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <Upload size={18} /> Submit Work
                                    </button>
                                )}

                                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <Calendar size={14} /> Due: {work.dueDate ? new Date(work.dueDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                        <User size={14} /> Mentor: {work.mentor?.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            {/* Work Submission Modal */}
            {showSubmissionModal && selectedAssignment && (
                <WorkSubmissionModal
                    assignment={selectedAssignment}
                    onClose={(success) => {
                        setShowSubmissionModal(false);
                        if (success) {
                            // Refresh assignments
                            api.get('/students/work').then(res => {
                                setAssignments(res.data.data || []);
                            });
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
            <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20">
                            <Landmark size={24} />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Stipend Profile</h3>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Provide your banking details for processing</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Card Number</label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input type="text" value={data.panNumber} onChange={e => setData({ ...data, panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" className="admin-input pl-12 w-full font-mono font-bold" required />
                            </div>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name (Instructor Req)</label>
                            <div className="relative">
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input type="text" value={data.bankName} onChange={e => setData({ ...data, bankName: e.target.value })} placeholder="e.g. State Bank of India" className="admin-input pl-12 w-full font-bold" required />
                            </div>
                        </div>
                        <div className="space-y-1.5 md:col-span-2 text-xs font-bold text-gray-500 italic px-1">
                            Mapping instructor fields: `bank_name` and `bank_branch`
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IFS Code</label>
                            <input type="text" value={data.ifscCode} onChange={e => setData({ ...data, ifscCode: e.target.value.toUpperCase() })} placeholder="SBIN0001234" className="admin-input w-full font-mono font-bold" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Branch</label>
                            <input type="text" value={data.bankBranch} onChange={e => setData({ ...data, bankBranch: e.target.value })} placeholder="Main Branch" className="admin-input w-full font-bold" required />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input type="text" value={data.bankAccount} onChange={e => setData({ ...data, bankAccount: e.target.value })} placeholder="300012345678" className="admin-input pl-12 w-full font-mono font-bold" required />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                        {loading ? <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div> : <><CheckCircle size={16} /> Save Details</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentDashboard;
