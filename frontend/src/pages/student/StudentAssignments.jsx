import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { MEDIA_URL } from '../../utils/api';
import {
    ClipboardList, CheckCircle, Upload, ExternalLink,
    AlertCircle, Clock, Zap, Calendar, ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import WorkSubmissionModal from './WorkSubmissionModal';

const StudentAssignments = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/students/profile');
                setProfile(res.data.data);

                const hiredApp = res.data.data.applications?.find(app => ['APPROVED', 'HIRED'].includes(app.status));
                
                if (hiredApp) {
                    const workRes = await api.get('/students/work');
                    setAssignments(workRes.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching assignments data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const hiredApp = profile?.applications?.find(app => ['APPROVED', 'HIRED'].includes(app.status));
    if (!hiredApp) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-2">Access Restricted</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto">
                    This section is only available for officially enrolled interns. Please complete your application process first.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-xs mb-2">
                        <Zap size={14} /> Official Internship
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white font-rajdhani uppercase tracking-tight">Work Assignments</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">Manage and submit your daily tasks assigned by APTRANSCO mentors.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl shadow-sm text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Completion Rate</p>
                        <p className="text-xl font-black text-indigo-600">
                            {assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'COMPLETED').length / assignments.length) * 100) : 0}%
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl shadow-sm text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Tasks</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{assignments.length}</p>
                    </div>
                </div>
            </div>

            {/* Assignments Grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                        <ClipboardList size={24} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">Assignment Repository</h2>
                </div>

                {assignments.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} />
                        </div>
                        <p className="text-base font-black text-slate-400 uppercase tracking-widest">Your mentor hasn't assigned any work yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {assignments.map(work => (
                            <div key={work.id} className="group p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between relative overflow-hidden">
                                {work.status === 'COMPLETED' && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                )}
                                
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm
                                            ${work.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
                                            {work.status}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} /> {work.dueDate ? new Date(work.dueDate).toLocaleDateString() : 'No Deadline'}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2 group-hover:text-indigo-600 transition-colors leading-tight">{work.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-6 line-clamp-3 leading-relaxed">{work.description}</p>
                                </div>

                                    <div className="space-y-3 pt-6 border-t border-slate-200/50 dark:border-slate-800">
                                        {work.submission && work.submission.status !== 'REVISION_REQUESTED' && work.submission.status !== 'REJECTED' ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
                                                    <CheckCircle size={16} /> Submission Confirmed
                                                </div>
                                                {work.submission.attachmentUrl && (
                                                    <a href={`${MEDIA_URL}${work.submission.attachmentUrl}`} target="_blank" rel="noopener noreferrer" 
                                                        className="w-full py-3 bg-white dark:bg-slate-900 text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                                                        <ExternalLink size={14} /> Download Submission
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {work.submission && (
                                                    <div className={`p-4 rounded-2xl border ${work.submission.status === 'REVISION_REQUESTED' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertCircle size={16} className={work.submission.status === 'REVISION_REQUESTED' ? 'text-amber-600' : 'text-red-600'} />
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${work.submission.status === 'REVISION_REQUESTED' ? 'text-amber-700' : 'text-red-700'}`}>
                                                                {work.submission.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        {work.submission.mentorFeedback && (
                                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 italic mb-2 italic">"{work.submission.mentorFeedback}"</p>
                                                        )}
                                                        {work.submission.attachmentUrl && (
                                                            <a href={`${MEDIA_URL}${work.submission.attachmentUrl}`} target="_blank" rel="noopener noreferrer" 
                                                                className="text-[10px] font-black text-indigo-600 uppercase underline decoration-2 underline-offset-4">
                                                                View Previous Work
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                <button onClick={() => { setSelectedAssignment(work); setShowSubmissionModal(true); }}
                                                    className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95">
                                                    <Upload size={18} /> {work.submission ? 'Resubmit Work' : 'Submit Assignment'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showSubmissionModal && (
                <WorkSubmissionModal
                    assignment={selectedAssignment}
                    onClose={() => {
                        setShowSubmissionModal(false);
                        setSelectedAssignment(null);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

export default StudentAssignments;
