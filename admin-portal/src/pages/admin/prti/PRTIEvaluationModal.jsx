import React, { useState } from 'react';
import api from '../../../utils/api';
import { Star, CheckCircle, XCircle, X, Send } from 'lucide-react';
import Select from '../../../components/ui/Select';
import { useAuth } from '../../../context/AuthContext';

const PRTIEvaluationModal = ({ application, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('evaluate'); // 'evaluate' or 'approve'
    const [questionScores, setQuestionScores] = useState({});
    const [generalComments, setGeneralComments] = useState('');
    const [assignedRole, setAssignedRole] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const criteria = application.internship?.evaluationCriteria || [];
    const allScores = application.evaluationScores || [];
    
    // Check if current user has already submitted all questions
    const myScores = allScores.filter(s => s.role === user?.role || (user?.role === 'CE_PRTI' && s.role === 'COMMITTEE_MEMBER'));
    const hasEvaluated = criteria.length > 0 && myScores.length >= criteria.length;

    const prtiScores = allScores.filter(s => s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER');
    const hodScores = allScores.filter(s => s.role === 'HOD');
    const mentorScores = allScores.filter(s => s.role === 'MENTOR');

    const prtiComplete = criteria.length > 0 && prtiScores.length >= criteria.length;
    const hodComplete = criteria.length > 0 && hodScores.length >= criteria.length;
    const mentorComplete = criteria.length > 0 && mentorScores.length >= criteria.length;

    const evalStatus = {
        submitted: [prtiComplete, hodComplete, mentorComplete].filter(Boolean).length
    };

    const averageScore = application.committeeFinalScore;

    const handleSubmitEvaluation = async (e) => {
        e.preventDefault();
        
        if (Object.keys(questionScores).length < criteria.length) {
            alert('Please score all questions before submitting');
            return;
        }

        const scoresPayload = criteria.map(q => ({
            questionId: q.id,
            score: parseInt(questionScores[q.id]),
            comments: generalComments
        }));

        setLoading(true);
        try {
            await api.post('/prti/committees/evaluate', {
                applicationId: application.id,
                scores: scoresPayload
            });
            alert('Evaluation score submitted successfully!');
            onClose(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit evaluation');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalDecision = async (approved) => {
        if (!approved && !rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
        }
        if (approved && !assignedRole) {
            alert('Please assign a role for the intern');
            return;
        }

        setLoading(true);
        try {
            await api.post('/prti/committees/approve', {
                applicationId: application.id,
                approved,
                assignedRole: approved ? assignedRole : null,
                rejectionReason: approved ? null : rejectionReason
            });
            alert(approved ? 'Application approved successfully!' : 'Application rejected');
            onClose(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to process decision');
        } finally {
            setLoading(false);
        }
    };

    const allScoresSubmitted = evalStatus.submitted === 3;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-600/80 text-white">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Star size={24} /> Committee Evaluation
                        </h3>
                        <p className="text-[10px] text-white/70 uppercase font-black mt-1 tracking-widest">
                            {application.student?.fullName}
                        </p>
                    </div>
                    <button onClick={() => onClose()} className="hover:bg-white/20 p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-auto">
                    {/* Application Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-xl">
                        <div>
                            <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Internship</p>
                            <p className="text-sm font-black text-primary">{application.internship?.title}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Department</p>
                            <p className="text-sm font-black text-primary">{application.internship?.department}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Mentor</p>
                            <p className="text-sm font-bold text-primary">{application.mentor?.name || 'Not Assigned'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Status</p>
                            <p className="text-sm font-bold text-primary">{application.status}</p>
                        </div>
                    </div>

                    {/* Evaluation Scores */}
                    <div className="p-4 bg-surface-container-low rounded-xl">
                        <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Committee Scores</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <ScoreStatusCard label="Member 1 (PRTI)" isComplete={prtiComplete} isCurrent={user?.role === 'CE_PRTI' || user?.role === 'COMMITTEE_MEMBER'} />
                            <ScoreStatusCard label="Member 2 (HOD)" isComplete={hodComplete} isCurrent={user?.role === 'HOD'} />
                            <ScoreStatusCard label="Member 3 (Mentor)" isComplete={mentorComplete} isCurrent={user?.role === 'MENTOR'} />
                        </div>
                        {averageScore !== null && averageScore !== undefined && allScoresSubmitted && (
                            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Final Cumulative Score</p>
                                <p className="text-4xl font-black text-primary">{averageScore}<span className="text-xl text-primary/50">/50</span></p>
                            </div>
                        )}
                        {!allScoresSubmitted && (
                            <p className="mt-3 text-[9px] text-amber-600 font-bold flex items-center gap-1">
                                <XCircle size={12} /> Waiting for {3 - evalStatus.submitted} more member(s) to complete scoring
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {allScoresSubmitted ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle size={14} /> Ready for Final Approval
                                </p>
                                <p className="text-[9px] text-emerald-700 mt-1">
                                    All 3 committee members have submitted scores. HOD can now give final approval.
                                </p>
                            </div>

                            {user?.role === 'HOD' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">
                                            Assign Role (if approved)
                                        </label>
                                        <Select
                                            value={assignedRole}
                                            onChange={setAssignedRole}
                                            options={application.internship?.rolesData?.map(role => ({ value: role.name, label: `${role.name} (${role.openings} openings)` })) || []}
                                            placeholder="Select Role..."
                                            size="md"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">
                                            Rejection Reason (if rejected)
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Optional: Provide reason for rejection..."
                                            rows="3"
                                            className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold focus:outline-primary resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => handleFinalDecision(true)}
                                            disabled={loading || !assignedRole}
                                            className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> APPROVE & HIRE
                                        </button>
                                        <button
                                            onClick={() => handleFinalDecision(false)}
                                            disabled={loading}
                                            className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> REJECT
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-surface-container-high border border-outline-variant/20 rounded-xl text-center">
                                    <p className="text-sm font-bold text-primary">Waiting for HOD Approval</p>
                                    <p className="text-[10px] text-outline uppercase mt-1 tracking-widest">Only the HOD can finalize this application.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {hasEvaluated ? (
                                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                                    <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
                                    <p className="font-bold text-emerald-800">You have completed your evaluation</p>
                                    <p className="text-[10px] text-emerald-700 mt-1 uppercase tracking-widest">
                                        Waiting for other members to finish
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitEvaluation} className="space-y-6">
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                                            <Send size={14} /> Submit Your Evaluation
                                        </p>
                                        <p className="text-[9px] text-amber-700 mt-1">
                                            As a committee member ({user?.role}), please submit your evaluation score for each criteria.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {criteria.map((q, idx) => (
                                            <div key={q.id} className="p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl">
                                                <label className="block text-xs font-bold text-primary mb-3">
                                                    Q{idx + 1}: {q.question}
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="50"
                                                        value={questionScores[q.id] || ''}
                                                        onChange={(e) => setQuestionScores({...questionScores, [q.id]: e.target.value})}
                                                        placeholder="Score (0-50)"
                                                        required
                                                        className="w-32 p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold focus:outline-primary text-center"
                                                    />
                                                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Out of 50</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">
                                            General Comments (Optional)
                                        </label>
                                        <textarea
                                            value={generalComments}
                                            onChange={(e) => setGeneralComments(e.target.value)}
                                            placeholder="Additional comments or feedback..."
                                            rows="3"
                                            className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold focus:outline-primary resize-none"
                                        />
                                    </div>

                                    <button
                                        disabled={loading || Object.keys(questionScores).length < criteria.length}
                                        className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Send size={18} /> {loading ? 'SUBMITTING...' : 'SUBMIT EVALUATION'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ScoreStatusCard = ({ label, isComplete, isCurrent }) => (
    <div className={`p-3 rounded-xl border-2 text-center ${isCurrent ? 'border-primary bg-primary/5' : 'border-outline-variant/20'
        }`}>
        <p className="text-[8px] font-bold text-outline uppercase tracking-widest mb-2">{label}</p>
        {isComplete ? (
            <div className="flex items-center justify-center gap-1 text-emerald-600">
                <CheckCircle size={16} />
                <span className="text-xs font-bold uppercase">Submitted</span>
            </div>
        ) : (
            <div className="flex items-center justify-center gap-1 text-outline/50">
                <span className="text-xs font-bold uppercase">Pending</span>
            </div>
        )}
    </div>
);

export default PRTIEvaluationModal;
