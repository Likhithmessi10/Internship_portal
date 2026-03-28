import React, { useState } from 'react';
import api from '../../../utils/api';
import { Star, CheckCircle, XCircle, X, Send } from 'lucide-react';
import Select from '../../../components/ui/Select';

const PRTIEvaluationModal = ({ application, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('evaluate'); // 'evaluate' or 'approve'
    const [score, setScore] = useState('');
    const [comments, setComments] = useState('');
    const [assignedRole, setAssignedRole] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const evalStatus = {
        submitted: [
            application.shortlist?.member1Score,
            application.shortlist?.member2Score,
            application.shortlist?.member3Score
        ].filter(s => s !== null && s !== undefined).length,
        scores: {
            member1: application.shortlist?.member1Score,
            member2: application.shortlist?.member2Score,
            member3: application.shortlist?.member3Score
        }
    };

    const averageScore = evalStatus.scores.member1 && evalStatus.scores.member2 && evalStatus.scores.member3
        ? Math.round((evalStatus.scores.member1 + evalStatus.scores.member2 + evalStatus.scores.member3) / 3)
        : null;

    const handleSubmitEvaluation = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/prti/committees/evaluate', {
                applicationId: application.id,
                score: parseInt(score),
                memberType: 'PRTI',
                comments
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
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
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
                            <ScoreCard label="Member 1 (PRTI)" score={evalStatus.scores.member1} isCurrent={true} />
                            <ScoreCard label="Member 2 (HOD)" score={evalStatus.scores.member2} />
                            <ScoreCard label="Member 3 (Mentor)" score={evalStatus.scores.member3} />
                        </div>
                        {averageScore && (
                            <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                                <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Average Score</p>
                                <p className="text-3xl font-black text-primary">{averageScore}/100</p>
                            </div>
                        )}
                        {!allScoresSubmitted && (
                            <p className="mt-3 text-[9px] text-amber-600 font-bold flex items-center gap-1">
                                <XCircle size={12} /> Waiting for {3 - evalStatus.submitted} more score(s)
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
                                    All 3 committee members have submitted scores. PRTI Member can now give final approval.
                                </p>
                            </div>

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
                                        className="w-full p-3 bg-white border border-outline-variant/20 rounded-xl text-sm font-bold focus:outline-primary resize-none"
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
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitEvaluation} className="space-y-4">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                                    <Send size={14} /> Submit Your Evaluation
                                </p>
                                <p className="text-[9px] text-amber-700 mt-1">
                                    As PRTI Member (Committee Head), submit your evaluation score.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">
                                    Evaluation Score (1-100) *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    placeholder="Enter score..."
                                    required
                                    className="w-full p-4 bg-white border border-outline-variant/20 rounded-xl text-sm font-bold focus:outline-primary text-center text-2xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Additional comments or feedback..."
                                    rows="3"
                                    className="w-full p-3 bg-white border border-outline-variant/20 rounded-xl text-sm font-bold focus:outline-primary resize-none"
                                />
                            </div>

                            <button
                                disabled={loading || !score}
                                className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send size={18} /> {loading ? 'SUBMITTING...' : 'SUBMIT EVALUATION'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const ScoreCard = ({ label, score, isCurrent }) => (
    <div className={`p-3 rounded-xl border-2 text-center ${isCurrent ? 'border-primary bg-primary/5' : 'border-outline-variant/20'
        }`}>
        <p className="text-[8px] font-bold text-outline uppercase tracking-widest mb-2">{label}</p>
        {score !== null && score !== undefined ? (
            <p className="text-2xl font-black text-primary">{score}</p>
        ) : (
            <p className="text-xl font-bold text-gray-300">--</p>
        )}
    </div>
);

export default PRTIEvaluationModal;
