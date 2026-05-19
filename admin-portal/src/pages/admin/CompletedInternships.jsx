import React, { useEffect, useState } from 'react';
import api, { MEDIA_URL } from '../../utils/api';
import {
    Loader2, AlertTriangle, ChevronLeft, Award, Calendar, Users,
    FileText, Download, BookOpen, ClipboardList, CheckCircle, X, ChevronRight,
    User as UserIcon
} from 'lucide-react';

const Pill = ({ label, value, hue = 'indigo' }) => {
    const c = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200'
    }[hue];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${c}`}>
            <span className="opacity-70">{label}:</span>{value}
        </span>
    );
};

const InternDetailModal = ({ intern, onClose }) => (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-stretch justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl my-auto shadow-2xl border-2 border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]">
            <div className="px-6 py-5 border-b-2 border-slate-100 dark:border-slate-800 flex items-center gap-4 sticky top-0 bg-white dark:bg-slate-900 rounded-t-2xl z-10">
                {intern.student.photoUrl
                    ? <img src={`${MEDIA_URL}/${intern.student.photoUrl}`} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                    : <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center"><UserIcon size={22} className="text-indigo-600" /></div>}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{intern.student.fullName}</h3>
                    <p className="text-xs text-slate-500">{intern.student.rollNumber && <span className="font-mono">{intern.student.rollNumber} · </span>}{intern.student.collegeName}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
                {/* Summary */}
                <div className="flex flex-wrap gap-2">
                    <Pill label="Status" value={intern.completionStatus || '—'} hue="purple" />
                    <Pill label="Attendance" value={`${intern.attendance.percent}% (${intern.attendance.daysAttended}/${intern.attendance.totalDays})`} hue={intern.attendance.lowAttendance ? 'amber' : 'emerald'} />
                    {intern.mentorSatisfactionPercent != null && <Pill label="Mentor Satisfaction" value={`${intern.mentorSatisfactionPercent}%`} hue="indigo" />}
                    <Pill label="Mentor" value={intern.mentor?.name || '—'} hue="slate" />
                    {intern.certificate && (
                        <a href={`${MEDIA_URL}/${intern.certificate.fileUrl}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                            <Award size={11} /> Certificate <Download size={10} />
                        </a>
                    )}
                </div>

                {/* Mentor remarks */}
                {intern.mentorRemarks && (
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Mentor's Remarks</h4>
                        <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl whitespace-pre-wrap">{intern.mentorRemarks}</p>
                    </div>
                )}

                {/* Assignments */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><ClipboardList size={12} /> Assignments ({intern.assignments.length})</h4>
                    {intern.assignments.length === 0 ? <p className="text-xs text-slate-400 italic">No assignments.</p> : (
                        <div className="space-y-1.5">
                            {intern.assignments.map(a => (
                                <div key={a.id} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{a.title}</p>
                                        {a.submission?.satisfactionPercent != null && (
                                            <span className="px-2 py-0.5 text-[10px] font-black rounded bg-indigo-100 text-indigo-700">{a.submission.satisfactionPercent}%</span>
                                        )}
                                        {a.submission?.attachmentUrl && (
                                            <a href={`${MEDIA_URL}/${a.submission.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-[10px]">View attachment</a>
                                        )}
                                    </div>
                                    {a.submission?.mentorFeedback && <p className="text-[11px] text-slate-500 mt-1">Feedback: {a.submission.mentorFeedback}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Daily logs */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><BookOpen size={12} /> Daily Work Logs ({intern.workLogs.length})</h4>
                    {intern.workLogs.length === 0 ? <p className="text-xs text-slate-400 italic">No work logs submitted.</p> : (
                        <div className="space-y-1.5 max-h-80 overflow-y-auto">
                            {intern.workLogs.map((l, i) => (
                                <div key={i} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-slate-700">{new Date(l.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        {l.hoursWorked != null && <span className="text-[10px] font-bold text-slate-500">{l.hoursWorked}h</span>}
                                    </div>
                                    <p className="text-slate-600 whitespace-pre-wrap">{l.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const InternshipDetailPage = ({ internshipId, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [selectedIntern, setSelectedIntern] = useState(null);

    useEffect(() => {
        let mounted = true;
        api.get(`/admin/completed-internships/${internshipId}`)
            .then(r => mounted && setData(r.data.data))
            .catch(e => mounted && setError(e.response?.data?.message || 'Failed to load'))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, [internshipId]);

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>;
    if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-700 flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>;
    if (!data) return null;

    const { internship, interns } = data;
    const certCount = interns.filter(i => i.certificate).length;

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-700">
                <ChevronLeft size={16} /> Back to completed internships
            </button>

            <section className="bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-700/40 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest"><Award size={11} /> Completed Internship</span>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{internship.title}</h1>
                        <p className="text-sm text-slate-500 mt-1">{internship.department} · {internship.duration} · {internship.internshipMode} {internship.internshipType}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                        {internship.completedAt && (
                            <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5"><Calendar size={12} /> Completed on {new Date(internship.completedAt).toLocaleString('en-IN')}</p>
                        )}
                        {internship.finalizedBy && (
                            <p className="text-[11px] text-slate-500">Finalized by <strong>{internship.finalizedBy.name}</strong></p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-slate-500">Total Interns</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{interns.length}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-emerald-700">Certificates Issued</p>
                        <p className="text-2xl font-black text-emerald-700">{certCount}</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <p className="text-[10px] font-bold uppercase text-amber-700">Low Attendance (&lt; 90%)</p>
                        <p className="text-2xl font-black text-amber-700">{interns.filter(i => i.attendance.lowAttendance).length}</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-base font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2"><Users size={14} /> Interns</h2>
                <div className="space-y-2">
                    {interns.map(intern => (
                        <button key={intern.applicationId} onClick={() => setSelectedIntern(intern)}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl flex items-center gap-4 text-left transition-colors">
                            {intern.student.photoUrl
                                ? <img src={`${MEDIA_URL}/${intern.student.photoUrl}`} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                                : <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700"><UserIcon size={20} /></div>}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{intern.student.fullName}</p>
                                    {intern.student.rollNumber && <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{intern.student.rollNumber}</span>}
                                    {intern.certificate && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded"><Award size={10} /> Certificate</span>}
                                    {intern.attendance.lowAttendance && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded"><AlertTriangle size={10} /> Low Attendance ({intern.attendance.percent}%)</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] font-bold text-slate-500">
                                    <span>{intern.department}</span>
                                    <span>·</span>
                                    <span>Attendance: {intern.attendance.percent}%</span>
                                    <span>·</span>
                                    <span>{intern.assignments.length} assignments</span>
                                    <span>·</span>
                                    <span>{intern.workLogs.length} daily logs</span>
                                    {intern.mentorSatisfactionPercent != null && <><span>·</span><span>Mentor satisfaction: {intern.mentorSatisfactionPercent}%</span></>}
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-400" />
                        </button>
                    ))}
                </div>
            </section>

            {selectedIntern && <InternDetailModal intern={selectedIntern} onClose={() => setSelectedIntern(null)} />}
        </div>
    );
};

const CompletedInternships = () => {
    const [loading, setLoading] = useState(true);
    const [list, setList] = useState([]);
    const [error, setError] = useState('');
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        let mounted = true;
        api.get('/admin/completed-internships')
            .then(r => mounted && setList(r.data.data || []))
            .catch(e => mounted && setError(e.response?.data?.message || 'Failed to load'))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    if (openId) {
        return <InternshipDetailPage internshipId={openId} onBack={() => setOpenId(null)} />;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <section>
                <span className="text-[10px] font-bold tracking-[0.1em] text-purple-600 uppercase mb-1 block">Archive</span>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Award size={30} className="text-purple-600" /> Completed Internships
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                    Browse every internship that has been formally finalized by a mentor. Drill in to see daily work logs, assignments, attendance and issued certificates.
                </p>
            </section>

            {loading && <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-purple-500" /></div>}
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-700 flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}

            {!loading && !error && list.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Award size={42} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">No completed internships yet.</p>
                    <p className="text-xs text-slate-400 mt-1">As mentors finalize internships, they will appear here.</p>
                </div>
            )}

            <div className="space-y-3">
                {list.map(i => (
                    <button key={i.id} onClick={() => setOpenId(i.id)}
                        className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 rounded-2xl flex items-center gap-4 text-left transition-colors group">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
                            <CheckCircle size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-700">{i.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] font-bold text-slate-500">
                                <span>{i.departments.join(', ')}</span>
                                <span>·</span>
                                <span>{i.duration}</span>
                                <span>·</span>
                                <span>{i.internshipMode} {i.internshipType}</span>
                                {i.completedAt && <><span>·</span><span className="text-purple-700">Completed {new Date(i.completedAt).toLocaleDateString('en-IN')}</span></>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{i.completedInterns}<span className="text-slate-400 text-base">/{i.totalInterns}</span></p>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Completed</p>
                            </div>
                            <ChevronRight size={20} className="text-slate-400 group-hover:text-purple-600" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CompletedInternships;
