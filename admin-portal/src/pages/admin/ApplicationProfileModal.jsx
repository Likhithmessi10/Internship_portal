import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, User, GraduationCap, Award, CheckCircle, XCircle, BookOpen, Sparkles, Send, Users, Landmark, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { MEDIA_URL } from '../../utils/api';
import Select from '../../components/ui/Select';
import WarningCard from '../../components/ui/WarningCard';

const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    return `${MEDIA_URL}/${url.replace(/\\/g, '/')}`;
};

// Fullscreen PDF/image viewer panel overlay
const DocViewer = ({ url, label, onClose }) => {
    const fullUrl = getMediaUrl(url);
    const isImage = fullUrl && (url?.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fullUrl));

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-gray-900 dark:text-white font-bold text-base tracking-wide">{label}</p>
                        <p className="text-gray-500 dark:text-slate-400 text-xs">Document Viewer</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 font-bold text-sm">
                    <X size={18} /> Close View
                </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 sm:p-12">
                {!fullUrl ? (
                    <div className="text-center p-8 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                        <FileText size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                        <p className="text-gray-500 dark:text-slate-400 font-medium">Document file is not available.</p>
                    </div>
                ) : isImage ? (
                    <img src={fullUrl} alt={label} className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-gray-200 dark:ring-white/10" />
                ) : (
                    <div className="w-full h-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-gray-200 dark:ring-white/10">
                        <iframe
                            src={fullUrl}
                            title={label}
                            className="w-full h-full border-0"
                            style={{ minHeight: '80vh' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-outline-variant/5 dark:border-slate-800/50 last:border-0">
        <span className="text-[10px] text-outline dark:text-slate-500 font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-primary dark:text-indigo-400 font-bold text-right max-w-xs uppercase">{value || '—'}</span>
    </div>
);

const Badge = ({ yes, label }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
        ${yes ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
        {yes ? <CheckCircle size={10} /> : <XCircle size={10} />} {label}
    </span>
);

const DocRow = ({ doc, label, onView }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-high/40 dark:bg-slate-800/40 border border-outline-variant/10 dark:border-slate-800">
        <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-lg ${doc ? 'text-primary dark:text-indigo-400' : 'text-outline/30 dark:text-slate-700'}`}>description</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${doc ? 'text-primary dark:text-indigo-400' : 'text-outline/30 dark:text-slate-700'}`}>{label}</span>
        </div>
        {doc ? (
            <button onClick={() => onView(doc.url, label)}
                className="text-[9px] px-3 py-1.5 bg-primary dark:bg-indigo-600 text-white font-bold rounded uppercase tracking-widest hover:opacity-90 transition-all">
                View File
            </button>
        ) : (
            <span className="text-[9px] text-outline/30 dark:text-slate-700 font-bold uppercase tracking-widest">Missing</span>
        )}
    </div>
);

const ApplicationProfileModal = ({ application, internship, allApplications = [], onClose, updateStatus }) => {
    const { user } = useAuth();
    const [viewerUrl, setViewerUrl] = useState(null);
    const [viewerLabel, setViewerLabel] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [manualRollNumber, setManualRollNumber] = useState('');
    const [joiningDate, setJoiningDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [mentorIdInput, setMentorIdInput] = useState('');
    const [mentors, setMentors] = useState([]);
    const [loadingMentors, setLoadingMentors] = useState(false);
    const [interviewScore, setInterviewScore] = useState('');

    // Instructor Schema fields
    const [member1Score, setMember1Score] = useState('');
    const [member2Score, setMember2Score] = useState('');
    const [member3Score, setMember3Score] = useState('');
    const [warning, setWarning] = useState(null);

    // Evaluation States
    const [evalScores, setEvalScores] = useState({});
    const [evalComments, setEvalComments] = useState({});
    const [overallComments, setOverallComments] = useState('');
    const [submittingEval, setSubmittingEval] = useState(false);

    const isNonStipend = internship?.internshipType === 'NON_STIPEND' || application?.internship?.internshipType === 'NON_STIPEND';

    useEffect(() => {
        if (isNonStipend && !selectedRole) {
            setSelectedRole(application.field?.fieldName || internship?.title || '');
        }
    }, [isNonStipend, application.field?.fieldName, internship?.title, selectedRole]);

    // Destructure application properties early to avoid "cannot access before initialization"
    if (!application) return null;
    const { student, documents, status, trackingId, createdAt } = application;
    const evaluationCriteria = (internship?.evaluationCriteria && internship.evaluationCriteria.length > 0)
        ? internship.evaluationCriteria
        : (application?.internship?.evaluationCriteria || []);

    useEffect(() => {
        if (status === 'SUBMITTED' && ['ADMIN', 'CE_PRTI', 'HOD'].includes(user?.role)) {
            fetchMentors();
        }
    }, [status, user?.role]);

    const fetchMentors = async () => {
        setLoadingMentors(true);
        try {
            // Fetch mentors from the SAME DEPARTMENT as the internship
            const res = await api.get(`/admin/users?role=MENTOR&department=${encodeURIComponent(internship.department)}`);
            const allMentors = res.data.data || [];

            // Filter to ensure only same-department mentors are shown
            const sameDeptMentors = allMentors.filter(m => m.department === internship.department);

            setMentors(sameDeptMentors);

            if (sameDeptMentors.length === 0) {
                setWarning(`No mentors found from ${internship.department} department. HOD must assign a mentor from the same department.`);
            }
        } catch (err) {
            console.error('Failed to fetch mentors', err);
            setMentors([]);
        } finally {
            setLoadingMentors(false);
        }
    };

    const getDoc = (type, label) => documents?.find(d => d.type === type || d.type === label);
    const resumeDoc = getDoc('RESUME', 'Resume / CV');
    const nocDoc = getDoc('NOC_LETTER', 'NOC Letter') || getDoc('PRINCIPAL_LETTER', 'Principal Letter');
    const hodDoc = getDoc('HOD_LETTER', 'HOD Letter');
    const markDoc = getDoc('MARKSHEET', 'Mark Sheet');
    const photoDoc = getDoc('PASSPORT_PHOTO', 'Passport Size Photo');

    const openViewer = (url, label) => { setViewerUrl(url); setViewerLabel(label); };
    const closeViewer = () => { setViewerUrl(null); setViewerLabel(''); };

    const handleForwardCommittee = () => {
        const shortlistedCount = allApplications.filter(a => a.internshipId === internship.id && a.status === 'SHORTLISTED').length;
        const limit = internship.shortlistLimit || 50;

        if (shortlistedCount >= limit) {
            if (!window.confirm(`Warning: Shortlist limit (${limit}) reached or exceeded (Current: ${shortlistedCount}). Do you want to override and continue shortlisting?`)) {
                return;
            }
        }

        const nextStatus = isNonStipend ? 'SELECTED' : 'SHORTLISTED';

        if (user?.role === 'HOD' && !isNonStipend) {
            if (!mentorIdInput) {
                setWarning('HOD must assign a mentor to shortlist the candidate.');
                return;
            }
            updateStatus(nextStatus, { mentorId: mentorIdInput });
        } else {
            updateStatus(nextStatus);
        }
    };

    const handleEvaluationSubmit = async () => {
        const criteria = evaluationCriteria || [];
        if (criteria.length === 0) {
            return setWarning('No evaluation criteria defined for this internship.');
        }

        const missing = criteria.filter(q => !evalScores[q.id]);
        if (missing.length > 0) {
            return setWarning(`Please score all criteria: ${missing.map(m => m.question).join(', ')}`);
        }

        const scoreArray = criteria.map(q => ({
            questionId: q.id,
            score: parseFloat(evalScores[q.id]),
            comments: evalComments[q.id] || ''
        }));

        setSubmittingEval(true);
        try {
            await api.post(`/prti/committees/evaluate`, {
                applicationId: application.id,
                scores: scoreArray,
                comments: overallComments
            });
            alert('Evaluation scores submitted successfully.');
            window.location.reload();
        } catch (err) {
            console.error(err);
            setWarning(err.response?.data?.message || 'Failed to submit evaluation.');
        } finally {
            setSubmittingEval(false);
        }
    };

    const handleHire = () => {
        if (!selectedRole && internship?.rolesData?.length > 0) return setWarning('Assign a role.');
        if (!joiningDate || !endDate) return setWarning('Specify Joining and End dates.');
        
        // For non-stipend, PRTI/Admin hires officially from SELECTED status
        const targetStatus = 'HIRED'; 
        updateStatus(targetStatus, { joiningDate, endDate, assignedRole: selectedRole });
    };



    const handleReject = () => updateStatus('REJECTED');

    const statusColor = {
        PENDING: 'bg-amber-100 text-amber-700',
        SHORTLISTED: 'bg-blue-100 text-blue-700',
        HIRED: 'bg-emerald-100 text-emerald-700',
        REJECTED: 'bg-red-100 text-red-700',
    }[status] || 'bg-gray-100 text-gray-700';

    return createPortal(
        <>
            {warning && <WarningCard message={warning} onClose={() => setWarning(null)} />}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 z-10 border border-white/20">
                    {/* Stitch-style Header Section */}
                    <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-outline-variant/10 dark:border-slate-800 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            {photoDoc || student?.photoUrl ? (
                                <img
                                    src={getMediaUrl(photoDoc ? photoDoc.url : student.photoUrl)}
                                    alt="Candidate"
                                    className="w-14 h-14 rounded-lg object-cover ring-2 ring-primary/10 dark:ring-white/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => openViewer(photoDoc ? photoDoc.url : student.photoUrl, 'Candidate Photo')}
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-primary dark:bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl uppercase shadow-md">
                                    {student?.fullName?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <span className="text-[10px] font-bold tracking-[0.1em] text-outline dark:text-indigo-400 uppercase mb-0.5 block">Application Profile</span>
                                <h2 className="text-2xl font-bold text-primary dark:text-white tracking-tight leading-none flex items-center gap-2">
                                    {student?.fullName}
                                    {application.shortlistCategory === 'FALLBACK' && (
                                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded text-[10px] uppercase tracking-widest border border-yellow-200 dark:border-yellow-800">Fallback Application</span>
                                    )}
                                </h2>
                                <p className="text-[10px] text-outline dark:text-slate-500 font-bold mt-1.5 tracking-wider uppercase">ID: {trackingId} · SUBMITTED {new Date(createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.15em] border ${!isNonStipend
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                }`}>
                                {!isNonStipend ? 'MONETARY' : 'NON-MONETARY'}
                            </span>
                            <span className="px-3 py-1 bg-primary/10 dark:bg-indigo-900/30 rounded text-[10px] font-bold text-primary dark:text-indigo-300 uppercase tracking-[0.15em] border border-primary/20 dark:border-indigo-800/50">{status}</span>
                            <button onClick={onClose} className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-outline dark:text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-10 space-y-12 overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-slate-900/40">
                        {/* Section Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Personal */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-xl">person</span>
                                    <h3 className="text-xs font-bold text-primary dark:text-white uppercase tracking-widest pt-1">Personal Details</h3>
                                </div>
                                <div className="bg-surface-container-lowest dark:bg-slate-800/50 p-5 rounded-lg border border-outline-variant/10 dark:border-slate-800">
                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-outline-variant/10 dark:border-slate-700/50">
                                        {photoDoc || student?.photoUrl ? (
                                            <img
                                                src={getMediaUrl(photoDoc ? photoDoc.url : student.photoUrl)}
                                                alt="Student"
                                                className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => openViewer(photoDoc ? photoDoc.url : student.photoUrl, 'Passport Photo')}
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-3xl">
                                                {student?.fullName?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[9px] font-bold text-outline dark:text-slate-500 uppercase tracking-widest">Profile Photo</p>
                                            <p className="text-xs font-bold text-primary dark:text-indigo-300">
                                                {photoDoc ? 'Uploaded Passport Photo' : student?.photoUrl ? 'Profile Picture' : 'No Photo'}
                                            </p>
                                        </div>
                                    </div>
                                    <InfoRow label="Phone" value={student?.phone} />
                                    <InfoRow label="Date of Birth" value={student?.dob ? new Date(student.dob).toLocaleDateString() : null} />
                                    <InfoRow label="Aadhaar" value={student?.aadhar ? `XXXX XXXX ${student.aadhar.slice(-4)}` : null} />
                                    <InfoRow label="Address" value={student?.address} />
                                </div>
                            </section>

                            {/* Academic */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-xl">school</span>
                                    <h3 className="text-xs font-bold text-primary dark:text-white uppercase tracking-widest pt-1">Academic Profile</h3>
                                </div>
                                <div className="bg-surface-container-lowest dark:bg-slate-800/50 p-5 rounded-lg border border-outline-variant/10 dark:border-slate-800">
                                    <InfoRow label="College" value={student?.collegeName} />
                                    <InfoRow label="Year of Study" value={student?.yearOfStudy} />
                                    <InfoRow label="CGPA" value={student?.cgpa} />
                                    <InfoRow label="Tier" value={student?.collegeCategory} />
                                    <InfoRow label="NIRF Rank" value={student.nirfRanking ? `#${student.nirfRanking}` : 'N/A'} />
                                    <InfoRow label="Assigned ID" value={student.rollNumber} />
                                    <InfoRow label="Pref. Location" value={application?.preferredLocation} />
                                </div>
                            </section>


                            {/* Custom Question Answers */}
                            {internship?.customQuestions?.length > 0 && (
                                <section className="col-span-1 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-xl">quiz</span>
                                        <h3 className="text-xs font-bold text-primary dark:text-white uppercase tracking-widest pt-1">Application Questionnaire</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {internship.customQuestions.map((q, idx) => (
                                            <div key={idx} className="p-5 bg-surface-container-lowest dark:bg-slate-800/50 rounded-xl border border-outline-variant/10 dark:border-slate-700/50">
                                                <p className="text-[10px] font-bold text-outline dark:text-slate-500 uppercase tracking-widest mb-3">Q: {q}</p>
                                                <div className="p-4 bg-primary/5 dark:bg-indigo-900/10 rounded-lg border border-primary/10 dark:border-indigo-800/30">
                                                    <p className="text-sm font-medium text-primary dark:text-slate-200 leading-relaxed italic">
                                                        "{application.questionAnswers?.[idx] || 'No response provided'}"
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Social URLs Section */}
                            {(student?.linkedinUrl || student?.githubUrl) && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-xl">share</span>
                                        <h3 className="text-xs font-bold text-primary dark:text-white uppercase tracking-widest pt-1">Professional Profiles</h3>
                                    </div>
                                    <div className="bg-surface-container-lowest dark:bg-slate-800/50 p-5 rounded-lg border border-outline-variant/10 dark:border-slate-800 space-y-3">
                                        {student?.linkedinUrl && (
                                            <div className="flex items-center gap-3 p-3 bg-[#0077b5]/5 rounded-lg border border-[#0077b5]/20">
                                                <div className="w-8 h-8 rounded-lg bg-[#0077b5]/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[#0077b5] text-lg">link</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-bold text-[#0077b5] uppercase tracking-widest">LinkedIn</p>
                                                    <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline truncate block">
                                                        {student.linkedinUrl}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {student?.githubUrl && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-200">
                                                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-gray-700 text-lg">code</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">GitHub</p>
                                                    <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline truncate block">
                                                        {student.githubUrl}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Statement of Purpose */}
                        {application?.sop && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary text-xl">article</span>
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Statement of Purpose</h3>
                                </div>
                                <div className="bg-primary/5 dark:bg-indigo-900/20 p-6 rounded-lg border border-primary/10 dark:border-indigo-800/30">
                                    <p className="text-xs font-medium text-primary/80 dark:text-indigo-300/80 leading-relaxed whitespace-pre-wrap italic">
                                        "{application.sop}"
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Full Width Sections */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-xl">description</span>
                                <h3 className="text-xs font-bold text-primary dark:text-white uppercase tracking-widest pt-1">Documentation Pool</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {internship?.requiredDocuments && internship.requiredDocuments.length > 0 ? (
                                    internship.requiredDocuments.map(reqDoc => {
                                        let doc = getDoc(reqDoc.id, reqDoc.label);
                                        if (!doc) {
                                            if (reqDoc.id === 'NOC_LETTER') doc = getDoc('PRINCIPAL_LETTER', 'Principal Letter');
                                            else if (reqDoc.id === 'PRINCIPAL_LETTER') doc = getDoc('NOC_LETTER', 'NOC Letter');
                                        }
                                        return <DocRow key={reqDoc.id} doc={doc} label={reqDoc.label} onView={openViewer} />;
                                    })
                                ) : (
                                    <>
                                        <DocRow doc={resumeDoc} label="Resume / CV" onView={openViewer} />
                                        <DocRow doc={nocDoc} label="Principal Letter" onView={openViewer} />
                                        <DocRow doc={hodDoc} label="HOD Letter" onView={openViewer} />
                                        <DocRow doc={markDoc} label="Mark Sheet" onView={openViewer} />
                                    </>
                                )}
                            </div>
                        </section>
                        
                        {/* Joining Documents (Visible once uploaded) */}
                        {(getDoc('NOC', 'No Objection Certificate') || getDoc('BOND', 'Bond / Service Agreement') || getDoc('UNDERTAKING', 'Undertaking Form')) && (
                            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-xl">fact_check</span>
                                    <h3 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest pt-1">Joining Documents</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <DocRow doc={getDoc('NOC', 'No Objection Certificate')} label="NOC Certificate" onView={openViewer} />
                                    <DocRow doc={getDoc('BOND', 'Bond / Service Agreement')} label="Service Bond" onView={openViewer} />
                                    <DocRow doc={getDoc('UNDERTAKING', 'Undertaking Form')} label="Undertaking" onView={openViewer} />
                                </div>
                            </section>
                        )}

                        {/* Stipend / Bank Details (Instructor Requirement) */}
                        {application.stipend && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Landmark size={14} /> Stipend & Banking Information
                                </h3>
                                <div className="bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-5 shadow-sm space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow label="Bank Name" value={application.stipend.bankName} />
                                        <InfoRow label="Bank Branch" value={application.stipend.bankBranch} />
                                        <InfoRow label="IFSC Code" value={application.stipend.ifscCode} />
                                        <InfoRow label="PAN Number" value={application.stipend.panNumber} />
                                    </div>
                                    <div className="pt-2 border-t border-emerald-100/50 dark:border-emerald-800/50">
                                        <InfoRow label="Account Number" value={application.stipend.bankAccount} />
                                    </div>
                                    <p className="text-[9px] text-emerald-600/60 dark:text-emerald-500/60 font-medium uppercase tracking-tight text-center">Instructor Schema Compliant: `bank_name`, `bank_branch` included</p>
                                </div>
                            </section>
                        )}

                        {/* Actions */}
                        {status === 'SUBMITTED' && ['ADMIN', 'CE_PRTI', 'HOD'].includes(user?.role) && (
                            <div className="pt-8 mt-4 border-t border-outline-variant/10 dark:border-slate-800">
                                <div className="bg-surface-container-high dark:bg-slate-800/50 p-8 rounded-lg border border-outline-variant/10 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary dark:text-indigo-400 text-lg">fact_check</span>
                                        <h4 className="text-[10px] font-bold text-primary dark:text-white uppercase tracking-[0.2em]">Application Review</h4>
                                    </div>

                                    {user?.role === 'HOD' && internship?.internshipType !== 'NON_STIPEND' && (
                                        <div className="mb-6 space-y-2">
                                            <label className="text-[10px] font-bold text-outline dark:text-slate-500 uppercase tracking-widest ml-1">Assign Mentor (Required for Shortlisting)</label>
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 border border-outline-variant/20 dark:border-slate-700 rounded px-4 py-3 text-xs font-bold text-primary dark:text-white focus:outline-emerald-500"
                                                value={mentorIdInput}
                                                onChange={e => setMentorIdInput(e.target.value)}
                                            >
                                                <option value="">Select a Mentor</option>
                                                {loadingMentors ? (
                                                    <option value="" disabled>Loading mentors...</option>
                                                ) : mentors.length > 0 ? (
                                                    mentors.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>No mentors found in {internship?.department}</option>
                                                )}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button onClick={handleForwardCommittee} className="flex-1 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 group">
                                            {isNonStipend ? 'Select Candidate' : 'Shortlist Candidate'} <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">check_circle</span>
                                        </button>
                                        <button onClick={handleReject} className="flex-1 border border-error text-error text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:bg-error/5 transition-all flex items-center justify-center gap-2">
                                            Reject Candidate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(['SHORTLISTED', 'UNDER_COMMITTEE_REVIEW', 'SELECTED'].includes(status) || (isNonStipend && ['SUBMITTED', 'SHORTLISTED', 'SELECTED', 'APPROVED'].includes(status))) && ['ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'].includes(user?.role) && (
                            <div className="pt-8 mt-4 border-t border-outline-variant/10 dark:border-slate-800">
                                
                                {!isNonStipend && (
                                    <div className="bg-surface-container-high dark:bg-slate-800/50 p-8 rounded-lg border border-outline-variant/10 dark:border-slate-800 shadow-sm mb-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/50"></div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">star_rate</span>
                                                <h4 className="text-[10px] font-bold text-blue-600 dark:text-white uppercase tracking-[0.2em]">Committee Evaluation</h4>
                                            </div>
                                            {application.committeeFinalScore > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-outline">Avg Score:</span>
                                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-100 dark:border-blue-800">
                                                            {Number(application.committeeFinalScore).toFixed(1)} / {(evaluationCriteria?.length || 0) * 50}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Existing Evaluations List */}
                                        {application.evaluationScores?.length > 0 && (
                                            <div className="mb-6 space-y-3">
                                                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Submitted Scores</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {(() => {
                                                        const scores = application.evaluationScores || [];
                                                        const roles = ['HOD', 'MENTOR', 'CE_PRTI'];
                                                        const criteriaCount = evaluationCriteria?.length || 0;
                                                        const totalMax = criteriaCount * 50;

                                                        const roleTotals = roles.map(r => {
                                                            const roleScores = scores.filter(s => r === 'CE_PRTI' ? (s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER') : s.role === r);
                                                            const total = roleScores.reduce((acc, s) => acc + (Number(s.score) || 0), 0);
                                                            const distinct = new Set(roleScores.map(s => s.questionId)).size;
                                                            const complete = criteriaCount > 0 && distinct >= criteriaCount;
                                                            return { role: r, total, complete };
                                                        });

                                                        return roleTotals.map((rt) => (
                                                            <div key={rt.role} className="p-3 bg-white dark:bg-slate-900 border border-outline-variant/20 rounded flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-primary dark:text-white uppercase">{rt.role.replace('_', ' ')}</p>
                                                                    <p className={`text-[9px] font-bold mt-1 ${rt.complete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                        {rt.complete ? 'Complete' : 'Pending'}
                                                                    </p>
                                                                </div>
                                                                <span className="font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                                                    {rt.total} / {totalMax}
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Multi-Question Evaluation Form for Current User */}
                                        {(() => {
                                            const criteriaCount = internship?.evaluationCriteria?.length || 0;
                                            const myDistinct = new Set((application.evaluationScores || []).filter(s => s.memberId === user?.id).map(s => s.questionId)).size;
                                            const hasSubmitted = criteriaCount > 0 && myDistinct >= criteriaCount;
                                            return !hasSubmitted;
                                        })() ? (
                                            <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 shadow-sm">
                                                <div className="flex items-center justify-between mb-6">
                                                    <p className="text-[10px] font-bold text-primary dark:text-white uppercase tracking-widest">Score each criteria (0-50)</p>
                                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">Total Score: {Object.values(evalScores).reduce((a, b) => a + Number(b || 0), 0)}</span>
                                                </div>
                                                
                                                <div className="space-y-6">
                                                    {evaluationCriteria?.map((q, idx) => (
                                                        <div key={q.id} className="p-4 bg-surface-container-low/30 rounded-xl border border-outline-variant/10">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex-1">
                                                                    <span className="text-[9px] font-bold text-outline uppercase block mb-1">Criterion {idx + 1}</span>
                                                                    <p className="text-sm font-bold text-primary dark:text-white">{q.question}</p>
                                                                </div>
                                                                <div className="w-24 ml-4">
                                                                    <label className="text-[9px] font-bold text-outline uppercase block mb-1">Score (0-50)</label>
                                                                    <input 
                                                                        type="number" min="0" max="50" step="1" 
                                                                        value={evalScores[q.id] || ''} 
                                                                        onChange={e => setEvalScores({...evalScores, [q.id]: e.target.value})} 
                                                                        className="w-full bg-white dark:bg-slate-800 border border-outline-variant/20 rounded px-3 py-2 text-sm font-bold text-primary dark:text-white focus:outline-blue-500" 
                                                                        placeholder="0-50" 
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <input 
                                                                    type="text" 
                                                                    value={evalComments[q.id] || ''} 
                                                                    onChange={e => setEvalComments({...evalComments, [q.id]: e.target.value})} 
                                                                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-outline-variant/10 rounded px-3 py-1.5 text-[11px] font-medium text-primary dark:text-white placeholder:text-outline/30 focus:outline-blue-400" 
                                                                    placeholder="Comments for this criterion..." 
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-outline-variant/10">
                                                    <label className="text-[10px] font-bold text-outline uppercase block mb-2">Overall Recommendation / Comments</label>
                                                    <textarea 
                                                        value={overallComments}
                                                        onChange={e => setOverallComments(e.target.value)}
                                                        className="w-full bg-surface-container-low/30 border border-outline-variant/10 rounded-xl p-4 text-sm font-medium text-primary dark:text-white focus:outline-blue-500 min-h-[100px]"
                                                        placeholder="Provide your final thoughts on this candidate..."
                                                    />
                                                </div>

                                                <button onClick={handleEvaluationSubmit} disabled={submittingEval} className="mt-6 w-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-50">
                                                    {submittingEval ? 'SUBMITTING SCORES...' : 'SUBMIT FINAL EVALUATION'}
                                                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">send</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-4">
                                                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-3xl">verified</span>
                                                </div>
                                                <h5 className="text-sm font-black text-emerald-900 dark:text-white uppercase tracking-widest mb-1">Evaluation Submitted</h5>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold uppercase opacity-70">Your scores have been recorded for the committee review</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Institutional Onboarding (Only for PRTI/ADMIN in SELECTED/APPROVED status) */}
                                {['ADMIN', 'CE_PRTI'].includes(user?.role) && ['SELECTED', 'APPROVED'].includes(status) && (
                                <div className="bg-surface-container-high dark:bg-slate-800/50 p-8 rounded-lg border border-outline-variant/10 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                    {/* Accent bar for confirmation */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/50"></div>

                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">verified</span>
                                        <h4 className="text-[10px] font-bold text-emerald-600 dark:text-white uppercase tracking-[0.2em]">Institutional Onboarding</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-outline dark:text-slate-500 uppercase tracking-widest ml-1">Allocated Unit/Position</label>
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 border border-outline-variant/20 dark:border-slate-700 rounded px-4 py-3 text-xs font-bold text-primary dark:text-white focus:outline-emerald-500"
                                                value={selectedRole}
                                                onChange={e => setSelectedRole(e.target.value)}
                                            >
                                                <option value="">Choose Position</option>
                                                {internship?.internshipType === 'NON_STIPEND' && (
                                                    <option value={application.field?.fieldName || internship.title}>
                                                        {application.field?.fieldName || internship.title} (Default)
                                                    </option>
                                                )}
                                                {!internship?.rolesData?.length && internship?.roles?.split(',')?.map(r => (
                                                    <option key={r.trim()} value={r.trim()}>{r.trim()}</option>
                                                ))}
                                                {internship?.rolesData?.map(r => {
                                                    const roleHired = application.roleHiredStats?.[r.name] || 0;
                                                    const isFull = roleHired >= (r.openings || 0);
                                                    return (
                                                        <option key={r.name} value={r.name} disabled={isFull}>
                                                            {r.name} ({roleHired} / {r.openings || 0} Filled)
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        <div className="space-y-2 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                    <Zap size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-500 mb-0.5">Automated Identifier</p>
                                                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">System Generated ID</p>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-outline/50 italic ml-1 mt-1">Roll number will be automatically assigned following the YYDDGGNNN protocol upon authorization.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-outline dark:text-slate-500 uppercase block ml-1">Commencement Date</label>
                                            <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-outline-variant/20 dark:border-slate-700 rounded px-4 py-2 text-[11px] font-bold text-primary dark:text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-outline dark:text-slate-500 uppercase block ml-1">Completion Date</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-outline-variant/20 dark:border-slate-700 rounded px-4 py-2 text-[11px] font-bold text-primary dark:text-white" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {isNonStipend && status === 'SELECTED' && (!getDoc('NOC', 'No Objection Certificate') || !getDoc('BOND', 'Bond / Service Agreement') || !getDoc('UNDERTAKING', 'Undertaking Form')) && (
                                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg flex items-center gap-2">
                                                <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
                                                <p className="text-[9px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">Joining documents are incomplete. Verify manually before hiring.</p>
                                            </div>
                                        )}
                                        <div className="flex gap-4">
                                            <button onClick={handleHire}
                                                disabled={internship?.rolesData?.length > 0 && !selectedRole}
                                                className="flex-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                                                Authorize & Mark as Hired <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">verified_user</span>
                                            </button>
                                            <button onClick={handleReject} className="flex-1 border border-error text-error text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:bg-error/5 transition-all flex items-center justify-center gap-2">
                                                Reject Candidate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        )}
                        {status === 'APPROVED' && (
                            <div className="mt-8 pt-8 border-t border-outline-variant/10 dark:border-slate-800 flex flex-col gap-6">
                                <div className="flex items-center gap-4 p-6 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">check_circle</span>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-900 dark:text-white uppercase tracking-widest leading-none">Onboarding Complete</p>
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold mt-1 uppercase opacity-70">Institutional access granted</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {application.assignedRole && (
                                        <div className="p-4 bg-surface-container-lowest dark:bg-slate-800/50 border border-outline-variant/10 dark:border-slate-700 rounded-lg">
                                            <p className="text-[9px] uppercase font-bold tracking-[0.15em] text-outline dark:text-slate-500 mb-1">Target Designation</p>
                                            <p className="text-xs font-bold text-primary dark:text-white">{application.assignedRole}</p>
                                        </div>
                                    )}
                                    {(application.joiningDate || application.endDate) && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {application.joiningDate && (
                                                <div className="px-3 py-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/30 rounded-lg shadow-sm">
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-emerald-500">Joining</p>
                                                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400">{new Date(application.joiningDate).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                            {application.endDate && (
                                                <div className="px-3 py-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/30 rounded-lg shadow-sm">
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-emerald-500">End Date</p>
                                                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400">{new Date(application.endDate).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {status === 'REJECTED' && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 mt-6">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                    <XCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-800 dark:text-red-200">Application Rejected</p>
                                    <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">This candidate was not selected for the role.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Viewer (fullscreen overlay with high z-index) */}
            {viewerUrl && <DocViewer url={viewerUrl} label={viewerLabel} onClose={closeViewer} />}
        </>,
        document.body
    );
};

export default ApplicationProfileModal;
