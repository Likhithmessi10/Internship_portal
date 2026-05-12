import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api, { MEDIA_URL } from '../../utils/api';
import { Upload, FileType, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck, FileText, Check, MapPin, AlignLeft, X, Briefcase, BookOpen, Award, Users, Calendar, ChevronRight, Download, ClipboardList } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const InternshipApplication = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [internship, setInternship] = useState(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showJobDescription, setShowJobDescription] = useState(false);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialRole = queryParams.get('role') || '';
    const groupId = queryParams.get('groupId') || '';
    const fieldId = queryParams.get('fieldId') || '';
    const initialPsId = queryParams.get('problemStatementId') || '';

    const [assignedRole, setAssignedRole] = useState(initialRole);
    const [sop, setSop] = useState('');
    const [preferredLocation, setPreferredLocation] = useState('');
    const [questionAnswers, setQuestionAnswers] = useState({});
    const [selectedField, setSelectedField] = useState(null);
    const [problemStatementId, setProblemStatementId] = useState(initialPsId);

    const [files, setFiles] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const intRes = await api.get(`/internships/${id}`);
                setInternship(intRes.data.data);

                try {
                    const profRes = await api.get('/students/profile');
                    if (profRes.data.data) {
                        setProfileComplete(true);
                        const alreadyApplied = profRes.data.data.applications.some(
                            a => a.internshipId === id
                        );
                        if (alreadyApplied) {
                            setError('You have already applied for this internship.');
                        }
                    }
                } catch {
                    setProfileComplete(false);
                }
            } catch {
                setError('Internship not found or server error.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, initialRole]);

    useEffect(() => {
        if (internship && fieldId) {
            let field = null;
            if (groupId) {
                const group = internship.departmentGroups?.find(g => g.id === groupId);
                field = group?.fields?.find(f => f.id === fieldId) || null;
            } else {
                field = internship.fields?.find(f => f.id === fieldId) || null;
            }
            setSelectedField(field);
        }
    }, [internship, fieldId, groupId]);

    // Derive required docs: only what PRTI defined — no forced NOC/UNDERTAKING at apply time
    const getRequiredDocs = () => {
        const base = internship?.requiredDocuments;
        if (Array.isArray(base) && base.length > 0) return base;
        return [{ id: 'RESUME', label: 'Resume / CV', type: 'PDF', mandatory: true }];
    };

    // Active department group
    const activeGroup = groupId ? internship?.departmentGroups?.find(g => g.id === groupId) : null;

    // Problem statements available for this group
    const availableProblemStatements = activeGroup?.problemStatements || [];

    const handleFileChange = (e, doc) => {
        const file = e.target.files[0];
        if (!file) return;
        const isPhoto = doc.type === 'IMAGE';
        if (!isPhoto && file.type !== 'application/pdf') {
            setError(`Only PDF files are allowed for ${doc.label}.`);
            return;
        }
        if (isPhoto && !file.type.startsWith('image/')) {
            setError(`Only image files are allowed for ${doc.label}.`);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError(`File ${file.name} is too large. Max size 5MB.`);
            return;
        }
        setError('');
        setFiles(prev => ({ ...prev, [doc.id]: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const reqDocs = getRequiredDocs();
        const missingDocs = reqDocs.filter(doc => !files[doc.id]);

        if (missingDocs.length > 0) {
            setError(`Missing required documents: ${missingDocs.map(d => d.label).join(', ')}`);
            return;
        }

        if (!files['RESUME']) {
            setError('Resume is required.');
            return;
        }

        // Require problem statement selection for GROUP internships with problem statements
        if (groupId && availableProblemStatements.length > 0 && !problemStatementId) {
            setError('Please select a problem statement to apply for.');
            return;
        }

        const formData = new FormData();
        reqDocs.forEach(doc => {
            if (files[doc.id]) formData.append(doc.id, files[doc.id]);
        });

        formData.append('assignedRole', assignedRole);
        formData.append('sop', sop);
        if (preferredLocation) formData.append('preferredLocation', preferredLocation);
        formData.append('questionAnswers', JSON.stringify(questionAnswers));
        if (groupId) formData.append('departmentGroupId', groupId);
        if (fieldId) formData.append('fieldId', fieldId);
        if (problemStatementId) formData.append('problemStatementId', problemStatementId);

        setSubmitting(true);
        setError('');

        try {
            await api.post(`/internships/${id}/apply`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess('Application submitted successfully! Redirecting...');
            setTimeout(() => navigate('/student/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit application.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!internship && !loading) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Internship Not Found</h2>
                <p className="text-gray-500 mt-2">The internship you are looking for does not exist or has been closed.</p>
                <button onClick={() => navigate('/student/internships')} className="mt-6 text-indigo-600 font-bold hover:underline">
                    Back to Listings
                </button>
            </div>
        );
    }

    const FileUploadInput = ({ doc }) => {
        const state = files[doc.id];
        const hasTemplates = doc.templates && doc.templates.length > 0;

        return (
            <div className={`relative group rounded-2xl border transition-all ${state ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white'} overflow-hidden`}>
                <input
                    type="file"
                    id={doc.id}
                    accept={doc.type === 'IMAGE' ? 'image/*' : 'application/pdf'}
                    className="hidden"
                    onChange={(e) => handleFileChange(e, doc)}
                />
                <div className="flex items-center gap-3 p-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${state ? 'bg-emerald-100' : 'bg-indigo-50'} transition-colors`}>
                        {state ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div className="flex-grow min-w-0">
                        <h4 className={`font-bold text-sm ${state ? 'text-emerald-900' : 'text-gray-900'}`}>
                            {doc.label} {doc.mandatory && <span className="text-red-500 ml-0.5 font-black text-[10px]">*</span>}
                        </h4>
                        <p className={`text-xs font-medium mt-0.5 truncate ${state ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {state
                                ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 shrink-0" /> {state.name}</span>
                                : `${doc.type === 'IMAGE' ? 'JPG / PNG' : 'PDF'} · Max 5MB`}
                        </p>
                    </div>
                    <label
                        htmlFor={doc.id}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-all
                        ${state
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}
                    >
                        {state ? 'Change' : 'Upload'}
                    </label>
                </div>
                {hasTemplates && (
                    <div className="border-t border-dashed border-gray-200 bg-gray-50/80 px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Download className="w-3 h-3 text-indigo-500" />
                            Download template, fill, then upload
                        </p>
                        <div className="flex gap-2">
                            {doc.templates.map((template, idx) => (
                                <a
                                    key={idx}
                                    href={`${MEDIA_URL}${template.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 text-indigo-700 rounded-lg text-[9px] font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-95"
                                >
                                    <Download className="w-2.5 h-2.5" /> {template.label}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const reqDocs = getRequiredDocs();
    const isNonStipend = internship.internshipType === 'NON_STIPEND' ||
        (activeGroup?.internshipType === 'NON_STIPEND');

    return (
        <div className="max-w-4xl mx-auto py-6 relative">
            <button
                onClick={() => navigate('/student/internships')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Internships
            </button>

            <div className="card shadow-xl shadow-indigo-100/50 border-0 ring-1 ring-gray-100 overflow-hidden relative p-0">

                {/* Header */}
                <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-6 sm:p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider mb-4">
                            <ShieldCheck className="w-4 h-4" /> Official Application Portal
                        </div>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black font-rajdhani mb-1 leading-tight">
                                    {internship.title}
                                </h1>
                                <p className="text-indigo-200 font-medium text-sm">
                                    {(activeGroup?.department) || internship.department} Department • ID: {internship.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowJobDescription(true)}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2"
                            >
                                <FileText size={14} /> JD
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">

                    {!profileComplete ? (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <AlertCircle className="text-amber-500 w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Profile Action Required</h2>
                            <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
                                You cannot submit applications until your base academic profile is constructed and verified.
                            </p>
                            <button onClick={() => navigate('/student/profile/edit')} className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg active:scale-95 inline-flex items-center gap-2">
                                Complete Profile Now <ArrowLeft className="w-5 h-5 rotate-180" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl mb-8 text-sm font-bold flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 shrink-0" /> {success}
                                </div>
                            )}

                            {/* Step 1 — Documents */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Supporting Documents</h3>
                                        <p className="text-xs text-gray-400 font-medium">Upload required files · Max 5MB each</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {reqDocs.map(doc => <FileUploadInput key={doc.id} doc={doc} />)}
                                </div>
                            </div>

                            {/* Step 2 — Application Specifics */}
                            <div className="mb-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Application Specifics</h3>
                                        <p className="text-xs text-gray-400 font-medium">Tell us why you're a great fit for this role</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8">

                                    {/* Problem Statement Selector — only for GROUP internships with problem statements */}
                                    {groupId && availableProblemStatements.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">
                                                <ClipboardList className="w-4 h-4 text-indigo-500" /> Problem Statement <span className="text-red-500 font-black text-[10px] ml-0.5">*</span>
                                            </label>
                                            <select
                                                required
                                                value={problemStatementId}
                                                onChange={e => {
                                                    setProblemStatementId(e.target.value);
                                                    // Pre-fill role name from selected PS
                                                    const ps = availableProblemStatements.find(p => p.id === e.target.value);
                                                    if (ps) setAssignedRole(ps.title);
                                                }}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                                            >
                                                <option value="">-- Select a Problem Statement --</option>
                                                {availableProblemStatements.map(ps => (
                                                    <option key={ps.id} value={ps.id}>
                                                        PS-{ps.problemStatementNumber}: {ps.title} ({ps.vacancies} seat{ps.vacancies !== 1 ? 's' : ''})
                                                    </option>
                                                ))}
                                            </select>
                                            {/* Show selected PS description */}
                                            {problemStatementId && (() => {
                                                const ps = availableProblemStatements.find(p => p.id === problemStatementId);
                                                return ps?.description ? (
                                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800 font-medium">
                                                        {ps.description}
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    )}

                                    {/* Role field — read-only */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">
                                            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Applying for Role
                                        </label>
                                        <input
                                            type="text"
                                            value={assignedRole}
                                            readOnly
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 shadow-sm focus:ring-0 cursor-default"
                                        />
                                        <p className="text-[10px] text-gray-400 font-bold ml-1 uppercase">
                                            {availableProblemStatements.length > 0
                                                ? 'Role is set from your problem statement selection above.'
                                                : 'Position cannot be changed. Return to listings to select a different role.'}
                                        </p>
                                    </div>

                                    {/* Location */}
                                    {isNonStipend ? (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">
                                                <MapPin className="w-4 h-4 text-indigo-500" /> Preferred Location
                                            </label>
                                            <select
                                                required
                                                value={preferredLocation}
                                                onChange={e => setPreferredLocation(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                                            >
                                                <option value="">-- Select Preferred Location --</option>
                                                {(() => {
                                                    // For GROUP NON_STIPEND with problem statement, use PS locations
                                                    const ps = availableProblemStatements.find(p => p.id === problemStatementId);
                                                    const locs = ps?.locations || selectedField?.locations || [];
                                                    return locs.map(loc => (
                                                        <option key={loc} value={loc}>{loc}</option>
                                                    ));
                                                })()}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">
                                                <MapPin className="w-4 h-4 text-indigo-500" /> Preferred Deployment Location (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Vijayawada, Guntur, or Remote"
                                                value={preferredLocation}
                                                onChange={e => setPreferredLocation(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium placeholder:text-gray-300"
                                            />
                                        </div>
                                    )}

                                    {/* SOP */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                <AlignLeft className="w-4 h-4 text-indigo-500" /> Statement of Purpose (SOP)
                                            </label>
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${sop.length > 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {sop.length} / 500 characters
                                            </span>
                                        </div>
                                        <textarea
                                            required
                                            placeholder="Explain your interest, skills, and what you hope to achieve during this internship..."
                                            rows="5"
                                            maxLength="500"
                                            value={sop}
                                            onChange={e => setSop(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-gray-300 min-h-[140px]"
                                        />
                                        {sop.length < 50 && (
                                            <p className="text-[10px] text-amber-600 font-bold ml-1 uppercase flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Please provide at least 50 characters for a stronger application.
                                            </p>
                                        )}
                                    </div>

                                    {/* Custom Questionnaire */}
                                    {(() => {
                                        const questions = (activeGroup ? activeGroup.customQuestions : internship.customQuestions) || [];
                                        if (questions.length === 0) return null;
                                        return (
                                            <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                        <Award className="w-4 h-4 text-indigo-500" /> Application Questionnaire
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Please provide detailed answers to help our committee evaluate your application.</p>
                                                </div>
                                                <div className="space-y-4">
                                                    {questions.map((q, idx) => (
                                                        <div key={idx} className="space-y-3 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Q: {q}</label>
                                                            <textarea
                                                                required
                                                                placeholder="Your answer here..."
                                                                rows="3"
                                                                value={questionAnswers[idx] || ''}
                                                                onChange={e => setQuestionAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-end items-center">
                                <button type="button" onClick={() => navigate('/student/internships')} className="text-gray-500 font-bold hover:text-gray-900 transition-colors order-2 sm:order-1 px-4">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-lg order-1 sm:order-2
                                        ${submitting || error === 'You have already applied for this internship.'
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-xl'
                                        }`}
                                    disabled={submitting || error === 'You have already applied for this internship.'}
                                >
                                    {submitting
                                        ? <><div className="animate-spin w-5 h-5 border-2 border-gray-500 border-t-white rounded-full"></div> Processing...</>
                                        : <><Upload className="w-5 h-5" /> Submit Final Application</>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Job Description Modal */}
            {showJobDescription && internship && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowJobDescription(false)} />
                    <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 z-10 border border-white/20">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 lg:p-10 text-white shrink-0 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black font-rajdhani mb-2">{internship.title}</h2>
                                <p className="text-indigo-200 font-medium flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Briefcase size={16} /> {activeGroup?.department || internship.department}</span>
                                    <span className="flex items-center gap-1"><MapPin size={16} /> {internship.location || 'APTRANSCO'}</span>
                                    <span className="flex items-center gap-1"><Calendar size={16} /> {internship.duration}</span>
                                </p>
                            </div>
                            <button onClick={() => setShowJobDescription(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 lg:p-12 overflow-y-auto flex-1 space-y-10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><AlignLeft size={18} className="text-indigo-600" /></div>
                                    Description
                                </h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{internship.description}</p>
                            </div>

                            {/* Problem statements in JD modal */}
                            {availableProblemStatements.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><ClipboardList size={18} className="text-indigo-600" /></div>
                                        Problem Statements
                                    </h3>
                                    <div className="space-y-3">
                                        {availableProblemStatements.map(ps => (
                                            <div key={ps.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-black text-gray-900">PS-{ps.problemStatementNumber}: {ps.title}</p>
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{ps.vacancies} seat{ps.vacancies !== 1 ? 's' : ''}</span>
                                                </div>
                                                {ps.description && <p className="text-xs text-gray-500 font-medium">{ps.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {internship.requirements && (
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><CheckCircle size={18} className="text-indigo-600" /></div>
                                        Requirements
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{internship.requirements}</p>
                                </div>
                            )}

                            {internship.expectations && (
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><Award size={18} className="text-indigo-600" /></div>
                                        Expectations
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{internship.expectations}</p>
                                </div>
                            )}

                            {/* Required Documents — only PRTI-defined, no hardcoded NOC/UNDERTAKING */}
                            <div>
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><FileText size={18} className="text-indigo-600" /></div>
                                    Documents Required at Application
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {getRequiredDocs().map((doc, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                <FileType size={20} className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{doc.label}</p>
                                                <p className="text-xs text-gray-500 font-medium">{doc.type === 'IMAGE' ? 'JPG/PNG' : 'PDF'} (Max 5MB)</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-3 text-xs text-amber-600 font-bold flex items-center gap-1">
                                    <AlertCircle size={12} /> NOC, Bond & Undertaking are submitted after selection, not at application stage.
                                </p>
                            </div>

                            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                                <h3 className="text-base font-black text-indigo-900 mb-4">Additional Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Openings</p>
                                        <p className="text-lg font-black text-indigo-900">{internship.openingsCount} positions</p>
                                    </div>
                                    {internship.applicationDeadline && (
                                        <div>
                                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Deadline</p>
                                            <p className="text-lg font-black text-indigo-900">{new Date(internship.applicationDeadline).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                            <p className="text-sm text-gray-500 font-medium">Review all details before submitting your application</p>
                            <button
                                onClick={() => setShowJobDescription(false)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                            >
                                <Check size={18} /> I Understand, Continue
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default InternshipApplication;
