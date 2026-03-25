import React, { useState } from 'react';
import { X, FileText, User, GraduationCap, Award, CheckCircle, XCircle, BookOpen, Sparkles, Send, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <span className="text-xs text-gray-800 font-semibold text-right max-w-xs">{value || '—'}</span>
    </div>
);

const Badge = ({ yes, label }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
        ${yes ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
        {yes ? <CheckCircle size={10} /> : <XCircle size={10} />} {label}
    </span>
);

const DocRow = ({ doc, label, onView }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-2.5">
            <FileText size={15} className={doc ? 'text-indigo-500' : 'text-gray-300'} />
            <span className={`text-sm font-semibold ${doc ? 'text-gray-700' : 'text-gray-300'}`}>{label}</span>
        </div>
        {doc ? (
            <button onClick={() => onView(doc.url, label)}
                className="text-xs px-3.5 py-1.5 bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold rounded-lg transition-colors">
                View Fullscreen
            </button>
        ) : (
            <span className="text-xs text-gray-300 italic px-2">Not uploaded</span>
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
    const [interviewScore, setInterviewScore] = useState('');

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
        updateStatus('CA_APPROVED', { score: interviewScore, committeeId: user.id });
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
            {/* Main modal overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden z-10">

                    {/* Header */}
                    <div className="shrink-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            {photoDoc || student?.photoUrl ? (
                                <img
                                    src={getMediaUrl(photoDoc ? photoDoc.url : student.photoUrl)}
                                    alt="Passport"
                                    className="w-12 h-12 rounded-xl object-cover cursor-pointer border-2 border-indigo-100 shadow-sm transition-transform hover:scale-105"
                                    onClick={() => openViewer(photoDoc ? photoDoc.url : student.photoUrl, 'Passport Photo')}
                                    title="Click to view full photo"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                                    {student?.fullName?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-black text-gray-900 text-lg leading-tight">{student?.fullName}</p>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">{trackingId} · Applied {new Date(createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-black ring-1 ring-inset ring-black/5 ${statusColor}`}>{status}</span>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Personal */}
                        <section>
                            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <User size={14} /> Personal Details
                            </h3>
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <InfoRow label="Phone" value={student?.phone} />
                                <InfoRow label="Date of Birth" value={student?.dob ? new Date(student.dob).toLocaleDateString() : null} />
                                <InfoRow label="Aadhaar" value={student?.aadhar ? `XXXX XXXX ${student.aadhar.slice(-4)}` : null} />
                                <InfoRow label="Address" value={student?.address} />
                            </div>
                        </section>

                        {/* Academic */}
                        <section>
                            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <GraduationCap size={14} /> Academic Details
                            </h3>
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <InfoRow label="College" value={student?.collegeName} />
                                <InfoRow label="Degree & Branch" value={student ? `${student.degree} – ${student.branch}` : null} />
                                <InfoRow label="Year of Study" value={student?.yearOfStudy} />
                                <InfoRow label="CGPA" value={student?.cgpa} />
                                <InfoRow label="Tier" value={student?.collegeCategory} />
                                {student?.nirfRanking && <InfoRow label="NIRF Rank" value={`#${student.nirfRanking}`} />}
                                <InfoRow label="Allocated Roll Number" value={student?.rollNumber} />
                                <InfoRow label="College Roll Number" value={student?.collegeRollNumber} />
                            </div>
                        </section>

                        {/* Highlights */}
                        <section>
                            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Award size={14} /> Profile Highlights
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge yes={student?.hasExperience} label="Experience" />
                                <Badge yes={student?.hasProjects} label="Projects" />
                                <Badge yes={student?.hasCertifications} label="Certifications" />
                            </div>
                            <div className="space-y-2">
                                {student?.skills && <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-sm text-gray-700 leading-relaxed"><strong className="text-indigo-900 block mb-1 text-xs">Skills</strong> {student.skills}</div>}
                                {student?.experienceDesc && <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-sm text-gray-700 leading-relaxed"><strong className="text-indigo-900 block mb-1 text-xs">Experience</strong> {student.experienceDesc}</div>}
                                {student?.projectsDesc && <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-sm text-gray-700 leading-relaxed"><strong className="text-indigo-900 block mb-1 text-xs">Projects</strong> {student.projectsDesc}</div>}
                            </div>
                        </section>

                        {/* Documents */}
                        <section>
                            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <BookOpen size={14} /> Documents Uploaded
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {internship?.requiredDocuments && internship.requiredDocuments.length > 0 ? (
                                    internship.requiredDocuments.map(reqDoc => {
                                        let doc = getDoc(reqDoc.id, reqDoc.label);
                                        // Legacy handling for NOC/Principal letter IDs
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

                        {/* Actions */}
                        {status === 'SUBMITTED' && ['ADMIN', 'CE_PRTI', 'HOD'].includes(user?.role) && (
                            <div className="pt-4 mt-8 border-t border-gray-100 flex flex-col gap-4">
                                <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 shadow-inner">
                                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <Send size={14} className="text-indigo-500" /> HOD Action: Forward to Committee
                                    </h4>
                                    <div className="space-y-1.5 mb-6">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Mentor (ID or Name)</label>
                                        <input type="text" value={mentorIdInput} onChange={e => setMentorIdInput(e.target.value)} placeholder="e.g. MENTOR-45 or John Doe" className="admin-input bg-white w-full border-indigo-100 font-bold text-indigo-900 text-xs py-3.5" />
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleForwardCommittee} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">
                                            <Send size={16} /> Forward Application
                                        </button>
                                        <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'COMMITTEE_EVALUATION' && ['ADMIN', 'CE_PRTI', 'COMMITTEE_MEMBER'].includes(user?.role) && (
                            <div className="pt-4 mt-8 border-t border-gray-100 flex flex-col gap-4">
                                <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 shadow-inner">
                                    <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <Users size={14} className="text-purple-500" /> Committee Action: Interview & Select
                                    </h4>
                                    <div className="space-y-1.5 mb-6">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Interview Score (1-100)</label>
                                        <input type="number" min="1" max="100" value={interviewScore} onChange={e => setInterviewScore(e.target.value)} placeholder="Enter Score" className="admin-input bg-white w-full border-purple-100 font-bold text-purple-900 text-xs py-3.5" />
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleCommitteeSelect} className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">
                                            <CheckCircle size={16} /> Shortlist 
                                        </button>
                                        <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'CA_APPROVED' && ['ADMIN', 'CE_PRTI'].includes(user?.role) && (
                            <div className="pt-4 mt-8 border-t border-gray-100 flex flex-col gap-4">
                                <div className="flex flex-col gap-5 bg-emerald-50/40 p-6 rounded-[2rem] border border-emerald-100/50 shadow-inner">
                                    <div className="text-center space-y-1 mb-2">
                                        <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Sparkles size={14} className="text-amber-500" /> Final Step: Hiring Confirmation
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Assign a position and internal ID to complete selection</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Designated Position</label>
                                            <select
                                                className="admin-input bg-white border-emerald-100 font-bold text-emerald-900 text-xs py-3.5"
                                                value={selectedRole}
                                                onChange={e => setSelectedRole(e.target.value)}
                                            >
                                                <option value="">-- Choose Position --</option>
                                                {!internship?.rolesData?.length && internship?.roles?.split(',')?.map(r => (
                                                    <option key={r.trim()} value={r.trim()}>{r.trim()}</option>
                                                ))}
                                                {internship?.rolesData?.map(r => {
                                                    const roleHired = application.roleHiredStats?.[r.name] || 0;
                                                    const isFull = roleHired >= (r.openings || 0);
                                                    return (
                                                        <option key={r.name} value={r.name} disabled={isFull}>
                                                            {r.name} ({roleHired} / {r.openings || 0} Filled) {isFull ? ' - [FULL]' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned ID Number</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. APT-26-001"
                                                value={manualRollNumber}
                                                onChange={e => setManualRollNumber(e.target.value)}
                                                className="admin-input bg-white border-emerald-100 font-bold text-emerald-900 placeholder:text-slate-300 text-xs py-3.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={joiningDate}
                                                onChange={e => setJoiningDate(e.target.value)}
                                                className="admin-input bg-white border-emerald-100 font-bold text-emerald-900 text-xs py-3.5"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                                className="admin-input bg-white border-emerald-100 font-bold text-emerald-900 text-xs py-3.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleHire}
                                        disabled={internship?.rolesData?.length > 0 && !selectedRole}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                                        <CheckCircle size={18} /> Accept & Hire
                                    </button>
                                    <button onClick={handleReject}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]">
                                        <XCircle size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        )}
                        {status === 'HIRED' && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mt-6">
                                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                    <CheckCircle size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-emerald-800">Candidate Hired</p>
                                    <p className="text-xs text-emerald-600 mt-0.5">This application was accepted successfully.</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {application.assignedRole && (
                                        <div className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg shadow-sm">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-0.5">Assigned Role</p>
                                            <p className="text-sm font-bold text-emerald-900">{application.assignedRole}</p>
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
