import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import ApplicationProfileModal from '../ApplicationProfileModal';
import { 
    Search, CheckCircle, XCircle, Award, 
    TrendingUp, Star, Filter, RefreshCcw,
    UserCheck, Clock, ListOrdered
} from 'lucide-react';

const HodSelection = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch applications with status UNDER_COMMITTEE_REVIEW
            const res = await api.get('/prti/committees/applications?status=UNDER_COMMITTEE_REVIEW');
            const data = res.data.data || [];
            
            // Filter to ensure only applications with ALL scores submitted are shown
            // Actually, we'll show all and indicate status
            setApplications(data.sort((a, b) => (b.committeeFinalScore || 0) - (a.committeeFinalScore || 0)));
        } catch (err) {
            console.error('Failed to fetch selection data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (appId, newStatus) => {
        try {
            await api.put(`/admin/applications/${appId}`, { status: newStatus });
            alert(`Application ${newStatus.toLowerCase()} successfully!`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const filteredApps = applications.filter(app => 
        app.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.internship?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isReadyForSelection = (app) => {
        const criteriaCount = app.internship?.evaluationCriteria?.length || 0;
        if (criteriaCount === 0) return false;
        
        const scores = app.evaluationScores || [];
        const distinctQuestions = (predicate) =>
            new Set(scores.filter(predicate).map(s => s.questionId)).size;

        // Need complete per-question scores from HOD, PRTI, and Mentor
        const hasHod = distinctQuestions(s => s.role === 'HOD') >= criteriaCount;
        const hasMentor = distinctQuestions(s => s.role === 'MENTOR') >= criteriaCount;
        const hasPrti = distinctQuestions(s => s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER') >= criteriaCount;

        return hasHod && hasMentor && hasPrti;
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <section className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase mb-1 block">Final Review Phase</span>
                    <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight">Candidate Selection</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-3 bg-surface-container-high rounded-xl text-primary hover:bg-primary hover:text-white transition-all">
                        <RefreshCcw size={18} />
                    </button>
                </div>
            </section>

            {/* Ranking Table */}
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-outline-variant/20 shadow-xl">
                <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <ListOrdered size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-primary">Ranked Candidates</h3>
                    </div>
                    <div className="relative w-80">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                        <input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name or internship..."
                            className="w-full bg-surface-container-high border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest">Rank</th>
                                <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest">Candidate</th>
                                <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest">Internship</th>
                                <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest text-center">Score</th>
                                <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest text-center">Review Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {filteredApps.map((app, idx) => {
                                const ready = isReadyForSelection(app);
                                return (
                                    <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                #{idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black">
                                                    {app.student?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-primary">{app.student?.fullName}</p>
                                                    <p className="text-[10px] text-outline font-bold uppercase">{app.student?.collegeName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-primary">{app.internship?.title}</p>
                                            <p className="text-[10px] text-outline font-bold uppercase">{app.internship?.department}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-lg shadow-lg shadow-blue-500/20">
                                                {app.committeeFinalScore || '0'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {ready ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle size={12} /> Ready
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                                                    <Clock size={12} /> Pending Scores
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => setSelected(app)}
                                                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-primary hover:text-white transition-all"
                                                >
                                                    <Star size={16} />
                                                </button>
                                                {ready && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleAction(app.id, 'APPROVED')}
                                                            className="px-4 py-2.5 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(app.id, 'WAITLISTED')}
                                                            className="px-4 py-2.5 bg-amber-500 text-white text-[10px] font-black rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 uppercase tracking-widest"
                                                        >
                                                            Waitlist
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(app.id, 'REJECTED')}
                                                            className="px-4 py-2.5 bg-red-600 text-white text-[10px] font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredApps.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserCheck size={40} className="text-slate-300" />
                        </div>
                        <h4 className="text-xl font-bold text-primary mb-2">No Candidates Under Review</h4>
                        <p className="text-sm text-outline font-medium">Once candidates are shortlisted and committee members start scoring, they will appear here.</p>
                    </div>
                )}
            </div>

            {selected && (
                <ApplicationProfileModal 
                    application={selected}
                    internship={selected.internship}
                    allApplications={applications}
                    onClose={() => setSelected(null)}
                    updateStatus={async (status, extra) => {
                        await handleAction(selected.id, status);
                        setSelected(null);
                    }}
                />
            )}
        </div>
    );
};

export default HodSelection;
