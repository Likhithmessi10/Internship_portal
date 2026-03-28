import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { Upload, FileType, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck, FileText, Check, MapPin, AlignLeft, X, Briefcase, BookOpen, Award, Users, Calendar, ChevronRight } from 'lucide-react';
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

    // New Fields
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialRole = queryParams.get('role') || '';

    const [assignedRole, setAssignedRole] = useState(initialRole);
    const [sop, setSop] = useState('');
    const [preferredLocation, setPreferredLocation] = useState('');

    // File States (Dynamic)
    const [files, setFiles] = useState({});


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Internship
                const intRes = await api.get(`/internships/${id}`);
                setInternship(intRes.data.data);

                // Fetch Profile Status
                try {
                    const profRes = await api.get('/students/profile');
                    if (profRes.data.data) {
                        setProfileComplete(true);

                        // Check if already applied
                        const alreadyApplied = profRes.data.data.applications.some(a => a.internshipId === id);
                        if (alreadyApplied) {
                            setError('You have already applied to this internship.');
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
    }, [id]);

    const handleFileChange = (e, doc) => {
        const file = e.target.files[0];
        if (file) {
            // Validate based on type (IMAGE or PDF)
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        // Append all required files that were selected
        const reqDocs = internship.requiredDocuments || [{ id: 'RESUME', label: 'Resume / CV', type: 'PDF' }];
        reqDocs.forEach(doc => {
            const file = files[doc.id];
            if (file) {
                formData.append(doc.id, file); // Use the doc ID as the field name
            }
        });

        // Append new text fields
        formData.append('assignedRole', assignedRole);
        formData.append('sop', sop);
        if (preferredLocation) {
            formData.append('preferredLocation', preferredLocation);
        }

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

        return (
            <div className="relative group">
                <input
                    type="file"
                    id={doc.id}
                    accept={doc.type === 'IMAGE' ? "image/*" : "application/pdf"}
                    className="hidden"
                    onChange={(e) => handleFileChange(e, doc)}
                />
                <label
                    htmlFor={doc.id}
                    className={`block w-full p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4
                    ${state
                            ? 'border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50'
                            : 'border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                        ${state ? 'bg-emerald-100' : 'bg-indigo-100 group-hover:bg-indigo-200'} transition-colors`}>
                        {state ? <Check className="w-6 h-6 text-emerald-600" /> : <FileText className="w-6 h-6 text-indigo-600" />}
                    </div>
                    <div className="flex-grow">
                        <h4 className={`font-bold text-sm sm:text-base ${state ? 'text-emerald-900' : 'text-gray-900'}`}>
                            {doc.label}
                        </h4>
                        <p className={`text-xs sm:text-sm font-medium mt-1 ${state ? 'text-emerald-700/70' : 'text-gray-500'}`}>
                            {state ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {state.name}</span> : `Upload ${doc.type === 'IMAGE' ? 'JPG/PNG' : 'PDF'}`}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 mt-2 sm:mt-0
                        ${state ? 'bg-emerald-200/50 text-emerald-800' : 'bg-white border border-gray-200 text-gray-600 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600'}`}>
                        {state ? 'Change' : 'Browse'}
                    </div>
                </label>
            </div>
        );
    };

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
                <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-8 sm:p-10 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
                            <ShieldCheck className="w-4 h-4" /> Official Application Portal
                        </div>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black font-rajdhani mb-2 leading-tight">
                                    {internship.title}
                                </h1>
                                <p className="text-indigo-200 font-medium text-lg">
                                    {internship.department} Department • ID: {internship.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowJobDescription(true)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FileText size={16} /> View Job Description
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 sm:p-10">

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
                                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-8 text-sm font-bold flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl mb-8 text-sm font-bold flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 shrink-0" /> {success}
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Supporting Documents</h3>
                                <p className="text-sm text-gray-500 font-medium mb-6">Upload required authorization letters in PDF format (Max 5MB each).</p>

                                <div className="space-y-4">
                                    {(internship.requiredDocuments || [{ id: 'RESUME', label: 'Resume / CV', type: 'PDF' }]).map(doc => (
                                        <FileUploadInput key={doc.id} doc={doc} />
                                    ))}
                                </div>
                            </div>

                            <div className="mb-10 space-y-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Application Specifics</h3>
                                <p className="text-sm text-gray-500 font-medium mb-6">Tell us why you're a great fit for this specific role.</p>

                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">
                                            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Applying for Role
                                        </label>
                                        <input
                                            type="text"
                                            value={assignedRole}
                                            readOnly
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-bold text-gray-900 shadow-sm focus:ring-0 cursor-default"
                                        />
                                        <p className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Position cannot be changed. Return to listings to select a different role.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">
                                            <MapPin className="w-4 h-4 text-indigo-500" /> Preferred Deployment Location (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Vijayawada, Guntur, or Remote"
                                            value={preferredLocation}
                                            onChange={e => setPreferredLocation(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-sm font-bold text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium placeholder:text-gray-300"
                                        />
                                    </div>

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
                                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-gray-300 min-h-[160px]"
                                        />
                                        {sop.length < 50 && (
                                            <p className="text-[10px] text-amber-600 font-bold ml-1 uppercase flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Please provide at least 50 characters for a stronger application.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-end items-center">
                                <button type="button" onClick={() => navigate('/student/internships')} className="text-gray-500 font-bold hover:text-gray-900 transition-colors order-2 sm:order-1 px-4">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-lg order-1 sm:order-2
                                        ${submitting || error === 'You have already applied to this internship.'
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-xl'
                                        }`}
                                    disabled={submitting || error === 'You have already applied to this internship.'}
                                >
                                    {submitting ? (
                                        <><div className="animate-spin w-5 h-5 border-2 border-gray-500 border-t-white rounded-full"></div> Processing...</>
                                    ) : (
                                        <><Upload className="w-5 h-5" /> Submit Final Application</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Job Description Modal */}
            {showJobDescription && internship && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowJobDescription(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black font-rajdhani mb-2">{internship.title}</h2>
                                    <p className="text-indigo-200 font-medium flex items-center gap-4">
                                        <span className="flex items-center gap-1"><Briefcase size={16} /> {internship.department}</span>
                                        <span className="flex items-center gap-1"><MapPin size={16} /> {internship.location || 'APTRANSCO'}</span>
                                        <span className="flex items-center gap-1"><Calendar size={16} /> {internship.duration}</span>
                                    </p>
                                </div>
                                <button onClick={() => setShowJobDescription(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto max-h-[60vh] space-y-8">
                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <AlignLeft size={18} className="text-indigo-600" />
                                    </div>
                                    Description
                                </h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{internship.description}</p>
                            </div>

                            {/* Roles */}
                            {internship.roles && (
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Users size={18} className="text-indigo-600" />
                                        </div>
                                        Roles Available
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">{internship.roles}</p>
                                </div>
                            )}

                            {/* Requirements */}
                            {internship.requirements && (
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle size={18} className="text-indigo-600" />
                                        </div>
                                        Requirements
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{internship.requirements}</p>
                                </div>
                            )}

                            {/* Expectations */}
                            {internship.expectations && (
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Award size={18} className="text-indigo-600" />
                                        </div>
                                        Expectations
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{internship.expectations}</p>
                                </div>
                            )}

                            {/* Required Documents */}
                            <div>
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <FileText size={18} className="text-indigo-600" />
                                    </div>
                                    Required Documents
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(internship.requiredDocuments || []).map((doc, idx) => (
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
                            </div>

                            {/* Additional Info */}
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
                                    {internship.priorityCollege && (
                                        <div>
                                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Priority College</p>
                                            <p className="text-sm font-bold text-indigo-900">{internship.priorityCollege}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <p className="text-sm text-gray-500 font-medium">
                                Review all details before submitting your application
                            </p>
                            <button
                                onClick={() => setShowJobDescription(false)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                            >
                                <Check size={18} /> I Understand, Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternshipApplication;
