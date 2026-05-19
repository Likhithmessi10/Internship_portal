import React, { useEffect, useState } from 'react';
import api, { MEDIA_URL } from '../../../utils/api';
import {
    X, CheckCircle, AlertTriangle, Award, ClipboardList, FileText,
    Clock, Calendar, Loader2, Lock, ChevronDown, ChevronUp, Download,
    User as UserIcon, ShieldCheck
} from 'lucide-react';

const Bar = ({ pct, color = 'bg-indigo-500', height = 'h-1.5' }) => (
    <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${height}`}>
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
);

const StatPill = ({ label, value, hue = 'indigo' }) => {
    const c = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200'
    }[hue];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${c}`}>
            <span className="opacity-70">{label}:</span>{value}
        </span>
    );
};

/**
 * Per-intern card. Lets mentor:
 *  - View assignments + submissions + scores + attendance + work-log count
 *  - Write remarks
 *  - Give overall satisfaction percent
 *  - "Save & mark processed"
 *  - Issue certificate (with low-attendance warning)
 */
const InternCard = ({ intern, internshipId, onChange }) => {
    const [expanded, setExpanded] = useState(intern.completionStatus === 'PENDING');
    const [remarks, setRemarks] = useState(intern.mentorRemarks || '');
    const [sat, setSat] = useState(intern.mentorSatisfactionPercent ?? '');
    const [saving, setSaving] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [err, setErr] = useState('');

    const lowAttendance = intern.attendance.lowAttendance;
    const processed = intern.completionStatus !== 'PENDING';

    const saveRemarks = async () => {
        setErr(''); setSaving(true);
        try {
            await api.post(
                `/mentor/internships/${internshipId}/interns/${intern.applicationId}/remarks`,
                { remarks, satisfactionPercent: sat === '' ? null : Number(sat) }
            );
            await onChange();
        } catch (e) {
            setErr(e.response?.data?.message || 'Failed to save remarks');
        } finally { setSaving(false); }
    };

    const issueCert = async () => {
        if (lowAttendance && !window.confirm(`${intern.student.fullName} has only ${intern.attendance.percent}% attendance (below 90%). Issue certificate anyway?`)) return;
        setErr(''); setIssuing(true);
        try {
            await api.post(`/mentor/internships/${internshipId}/interns/${intern.applicationId}/certificate`);
            await onChange();
        } catch (e) {
            setErr(e.response?.data?.message || 'Failed to issue certificate');
        } finally { setIssuing(false); }
    };

    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${
            processed ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-700/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
        }`}>
            <button onClick={() => setExpanded(v => !v)} className="w-full px-5 py-4 flex items-center gap-4 text-left">
                {intern.student.photoUrl
                    ? <img src={`${MEDIA_URL}/${intern.student.photoUrl}`} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                    : <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black"><UserIcon size={20} /></div>}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{intern.student.fullName}</p>
                        {intern.student.rollNumber && <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded">{intern.student.rollNumber}</span>}
                        {processed && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded"><CheckCircle size={10} /> Processed</span>}
                        {intern.certificate && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded"><Award size={10} /> Certificate Issued</span>}
                        {lowAttendance && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded"><AlertTriangle size={10} /> Low Attendance ({intern.attendance.percent}%)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StatPill label="Attendance" value={`${intern.attendance.percent}% (${intern.attendance.daysAttended}/${intern.attendance.totalDays})`} hue={lowAttendance ? 'amber' : 'emerald'} />
                        <StatPill label="Assignments" value={`${intern.progress.reviewedAssignments}/${intern.progress.totalAssignments} reviewed`} hue="indigo" />
                        <StatPill label="Daily Logs" value={intern.workLogsCount} hue="slate" />
                    </div>
                </div>
                {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {expanded && (
                <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-800">
                    {/* Assignments table */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><ClipboardList size={12} /> Assignments & Scores</h4>
                        {intern.assignments.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No assignments given.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {intern.assignments.map(a => (
                                    <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                                        <FileText size={14} className="text-slate-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                                            {a.submission ? (
                                                <p className="text-[10px] text-slate-500 truncate">
                                                    Submitted {new Date(a.submission.submissionDate).toLocaleDateString('en-IN')}
                                                    {a.submission.mentorFeedback ? ` • "${a.submission.mentorFeedback}"` : ''}
                                                </p>
                                            ) : <p className="text-[10px] text-amber-600">Not submitted</p>}
                                        </div>
                                        {a.submission?.satisfactionPercent != null && (
                                            <div className="shrink-0 flex items-center gap-2">
                                                <Bar pct={a.submission.satisfactionPercent} color={a.submission.satisfactionPercent >= 70 ? 'bg-emerald-500' : a.submission.satisfactionPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                                                <span className="text-xs font-black text-slate-700 w-10 text-right">{a.submission.satisfactionPercent}%</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Remarks + satisfaction */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Overall Remarks & Satisfaction</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <textarea
                                rows={3} value={remarks} onChange={e => setRemarks(e.target.value)}
                                placeholder="How did this intern perform? Strengths, areas to improve…"
                                className="col-span-2 text-sm p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                            />
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase text-slate-500">Satisfaction %</label>
                                <input
                                    type="number" min="0" max="100" value={sat}
                                    onChange={e => setSat(e.target.value)}
                                    placeholder="0-100"
                                    className="w-full px-3 py-2 text-center font-black text-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                                <Bar pct={Number(sat) || 0} color={Number(sat) >= 70 ? 'bg-emerald-500' : Number(sat) >= 40 ? 'bg-amber-500' : 'bg-red-500'} height="h-2" />
                            </div>
                        </div>
                    </div>

                    {err && <div className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-2"><AlertTriangle size={13} /> {err}</div>}

                    <div className="flex flex-wrap gap-2 pt-1">
                        <button onClick={saveRemarks} disabled={saving}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                            {processed ? 'Update remarks' : 'Save & mark processed'}
                        </button>
                        {intern.certificate ? (
                            <a href={`${MEDIA_URL}/${intern.certificate.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg flex items-center gap-2 border border-purple-200">
                                <Download size={13} /> View Certificate
                            </a>
                        ) : (
                            <button onClick={issueCert} disabled={issuing || !processed}
                                title={!processed ? 'Save remarks first' : (lowAttendance ? 'Low attendance — confirmation required' : 'Issue certificate')}
                                className={`px-4 py-2 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 ${lowAttendance ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                {issuing ? <Loader2 size={13} className="animate-spin" /> : <Award size={13} />}
                                Issue Certificate
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const CompleteInternshipWizard = ({ internshipId, onClose, onCompleted }) => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');
    const [finalizing, setFinalizing] = useState(false);
    const [pwModal, setPwModal] = useState(false);
    const [password, setPassword] = useState('');
    const [pwError, setPwError] = useState('');

    const load = async () => {
        try {
            const res = await api.get(`/mentor/internships/${internshipId}/completion-summary`);
            setSummary(res.data.data);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load completion summary');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [internshipId]);

    const finalize = async () => {
        setPwError(''); setFinalizing(true);
        try {
            await api.post(`/mentor/internships/${internshipId}/finalize`, { password });
            setPwModal(false);
            onCompleted?.();
        } catch (e) {
            setPwError(e.response?.data?.message || 'Failed to finalize internship');
        } finally {
            setFinalizing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-stretch justify-center p-4 overflow-y-auto">
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl w-full max-w-5xl my-auto shadow-2xl border-2 border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-t-2xl">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Complete Internship Workflow</p>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                            {summary?.internship?.title || 'Loading…'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {loading && <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>}
                    {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-700 flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}

                    {summary && (
                        <>
                            {/* Stats banner */}
                            <div className="grid grid-cols-4 gap-3">
                                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Total Interns</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.stats.total}</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Processed</p>
                                    <p className="text-2xl font-black text-emerald-600">{summary.stats.processed}</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Certificates Issued</p>
                                    <p className="text-2xl font-black text-purple-600">{summary.stats.certificatesIssued}</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Status</p>
                                    <p className={`text-sm font-black mt-1 ${summary.internship.completionStatus === 'COMPLETED' ? 'text-purple-700' : 'text-indigo-700'}`}>
                                        {summary.internship.completionStatus || 'ONGOING'}
                                    </p>
                                </div>
                            </div>

                            {summary.interns.length === 0
                                ? <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                    <p className="text-sm font-bold text-slate-500">No interns assigned to you in this internship.</p>
                                </div>
                                : summary.interns.map(intern => (
                                    <InternCard key={intern.applicationId} intern={intern} internshipId={internshipId} onChange={load} />
                                ))
                            }
                        </>
                    )}
                </div>

                {/* Footer */}
                {summary && (
                    <div className="px-6 py-4 border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-xs font-bold text-slate-500">
                            {summary.stats.canFinalize
                                ? <span className="text-emerald-700 flex items-center gap-1.5"><CheckCircle size={14} /> All interns processed. You can finalize this internship.</span>
                                : summary.internship.completionStatus === 'COMPLETED'
                                    ? <span className="text-purple-700 flex items-center gap-1.5"><Lock size={14} /> Internship has been finalized on {new Date(summary.internship.completedAt).toLocaleString('en-IN')}.</span>
                                    : <span>{summary.stats.total - summary.stats.processed} intern(s) still need remarks/certificate decisions before you can finalize.</span>}
                        </p>
                        <div className="flex gap-2">
                            <button onClick={onClose}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                Close
                            </button>
                            <button
                                onClick={() => { setPassword(''); setPwError(''); setPwModal(true); }}
                                disabled={!summary.stats.canFinalize}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-purple-500/20">
                                <ShieldCheck size={15} /> Finalize Internship
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Password re-auth modal */}
            {pwModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/80 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border-2 border-slate-200 dark:border-slate-800 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Lock size={22} className="text-purple-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Re-enter your password</h3>
                                <p className="text-xs text-slate-500">Required to finalize the internship</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            This will mark the internship as <strong>COMPLETED</strong> and lock all intern records. This action cannot be undone.
                        </p>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="Your account password"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                            onKeyDown={e => e.key === 'Enter' && password && finalize()}
                        />
                        {pwError && <div className="mt-3 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-2"><AlertTriangle size={13} /> {pwError}</div>}
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setPwModal(false)} disabled={finalizing}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={finalize} disabled={finalizing || !password}
                                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2">
                                {finalizing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                Confirm Finalize
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompleteInternshipWizard;
