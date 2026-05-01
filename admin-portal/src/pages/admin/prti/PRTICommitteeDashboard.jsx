import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
    Users, FileText, CheckCircle, XCircle, Clock,
    TrendingUp, Award, Calendar, ChevronRight, Star
} from 'lucide-react';
import PRTIEvaluationModal from './PRTIEvaluationModal';

const PRTICommitteeDashboard = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [filter, setFilter] = useState('PENDING');

    const fetchData = async () => {
        setLoading(true);
        try {
            const statusParam = filter === 'ALL' ? '' : `?status=${filter}`;
            const res = await api.get(`/prti/committees/applications${statusParam}`);
            setApplications(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch committee applications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter]);

    const handleEvaluate = (app) => {
        setSelectedApp(app);
        setShowEvaluationModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMMITTEE_EVALUATION': return 'bg-amber-100 text-amber-700';
            case 'CA_APPROVED': return 'bg-emerald-100 text-emerald-700';
            case 'HIRED': return 'bg-blue-100 text-blue-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getEvaluationStatus = (app) => {
        const allScores = app.evaluationScores || [];
        const criteriaCount = app.internship?.evaluationCriteria?.length || 0;
        
        const prtiScores = allScores.filter(s => s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER');
        const hodScores = allScores.filter(s => s.role === 'HOD');
        const mentorScores = allScores.filter(s => s.role === 'MENTOR');

        const hasPrti = criteriaCount > 0 && prtiScores.length >= criteriaCount;
        const hasHod = criteriaCount > 0 && hodScores.length >= criteriaCount;
        const hasMentor = criteriaCount > 0 && mentorScores.length >= criteriaCount;

        const submitted = [hasPrti, hasHod, hasMentor].filter(Boolean).length;
        
        return {
            submitted,
            total: 3,
            ready: submitted === 3
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-outline">Loading Committee Data...</p>
                </div>
            </div>
        );
    }

    const stats = {
        total: applications.length,
        pending: applications.filter(a => getEvaluationStatus(a).submitted < 3).length,
        ready: applications.filter(a => getEvaluationStatus(a).ready).length,
        approved: applications.filter(a => a.status === 'HIRED').length
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <section className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-outline uppercase mb-2 block animate-slide-in-up">PRTI Committee</span>
                    <h2 className="text-5xl font-black text-primary tracking-tighter leading-none animate-slide-in-up delay-75">
                        Evaluation <span className="text-outline-variant font-light">&</span> Approval
                    </h2>
                </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-12 gap-6">
                <StatCard
                    label="Total Applications"
                    value={stats.total}
                    icon="folder"
                    color="sky"
                    sub="Under Review"
                />
                <StatCard
                    label="Pending Scores"
                    value={stats.pending}
                    icon="pending_actions"
                    color="amber"
                    sub="Awaiting Evaluation"
                />
                <StatCard
                    label="Ready for Approval"
                    value={stats.ready}
                    icon="fact_check"
                    color="emerald"
                    sub="All Scores Submitted"
                />
                <StatCard
                    label="Approved"
                    value={stats.approved}
                    icon="check_circle"
                    color="blue"
                    sub="Final Approval Given"
                />
            </section>

            {/* Applications Table */}
            <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-outline-variant/20 shadow-xl shadow-primary/5">
                <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between">
                    <h3 className="text-xl font-black text-primary">Committee Applications</h3>
                    <div className="flex gap-2">
                        {['ALL', 'COMMITTEE_EVALUATION', 'CA_APPROVED', 'HIRED'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === f 
                                        ? 'bg-primary text-white shadow-md' 
                                        : 'bg-surface-container-high text-outline hover:bg-surface-variant'
                                }`}
                            >
                                {f.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low">
                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Candidate</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Internship</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Mentor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-center">Evaluation Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-center">Scores</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {applications.map(app => {
                                const evalStatus = getEvaluationStatus(app);
                                return (
                                    <tr key={app.id} className="hover:bg-primary/[0.01] transition-colors group">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-sm">
                                                    {app.student?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-primary">{app.student?.fullName}</p>
                                                    <p className="text-[9px] text-outline font-bold">{app.student?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div>
                                                <p className="text-sm font-bold text-primary">{app.internship?.title}</p>
                                                <p className="text-[9px] text-outline font-bold">{app.internship?.department}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            {app.mentor ? (
                                                <div>
                                                    <p className="text-sm font-bold text-primary">{app.mentor.name}</p>
                                                    <p className="text-[9px] text-outline font-bold">{app.mentor.department}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[9px] text-amber-600 font-bold">Not Assigned</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high">
                                                {evalStatus.submitted < 3 ? (
                                                    <Clock size={14} className="text-amber-600" />
                                                ) : (
                                                    <CheckCircle size={14} className="text-emerald-600" />
                                                )}
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {evalStatus.submitted}/{evalStatus.total} Scores
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {app.committeeFinalScore !== null ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="px-3 py-2 bg-primary/10 text-primary font-black rounded-lg text-lg border border-primary/20">
                                                        {app.committeeFinalScore} <span className="text-[10px] uppercase tracking-widest opacity-60">/ 50</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[9px] text-outline font-bold uppercase tracking-widest bg-surface-container-high px-2 py-1 rounded-md inline-block">Scores Pending</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(app.status)}`}>
                                                    {app.status.replace(/_/g, ' ')}
                                                </span>
                                                {evalStatus.ready && app.status !== 'HIRED' && (
                                                    <button
                                                        onClick={() => handleEvaluate(app)}
                                                        className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20 inline-flex items-center gap-2 uppercase tracking-widest"
                                                    >
                                                        <Star size={14} /> Approve
                                                    </button>
                                                )}
                                                {!evalStatus.ready && (
                                                    <button
                                                        onClick={() => handleEvaluate(app)}
                                                        className="px-4 py-2 bg-surface-container-high text-primary text-[10px] font-black rounded-xl hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2 uppercase tracking-widest"
                                                    >
                                                        Evaluate <ChevronRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {applications.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6 text-outline/20">
                            <FileText size={48} />
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-2">No applications found</h3>
                        <p className="text-outline/60 text-sm font-bold uppercase tracking-[0.2em]">All caught up!</p>
                    </div>
                )}
            </div>

            {showEvaluationModal && selectedApp && (
                <PRTIEvaluationModal
                    application={selectedApp}
                    onClose={(success) => {
                        setShowEvaluationModal(false);
                        if (success) fetchData();
                    }}
                />
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, color, sub }) => (
    <div className="col-span-12 lg:col-span-3 bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/20 shadow-xl shadow-primary/5 group hover:border-primary/30 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">{label}</span>
            <div className={`w-10 h-10 bg-${color}-500/10 text-${color}-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-symbols-outlined text-xl font-black">{icon}</span>
            </div>
        </div>
        <div className="text-4xl font-black text-primary tracking-tighter mt-2 group-hover:translate-x-1 transition-transform">{value}</div>
        <div className={`mt-4 flex items-center gap-2 text-[9px] font-black text-${color}-600 bg-${color}-50/50 px-3 py-1.5 rounded-lg w-fit uppercase tracking-widest border border-${color}-100`}>
            {sub}
        </div>
    </div>
);

export default PRTICommitteeDashboard;
