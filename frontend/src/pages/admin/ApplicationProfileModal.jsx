import React, { useState } from 'react';
import { X, FileText, User, GraduationCap, Award, CheckCircle, XCircle, BookOpen, Calendar, Star, RefreshCw } from 'lucide-react';

// Fullscreen PDF/image viewer panel overlay
const DocViewer = ({ url, label, onClose }) => {
    const fullUrl = url ? `http://localhost:5001/${url.replace(/\\/g, '/')}` : null;
    const isImage = fullUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(fullUrl);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-gray-900 dark:text-white font-bold text-base tracking-wide">{label}</p>
                        <p className="text-gray-500 dark:text-slate-500 text-xs font-medium uppercase tracking-widest">Document Viewer</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all flex items-center gap-2 font-bold text-sm border border-black/5 dark:border-white/5 shadow-sm">
                    <X size={18} /> Close View
                </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 sm:p-12">
                {!fullUrl ? (
                    <div className="text-center p-12 bg-gray-50 dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-inner">
                        <FileText size={64} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
                        <p className="text-gray-500 dark:text-slate-500 font-black uppercase tracking-widest text-xs">Document file not available</p>
                    </div>
                ) : isImage ? (
                    <img src={fullUrl} alt={label} className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-gray-200 dark:ring-white/10" />
                ) : (
                    <div className="w-full h-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-gray-200 dark:ring-white/10">
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
    <div className="flex justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
        <span className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">{label}</span>
        <span className="text-xs text-gray-800 dark:text-indigo-100 font-black text-right max-w-xs">{value || '—'}</span>
    </div>
);

const Badge = ({ yes, label }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
        ${yes ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-100 dark:border-white/5'}`}>
        {yes ? <CheckCircle size={10} className="stroke-[3]" /> : <XCircle size={10} className="stroke-[3]" />} {label}
    </span>
);

const DocRow = ({ doc, label, onView }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${doc ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-700'}`}>
                <FileText size={18} />
            </div>
            <span className={`text-sm font-bold ${doc ? 'text-gray-700 dark:text-indigo-100' : 'text-gray-300 dark:text-slate-700 italic'}`}>{label}</span>
        </div>
        {doc ? (
            <button onClick={() => onView(doc.url, label)}
                className="text-xs px-4 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white dark:hover:text-white font-black uppercase tracking-widest rounded-xl transition-all border border-indigo-100 dark:border-white/5 shadow-sm active:scale-95">
                View
            </button>
        ) : (
            <span className="text-[10px] text-gray-300 dark:text-slate-700 italic font-bold uppercase tracking-widest">Missing</span>
        )}
    </div>
);

const ApplicationProfileModal = ({ application, internship, onClose, onHire, onReject, onReconsider }) => {
    const [viewerUrl, setViewerUrl] = useState(null);
    const [viewerLabel, setViewerLabel] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [joiningDate, setJoiningDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!application) return null;
    const { student, documents, status, trackingId, createdAt } = application;

    const getDoc = (type) => documents?.find(d => d.type === type);
    const resumeDoc = getDoc('RESUME');
    const nocDoc = getDoc('NOC_LETTER') || getDoc('PRINCIPAL_LETTER');
    const hodDoc = getDoc('HOD_LETTER');
    const markDoc = getDoc('MARKSHEET');
    const photoDoc = getDoc('PASSPORT_PHOTO');

    const openViewer = (url, label) => { setViewerUrl(url); setViewerLabel(label); };
    const closeViewer = () => { setViewerUrl(null); setViewerLabel(''); };

    const handleHire = () => {
        if (!selectedRole && internship?.rolesData?.length > 0) {
            alert('Please assign a role to the candidate before hiring.');
            return;
        }
        if (!joiningDate || !endDate) {
            alert('Please specify both Joining and End dates before hiring.');
            return;
        }
        onHire(selectedRole, { joiningDate, endDate });
    };

    const statusColor = {
        PENDING: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
        SHORTLISTED: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
        HIRED: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
        REJECTED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
    }[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 border-gray-200 dark:border-white/5';

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md" onClick={onClose} />
                <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden z-10 border border-white/10">

                    <div className="shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            {photoDoc ? (
                                <div className="relative group">
                                    <img
                                        src={`http://localhost:5001/${photoDoc.url.replace(/\\/g, '/')}`}
                                        alt="Passport"
                                        className="w-16 h-16 rounded-[1.25rem] object-cover cursor-pointer border-2 border-indigo-100 dark:border-indigo-500/30 shadow-lg group-hover:scale-105 transition-all"
                                        onClick={() => openViewer(photoDoc.url, 'Passport Photo')}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <Star size={16} className="text-white fill-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/30">
                                    {student?.fullName?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h2 className="font-black text-gray-900 dark:text-white text-2xl leading-tight tracking-tight uppercase italic">{student?.fullName}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-[0.2em]">{trackingId}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-700" />
                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">{new Date(createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${statusColor}`}>{status}</span>
                            <button onClick={onClose} className="p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white border border-black/5 dark:border-white/5 active:scale-90">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar dark:bg-slate-900">
                        {/* Status Change / Reconsider for non-pending */}
                        {status !== 'PENDING' && onReconsider && (
                             <div className="p-5 bg-amber-50 dark:bg-amber-500/5 rounded-3xl border border-amber-100 dark:border-amber-500/20 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
                                        <RefreshCw size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest">Change Decision?</p>
                                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wide">Move candidate back to pending</p>
                                    </div>
                                </div>
                                <button onClick={onReconsider} className="px-5 py-2 bg-white dark:bg-slate-800 hover:bg-amber-600 dark:hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white dark:hover:text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all border border-amber-200 dark:border-white/5 shadow-sm active:scale-95">
                                    Reconsider
                                </button>
                             </div>
                        )}

                        <section>
                            <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <User size={14} className="stroke-[3]" /> Personal Identity
                            </h3>
                            <div className="admin-card border border-gray-100 dark:border-white/5 p-6 bg-white dark:bg-slate-800/20">
                                <InfoRow label="Mobile" value={student?.phone} />
                                <InfoRow label="Email" value={student?.email} />
                                <InfoRow label="Birth Date" value={student?.dob ? new Date(student.dob).toLocaleDateString() : null} />
                                <InfoRow label="Aadhaar" value={student?.aadhar ? `XXXX XXXX ${student.aadhar.slice(-4)}` : null} />
                                <InfoRow label="Address" value={student?.address} />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <GraduationCap size={14} className="stroke-[3]" /> Academic Background
                            </h3>
                            <div className="admin-card border border-gray-100 dark:border-white/5 p-6 bg-white dark:bg-slate-800/20">
                                <InfoRow label="College" value={student?.collegeName} />
                                <InfoRow label="System Rank" value={student?.nirfRanking ? `NIRF #${student.nirfRanking}` : 'Unranked'} />
                                <InfoRow label="Category" value={student?.collegeCategory} />
                                <InfoRow label="CGPA / Score" value={student?.cgpa} />
                                <InfoRow label="Department" value={student ? `${student.degree} – ${student.branch}` : null} />
                                <InfoRow label="Year/Semester" value={student?.yearOfStudy} />
                                <InfoRow label="APTRANSCO ID" value={student?.rollNumber} />
                                <InfoRow label="College Roll" value={student?.collegeRollNumber} />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Award size={14} className="stroke-[3]" /> Skills & Projects
                            </h3>
                            <div className="flex flex-wrap gap-2.5 mb-5">
                                <Badge yes={student?.hasExperience} label="Experience" />
                                <Badge yes={student?.hasProjects} label="Projects" />
                                <Badge yes={student?.hasCertifications} label="Certified" />
                            </div>
                            <div className="space-y-3">
                                {student?.skills && (
                                    <div className="p-5 bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10 rounded-2xl">
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Technical Skills & Tooling</p>
                                        <p className="text-sm text-gray-700 dark:text-slate-300 font-medium leading-relaxed">{student.skills}</p>
                                    </div>
                                )}
                                {student?.experienceDesc && (
                                    <div className="p-5 bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 rounded-2xl">
                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Work Experience</p>
                                        <p className="text-sm text-gray-700 dark:text-slate-300 font-medium leading-relaxed">{student.experienceDesc}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <BookOpen size={14} className="stroke-[3]" /> Verification Documents
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <DocRow doc={resumeDoc} label="Professional Resume" onView={openViewer} />
                                <DocRow doc={nocDoc} label="NOC / Principal Letter" onView={openViewer} />
                                <DocRow doc={hodDoc} label="HOD Endorsement" onView={openViewer} />
                                <DocRow doc={markDoc} label="Academic Marksheet" onView={openViewer} />
                            </div>
                        </section>

                        {/* Workflow Actions */}
                        {status === 'PENDING' && (
                            <div className="pt-10 mt-10 border-t border-gray-100 dark:border-white/5 space-y-6">
                                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] text-center italic">— Review Workflow —</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Assign Functional Role</label>
                                        <select
                                            className="admin-input font-black uppercase text-xs tracking-wider"
                                            value={selectedRole}
                                            onChange={e => setSelectedRole(e.target.value)}
                                        >
                                            <option value="">-- NO ROLE --</option>
                                                {internship.rolesData.map(r => {
                                                    const roleHired = application.roleHiredStats?.[r.name] || 0;
                                                    const isFull = roleHired >= (r.openings || 0);
                                                    return (
                                                        <option key={r.name} value={r.name} disabled={isFull}>
                                                            {r.name} ({roleHired} / {r.openings || 0} filled) {isFull ? ' - FULL' : ''}
                                                        </option>
                                                    );
                                                })}
                                            {!internship?.rolesData?.length && internship?.roles?.split(',').map(r => (
                                                <option key={r.trim()} value={r.trim()}>{r.trim()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Join Date</label>
                                            <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="admin-input text-xs font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="admin-input text-xs font-bold" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={handleHire}
                                        className="flex-1 flex flex-col items-center justify-center gap-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] group">
                                        <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hire Candidate</span>
                                    </button>
                                    <button onClick={onReject}
                                        className="flex-1 flex flex-col items-center justify-center gap-1 py-5 bg-red-600 hover:bg-red-500 text-white rounded-[1.5rem] transition-all shadow-xl shadow-red-600/20 active:scale-[0.98] group">
                                        <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reject Profile</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {status === 'HIRED' && (
                            <div className="p-8 bg-emerald-50 dark:bg-emerald-500/5 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/10 mt-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <CheckCircle size={80} className="text-emerald-600" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-2xl font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight italic">Mission Successful</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500/70 font-bold uppercase tracking-widest mt-1">Candidate has been integrated into the program.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-white/5 shadow-sm">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-1">Assigned Role</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-indigo-100">{application.assignedRole || 'General Intern'}</p>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-white/5 shadow-sm">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-1">Start Date</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-indigo-100">{application.joiningDate ? new Date(application.joiningDate).toLocaleDateString() : '—'}</p>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-white/5 shadow-sm">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-1">Duration End</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-indigo-100">{application.endDate ? new Date(application.endDate).toLocaleDateString() : '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'REJECTED' && (
                            <div className="p-8 bg-red-50 dark:bg-red-500/5 rounded-[2rem] border border-red-100 dark:border-red-500/10 mt-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <XCircle size={80} className="text-red-600" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-2xl font-black text-red-900 dark:text-red-400 uppercase tracking-tight italic">Protocol Terminated</p>
                                    <p className="text-xs text-red-600 dark:text-red-500/70 font-bold uppercase tracking-widest mt-1">This candidate did not meet the requirement threshold.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {viewerUrl && <DocViewer url={viewerUrl} label={viewerLabel} onClose={closeViewer} />}
        </>
    );
};

export default ApplicationProfileModal;
