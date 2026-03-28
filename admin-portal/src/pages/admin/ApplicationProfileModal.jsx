import React, { useState, useEffect } from 'react';
import { X, FileText, User, GraduationCap, Award, CheckCircle, XCircle, BookOpen, Sparkles, Send, Users, Landmark, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    return `http://localhost:5001/${url.replace(/\\/g, '/')}`;
};

// Fullscreen PDF/image viewer panel overlay
const DocViewer = ({ url, label, onClose }) => {
    const fullUrl = getMediaUrl(url);
    const isImage = fullUrl && (url?.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fullUrl));

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white/95 backdrop-blur-md">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-gray-900 font-bold text-base tracking-wide">{label}</p>
                        <p className="text-gray-500 text-xs">Document Viewer</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2 font-bold text-sm">
                    <X size={18} /> Close View
                </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 sm:p-12">
                {!fullUrl ? (
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Document file is not available.</p>
                    </div>
                ) : isImage ? (
                    <img src={fullUrl} alt={label} className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-gray-200" />
                ) : (
                    <div className="w-full h-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-gray-200">
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
    <div className="flex justify-between py-2 border-b border-outline-variant/5 last:border-0">
        <span className="text-[10px] text-outline font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-primary font-bold text-right max-w-xs uppercase">{value || '—'}</span>
    </div>
);

const Badge = ({ yes, label }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
        ${yes ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
        {yes ? <CheckCircle size={10} /> : <XCircle size={10} />} {label}
    </span>
);

const DocRow = ({ doc, label, onView }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-high/40 border border-outline-variant/10">
        <div className="flex items-center gap-3">
             <span className={`material-symbols-outlined text-lg ${doc ? 'text-primary' : 'text-outline/30'}`}>description</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${doc ? 'text-primary' : 'text-outline/30'}`}>{label}</span>
        </div>
        {doc ? (
            <button onClick={() => onView(doc.url, label)}
                className="text-[9px] px-3 py-1.5 bg-primary text-white font-bold rounded uppercase tracking-widest hover:opacity-90 transition-all">
                View File
            </button>
        ) : (
            <span className="text-[9px] text-outline/30 font-bold uppercase tracking-widest">Missing</span>
        )}
    </div>
);

const ApplicationProfileModal = ({ application, internship, onClose, updateStatus }) => {
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

    useEffect(() => {
        if (status === 'SUBMITTED' && ['ADMIN', 'CE_PRTI', 'HOD'].includes(user?.role)) {
            fetchMentors();
        }
    }, [status, user?.role]);

    const fetchMentors = async () => {
        setLoadingMentors(true);
        try {
            const res = await api.get(`/admin/users?role=MENTOR&department=${encodeURIComponent(internship.department)}`);
            setMentors(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch mentors', err);
        } finally {
            setLoadingMentors(false);
        }
    };

    if (!application) return null;
    const { student, documents, status, trackingId, createdAt } = application;

    const getDoc = (type, label) => documents?.find(d => d.type === type || d.type === label);
    const resumeDoc = getDoc('RESUME', 'Resume / CV');
    const nocDoc = getDoc('NOC_LETTER', 'NOC Letter') || getDoc('PRINCIPAL_LETTER', 'Principal Letter');
    const hodDoc = getDoc('HOD_LETTER', 'HOD Letter');
    const markDoc = getDoc('MARKSHEET', 'Mark Sheet');
    const photoDoc = getDoc('PASSPORT_PHOTO', 'Passport Size Photo');

    const openViewer = (url, label) => { setViewerUrl(url); setViewerLabel(label); };
    const closeViewer = () => { setViewerUrl(null); setViewerLabel(''); };

    const handleForwardCommittee = () => {
        if (!mentorIdInput) {
            alert('Please assign a Mentor ID or Name before forwarding to the Committee.');
            return;
        }
        updateStatus('COMMITTEE_EVALUATION', { mentorId: mentorIdInput });
    };

    const handleCommitteeSelect = () => {
        if (!interviewScore) return alert('Enter an interview score (1-100).');
        updateStatus('CA_APPROVED', { 
            score: interviewScore, 
            committeeId: internship.committee?.id || user.id,
            member1Score: member1Score || undefined,
            member2Score: member2Score || undefined,
            member3Score: member3Score || undefined
        });
    };

    const handleHire = () => {
        if (!selectedRole && internship?.rolesData?.length > 0) return alert('Assign a role.');
        if (!manualRollNumber) return alert('Assign an internal Roll Number.');
        if (!joiningDate || !endDate) return alert('Specify Joining and End dates.');
        updateStatus('HIRED', { rollNumber: manualRollNumber, joiningDate, endDate, assignedRole: selectedRole });
    };

    const handleReject = () => updateStatus('REJECTED');

    const statusColor = {
        PENDING: 'bg-amber-100 text-amber-700',
        SHORTLISTED: 'bg-blue-100 text-blue-700',
        HIRED: 'bg-emerald-100 text-emerald-700',
        REJECTED: 'bg-red-100 text-red-700',
    }[status] || 'bg-gray-100 text-gray-700';

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-secondary/20 backdrop-blur-md" onClick={onClose} />
                <div className="relative bg-surface-container-low rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden z-10 border border-outline-variant/10">

                    {/* Stitch-style Header Section */}
                    <div className="shrink-0 bg-white border-b border-outline-variant/10 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            {photoDoc || student?.photoUrl ? (
                                <img
                                    src={getMediaUrl(photoDoc ? photoDoc.url : student.photoUrl)}
                                    alt="Candidate"
                                    className="w-14 h-14 rounded-lg object-cover ring-2 ring-primary/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => openViewer(photoDoc ? photoDoc.url : student.photoUrl, 'Candidate Photo')}
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-2xl uppercase shadow-md">
                                    {student?.fullName?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-0.5 block">Application Profile</span>
                                <h2 className="text-2xl font-bold text-primary tracking-tight leading-none">{student?.fullName}</h2>
                                <p className="text-[10px] text-outline font-bold mt-1.5 tracking-wider uppercase">ID: {trackingId} · SUBMITTED {new Date(createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-primary/10 rounded text-[10px] font-bold text-primary uppercase tracking-[0.15em] border border-primary/20">{status}</span>
                            <button onClick={onClose} className="w-10 h-10 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-outline transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-10 space-y-10 overflow-y-auto flex-1 custom-scrollbar bg-white">
                        {/* Section Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Personal */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                     <span className="material-symbols-outlined text-primary text-xl">person</span>
                                     <h3 className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Personal Details</h3>
                                </div>
                                <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/10">
                                    <InfoRow label="Phone" value={student?.phone} />
                                    <InfoRow label="Date of Birth" value={student?.dob ? new Date(student.dob).toLocaleDateString() : null} />
                                    <InfoRow label="Aadhaar" value={student?.aadhar ? `XXXX XXXX ${student.aadhar.slice(-4)}` : null} />
                                    <InfoRow label="Address" value={student?.address} />
                                </div>
                            </section>

                            {/* Academic */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                     <span className="material-symbols-outlined text-primary text-xl">school</span>
                                     <h3 className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Academic Profile</h3>
                                </div>
                                <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/10">
                                    <InfoRow label="College" value={student?.collegeName} />
                                    <InfoRow label="Year of Study" value={student?.yearOfStudy} />
                                    <InfoRow label="CGPA" value={student?.cgpa} />
                                    <InfoRow label="Tier" value={student?.collegeCategory} />
                                    <InfoRow label="NIRF Rank" value={student?.nirfRanking ? `#${student.nirfRanking}` : 'N/A'} />
                                    <InfoRow label="Assigned ID" value={student?.rollNumber} />
                                    <InfoRow label="Pref. Location" value={application?.preferredLocation} />
                                </div>
                            </section>
                        </div>

                        {/* Statement of Purpose */}
                        {application?.sop && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                     <span className="material-symbols-outlined text-primary text-xl">article</span>
                                     <h3 className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Statement of Purpose</h3>
                                </div>
                                <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
                                    <p className="text-xs font-medium text-primary/80 leading-relaxed whitespace-pre-wrap italic">
                                        "{application.sop}"
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Full Width Sections */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                 <span className="material-symbols-outlined text-primary text-xl">description</span>
                                 <h3 className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Documentation Pool</h3>
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

                        {/* Stipend / Bank Details (Instructor Requirement) */}
                        {application.stipend && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Landmark size={14} /> Stipend & Banking Information
                                </h3>
                                <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow label="Bank Name" value={application.stipend.bankName} />
                                        <InfoRow label="Bank Branch" value={application.stipend.bankBranch} />
                                        <InfoRow label="IFSC Code" value={application.stipend.ifscCode} />
                                        <InfoRow label="PAN Number" value={application.stipend.panNumber} />
                                    </div>
                                    <div className="pt-2 border-t border-emerald-100/50">
                                        <InfoRow label="Account Number" value={application.stipend.bankAccount} />
                                    </div>
                                    <p className="text-[9px] text-emerald-600/60 font-medium uppercase tracking-tight text-center">Instructor Schema Compliant: `bank_name`, `bank_branch` included</p>
                                </div>
                            </section>
                        )}

                        {/* Actions */}
                        {status === 'SUBMITTED' && ['ADMIN', 'CE_PRTI', 'HOD'].includes(user?.role) && (
                            <div className="pt-8 mt-4 border-t border-outline-variant/10">
                                <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary text-lg">forward_to_inbox</span>
                                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Assignment Control</h4>
                                    </div>
                                    <div className="space-y-2 mb-8 uppercase">
                                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Allocate Registered Mentor</label>
                                        <div className="relative group">
                                            <select 
                                                value={mentorIdInput} 
                                                onChange={e => setMentorIdInput(e.target.value)}
                                                className="w-full bg-white border border-outline-variant/20 rounded px-4 py-3 text-xs font-bold text-primary focus:outline-primary appearance-none cursor-pointer"
                                                disabled={loadingMentors}
                                            >
                                                <option value="">{loadingMentors ? 'Syncing Mentor Registry...' : 'Select Mentor from Database'}</option>
                                                {mentors.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name} ({m.department || 'General'})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 pointer-events-none group-focus-within:text-primary transition-colors" />
                                        </div>
                                        {mentors.length === 0 && !loadingMentors && (
                                            <p className="text-[9px] text-error font-bold mt-1 tracking-tight italic">Warning: No registered mentors found in the database.</p>
                                        )}
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleForwardCommittee} className="flex-1 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 group">
                                            Forward for Review <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                        <button onClick={handleReject} className="flex-1 border border-error text-error text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:bg-error/5 transition-all flex items-center justify-center gap-2">
                                            Reject Candidate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'COMMITTEE_EVALUATION' && ['ADMIN', 'CE_PRTI', 'COMMITTEE_MEMBER', 'HOD'].includes(user?.role) && (
                            <div className="pt-8 mt-4 border-t border-outline-variant/10">
                                <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary text-lg">fact_check</span>
                                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Committee Evaluation Session</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Assessment Merit (1-100)</label>
                                            <input type="number" min="1" max="100" value={interviewScore} onChange={e => setInterviewScore(e.target.value)} placeholder="Aggregate Score" className="w-full bg-white border border-outline-variant/20 rounded px-4 py-3 text-xs font-bold text-primary focus:outline-primary" />
                                        </div>

                                        <div className="bg-white p-6 rounded-lg border border-outline-variant/10 space-y-5">
                                            <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em] mb-2 text-center">— Statutory Member Criteria —</p>
                                            
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-outline uppercase block ml-1">Member 1 (HOD)</label>
                                                    <select value={member1Score} onChange={e => setMember1Score(e.target.value)} className="w-full border border-outline-variant/20 rounded px-2 py-2 text-[10px] font-bold text-primary bg-surface-container-lowest">
                                                        <option value="">Select</option>
                                                        <option value="ACADEMIC_MERIT">Academic</option>
                                                        <option value="SOP_QUALITY">SOP</option>
                                                        <option value="DISCIPLINE_RELEVANCE">Discipline</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-outline uppercase block ml-1">Member 2 (Mentor)</label>
                                                    <select value={member2Score} onChange={e => setMember2Score(e.target.value)} className="w-full border border-outline-variant/20 rounded px-2 py-2 text-[10px] font-bold text-primary bg-surface-container-lowest">
                                                        <option value="">Select</option>
                                                        <option value="ACADEMIC_MERIT">Academic</option>
                                                        <option value="SOP_QUALITY">SOP</option>
                                                        <option value="DISCIPLINE_RELEVANCE">Discipline</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-outline uppercase block ml-1">Member 3 (PRTI)</label>
                                                    <select value={member3Score} onChange={e => setMember3Score(e.target.value)} className="w-full border border-outline-variant/20 rounded px-2 py-2 text-[10px] font-bold text-primary bg-surface-container-lowest">
                                                        <option value="">Select</option>
                                                        <option value="ACADEMIC_MERIT">Academic</option>
                                                        <option value="SOP_QUALITY">SOP</option>
                                                        <option value="DISCIPLINE_RELEVANCE">Discipline</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleCommitteeSelect} className="flex-1 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 group">
                                            Confirm Shortlist <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">check_circle</span>
                                        </button>
                                        <button onClick={handleReject} className="flex-1 border border-error text-error text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:bg-error/5 transition-all flex items-center justify-center gap-2">
                                            Reject Candidate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'CA_APPROVED' && ['ADMIN', 'CE_PRTI', 'HOD'].includes(user?.role) && (
                            <div className="pt-8 mt-4 border-t border-outline-variant/10">
                                <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 shadow-sm relative overflow-hidden">
                                     {/* Accent bar for confirmation */}
                                     <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/50"></div>
                                    
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Institutional Onboarding</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Allocated Unit/Position</label>
                                            <select
                                                className="w-full bg-white border border-outline-variant/20 rounded px-4 py-3 text-xs font-bold text-primary focus:outline-emerald-500"
                                                value={selectedRole}
                                                onChange={e => setSelectedRole(e.target.value)}
                                            >
                                                <option value="">Choose Position</option>
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

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Institutional ID / Roll Number</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. TR-2024-001"
                                                value={manualRollNumber}
                                                onChange={e => setManualRollNumber(e.target.value)}
                                                className="w-full bg-white border border-outline-variant/20 rounded px-4 py-3 text-xs font-bold text-primary placeholder:text-outline/30 focus:outline-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-outline uppercase block ml-1">Commencement Date</label>
                                            <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="w-full bg-white border border-outline-variant/20 rounded px-4 py-2 text-[11px] font-bold text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-outline uppercase block ml-1">Completion Date</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-outline-variant/20 rounded px-4 py-2 text-[11px] font-bold text-primary" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={handleHire}
                                            disabled={internship?.rolesData?.length > 0 && !selectedRole}
                                            className="flex-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                                            Authorize & Hire Candidate <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">verified_user</span>
                                        </button>
                                        <button onClick={handleReject} className="flex-1 border border-error text-error text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded hover:bg-error/5 transition-all flex items-center justify-center gap-2">
                                            Reject Candidate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {status === 'HIRED' && (
                            <div className="mt-8 pt-8 border-t border-outline-variant/10 flex flex-col gap-6">
                                <div className="flex items-center gap-4 p-6 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                    <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest leading-none">Onboarding Complete</p>
                                        <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase opacity-70">Institutional access granted</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {application.assignedRole && (
                                        <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-lg">
                                            <p className="text-[9px] uppercase font-bold tracking-[0.15em] text-outline mb-1">Target Designation</p>
                                            <p className="text-xs font-bold text-primary">{application.assignedRole}</p>
                                        </div>
                                    )}
                                    {(application.joiningDate || application.endDate) && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {application.joiningDate && (
                                                <div className="px-3 py-1 bg-white border border-emerald-200 rounded-lg shadow-sm">
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-emerald-500">Joining</p>
                                                    <p className="text-xs font-bold text-emerald-900">{new Date(application.joiningDate).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                            {application.endDate && (
                                                <div className="px-3 py-1 bg-white border border-emerald-200 rounded-lg shadow-sm">
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-emerald-500">End Date</p>
                                                    <p className="text-xs font-bold text-emerald-900">{new Date(application.endDate).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {status === 'REJECTED' && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 mt-6">
                                <div className="p-2 bg-red-100 rounded-full text-red-600">
                                    <XCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-800">Application Rejected</p>
                                    <p className="text-xs text-red-600 mt-0.5">This candidate was not selected for the role.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Viewer (fullscreen overlay with high z-index) */}
            {viewerUrl && <DocViewer url={viewerUrl} label={viewerLabel} onClose={closeViewer} />}
        </>
    );
};

export default ApplicationProfileModal;
