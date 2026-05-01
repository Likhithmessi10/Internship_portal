import React, { useState, useEffect } from 'react';
import api from '../../../../../utils/api';
import {
    FileText, Star, CheckCircle, XCircle, Eye, MessageSquare,
    Clock, Filter, X, Send, RotateCcw
} from 'lucide-react';

const SubmissionsTab = ({ internshipId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewData, setReviewData] = useState({ mentorFeedback: '', mentorRating: 0, status: 'APPROVED' });
    const [submitting, setSubmitting] = useState(false);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            let url = `/mentor/submissions?internshipId=${internshipId}`;
            if (filter) url += `&status=${filter}`;
            const res = await api.get(url);
            setSubmissions(res.data.data);
        } catch (err) {
            console.error('Failed to fetch submissions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [internshipId, filter]);

    const handleReview = async () => {
        setSubmitting(true);
        try {
            await api.put(`/mentor/submissions/${reviewModal.id}/review`, reviewData);
            setReviewModal(null);
            setReviewData({ mentorFeedback: '', mentorRating: 0, status: 'APPROVED' });
            fetchSubmissions();
        } catch (err) {
            console.error('Failed to review submission:', err);
            alert(err.response?.data?.message || 'Failed to review submission');
        } finally {
            setSubmitting(false);
        }
    };

    const statusBadge = (status) => {
        const styles = {
            SUBMITTED: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
            APPROVED: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
            REJECTED: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
            REVIEWED: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
            REVISION_REQUESTED: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
        };
        return styles[status] || styles.SUBMITTED;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Filter size={12} /> Filter:
                </span>
                {['', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filter === f
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {f || 'All'}
                    </button>
                ))}
            </div>

            {/* Submissions List */}
            {submissions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Submissions</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {filter ? `No ${filter.toLowerCase()} submissions found.` : 'Interns have not submitted any work yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map(sub => {
                        const wa = sub.workAssignment;
                        return (
                            <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{wa?.title || 'N/A'}</h4>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge(sub.status)}`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-medium">{wa?.student?.fullName || 'N/A'}</span>
                                            <span>•</span>
                                            <span>{wa?.application?.internship?.title || 'N/A'}</span>
                                        </div>
                                        {sub.submissionText && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">{sub.submissionText}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} /> {new Date(sub.submissionDate).toLocaleDateString()}
                                            </span>
                                            {sub.mentorRating && (
                                                <span className="flex items-center gap-0.5">
                                                    <Star size={11} className="text-amber-400 fill-amber-400" /> {sub.mentorRating}/5
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sub.attachmentUrl && (
                                            <a
                                                href={sub.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                title="View Attachment"
                                            >
                                                <Eye size={14} className="text-slate-500 dark:text-slate-400" />
                                            </a>
                                        )}
                                        {sub.status === 'SUBMITTED' && (
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => { setReviewModal(sub); setReviewData({ mentorFeedback: '', mentorRating: 0, status: 'APPROVED' }); }}
                                                    className="p-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => { setReviewModal(sub); setReviewData({ mentorFeedback: '', mentorRating: 0, status: 'REJECTED' }); }}
                                                    className="p-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-all"
                                                    title="Reject"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={() => { setReviewModal(sub); setReviewData({ mentorFeedback: '', mentorRating: 0, status: 'REVISION_REQUESTED' }); }}
                                                    className="p-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg transition-all"
                                                    title="Request Revision"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className={`p-6 flex justify-between items-center ${
                            reviewData.status === 'APPROVED' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                            : reviewData.status === 'REJECTED' ? 'bg-gradient-to-r from-red-600 to-red-500'
                            : 'bg-gradient-to-r from-amber-500 to-amber-400'
                        } text-white`}>
                            <div>
                                <h3 className="text-lg font-bold">
                                    {reviewData.status === 'APPROVED' ? 'Approve' : reviewData.status === 'REJECTED' ? 'Reject' : 'Request Revision'}
                                </h3>
                                <p className="text-xs text-white/70 mt-0.5">{reviewModal.workAssignment?.title}</p>
                            </div>
                            <button onClick={() => setReviewModal(null)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Rating */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Rating (1-5)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setReviewData({ ...reviewData, mentorRating: r })}
                                            className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                                                r <= reviewData.mentorRating
                                                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-amber-500'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:border-amber-300'
                                            }`}
                                        >
                                            <Star size={18} className={r <= reviewData.mentorRating ? 'fill-amber-400' : ''} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Feedback */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Feedback</label>
                                <textarea
                                    rows="3"
                                    placeholder="Add your feedback..."
                                    value={reviewData.mentorFeedback}
                                    onChange={e => setReviewData({ ...reviewData, mentorFeedback: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReview}
                                    disabled={submitting}
                                    className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
                                        reviewData.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                        : reviewData.status === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                        : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                    }`}
                                >
                                    {submitting ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            <Send size={14} /> Submit Review
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionsTab;
