import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Upload, FileType, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck, FileText, Check } from 'lucide-react';

const InternshipApplication = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [internship, setInternship] = useState(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // File States
    const [resume, setResume] = useState(null);
    const [nocLetter, setNocLetter] = useState(null);
    const [hodLetter, setHodLetter] = useState(null);
    const [marksheet, setMarksheet] = useState(null);
    const [passportPhoto, setPassportPhoto] = useState(null);

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

    const handleFileChange = (e, setter, isImage = false) => {
        const file = e.target.files[0];
        if (file) {
            if (isImage) {
                if (!file.type.startsWith('image/')) {
                    setError('Only image files are allowed for photo.');
                    setter(null);
                    e.target.value = null;
                    return;
                }
            } else {
                if (file.type !== 'application/pdf') {
                    setError('Only PDF files are allowed.');
                    setter(null);
                    e.target.value = null; // reset
                    return;
                }
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB.');
                setter(null);
                e.target.value = null;
                return;
            }
            setError('');
            setter(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required docs
        if (internship?.requiredDocuments) {
            const missing = internship.requiredDocuments.filter(docId => {
                if (docId === 'RESUME') return !resume;
                if (docId === 'NOC_LETTER') return !nocLetter;
                if (docId === 'HOD_LETTER') return !hodLetter;
                if (docId === 'MARKSHEET') return !marksheet;
                if (docId === 'PASSPORT_PHOTO') return !passportPhoto;
                return false;
            });

            if (missing.length > 0) {
                setError(`Please upload all required documents: ${missing.join(', ')}`);
                return;
            }
        }

        const formData = new FormData();
        if (resume) formData.append('resume', resume);
        if (nocLetter) formData.append('nocLetter', nocLetter);
        if (hodLetter) formData.append('hodLetter', hodLetter);
        if (marksheet) formData.append('marksheet', marksheet);
        if (passportPhoto) formData.append('passportPhoto', passportPhoto);

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

    const FileUploadInput = ({ label, description, state, setter, id, acceptType = "application/pdf" }) => (
        <div className="relative group">
            <input
                type="file"
                id={id}
                accept={acceptType}
                className="hidden"
                onChange={(e) => handleFileChange(e, setter, acceptType.startsWith('image/'))}
            />
            <label 
                htmlFor={id} 
                className={`block w-full p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4
                ${state 
                    ? 'border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50' 
                    : 'border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
            >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                    ${state ? 'bg-emerald-100' : 'bg-indigo-100 group-hover:bg-indigo-200'} transition-colors`}>
                    {state ? <Check className="w-6 h-6 text-emerald-600" /> : (acceptType.startsWith('image/') ? <Upload className="w-6 h-6 text-indigo-600" /> : <FileText className="w-6 h-6 text-indigo-600" />)}
                </div>
                <div className="flex-grow">
                    <h4 className={`font-bold text-sm sm:text-base ${state ? 'text-emerald-900' : 'text-gray-900'}`}>
                        {label}
                    </h4>
                    <p className={`text-xs sm:text-sm font-medium mt-1 ${state ? 'text-emerald-700/70' : 'text-gray-500'}`}>
                        {state ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {state.name}</span> : description}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 mt-2 sm:mt-0
                    ${state ? 'bg-emerald-200/50 text-emerald-800' : 'bg-white border border-gray-200 text-gray-600 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600'}`}>
                    {state ? 'Change File' : `Browse ${acceptType.includes('pdf') ? 'PDF' : 'Image'}`}
                </div>
            </label>
        </div>
    );

    const docConfig = {
        'RESUME': { label: 'Technical Resume / CV', desc: 'Highlight relevant projects and skills.', state: resume, setter: setResume, id: 'resume-upload' },
        'NOC_LETTER': { label: 'Principal Recommendation / NOC', desc: 'Official signed document from your College Principal.', state: nocLetter, setter: setNocLetter, id: 'noc-upload' },
        'HOD_LETTER': { label: 'HOD Acknowledgement', desc: 'Departmental approval for industrial training.', state: hodLetter, setter: setHodLetter, id: 'hod-upload' },
        'MARKSHEET': { label: 'Educational Marksheets', desc: 'Consolidated or latest semester marksheet.', state: marksheet, setter: setMarksheet, id: 'marksheet-upload' },
        'PASSPORT_PHOTO': { label: 'Passport Size Photo', desc: 'Recent professional photograph for ID card.', state: passportPhoto, setter: setPassportPhoto, id: 'photo-upload', type: 'image/*' },
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
                        <h1 className="text-3xl sm:text-4xl font-black font-rajdhani mb-2 leading-tight">
                            {internship.title}
                        </h1>
                        <p className="text-indigo-200 font-medium text-lg">
                            {internship.department} Department • ID: {internship.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="p-8 sm:p-10">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-10 flex gap-4">
                        <AlertCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-indigo-900 mb-2">Automated Shortlisting Protocol</h3>
                            <p className="text-sm font-medium text-indigo-800/80 leading-relaxed">
                                APTRANSCO utilizes an automated evaluation engine. Your application will be assessed based on the metrics saved in your student profile (CGPA, NIRF Ranking, Experience). Please ensure your profile is fully up-to-date before proceeding with this application.
                            </p>
                        </div>
                    </div>

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

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Supporting Documents</h3>
                                <p className="text-sm text-gray-500 font-medium mb-6">Upload required authorization letters in PDF format (Max 5MB each).</p>

                                <div className="space-y-4">
                                    {(internship.requiredDocuments || ['RESUME', 'NOC_LETTER']).map(docId => {
                                        const config = docConfig[docId];
                                        if (!config) return null;
                                        return (
                                            <FileUploadInput 
                                                key={docId}
                                                id={config.id}
                                                label={config.label} 
                                                description={config.desc} 
                                                state={config.state} 
                                                setter={config.setter} 
                                                acceptType={config.type || "application/pdf"}
                                            />
                                        );
                                    })}
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
        </div>
    );
};

export default InternshipApplication;
