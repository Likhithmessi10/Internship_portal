import React, { useState } from 'react';
import api from '../../utils/api';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

const WorkSubmissionModal = ({ assignment, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [submissionText, setSubmissionText] = useState('');
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress(10);

        try {
            const formData = new FormData();
            formData.append('submissionText', submissionText);
            if (file) {
                formData.append('file', file);
            }

            setUploadProgress(50);
            
            await api.post(`/students/work/submit/${assignment.id}`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data' 
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(50 + Math.round(percentCompleted / 2));
                }
            });
            
            setUploadProgress(100);
            setTimeout(() => {
                onClose(true);
            }, 500);
        } catch (err) {
            console.error('Submission error:', err);
            alert(err.response?.data?.message || 'Failed to submit work. Please try again.');
            setUploadProgress(0);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file size (5MB limit)
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md" onClick={() => onClose(false)} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20">
                            <Upload size={24} />
                        </div>
                        <button onClick={() => onClose(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Submit Work</h3>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">{assignment.title}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Assignment Info */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2">{assignment.title}</p>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 line-clamp-2">{assignment.description}</p>
                        {assignment.dueDate && (
                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest mt-2">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Submission Details *
                        </label>
                        <textarea
                            required
                            rows="5"
                            placeholder="Describe your work, approach, and key outcomes..."
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            className="w-full p-4 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 dark:border-white/10 rounded-2xl text-sm font-bold placeholder:text-outline/40 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Attachment (Optional)
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-outline-variant/30 dark:border-white/10 rounded-2xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-all bg-surface-container-low dark:bg-slate-800"
                            >
                                <div className="text-center">
                                    <FileText size={32} className="mx-auto text-outline/40 mb-2" />
                                    <p className="text-sm font-bold text-outline">
                                        {file ? file.name : 'Click to upload file'}
                                    </p>
                                    <p className="text-[10px] text-outline/60 mt-1">
                                        PDF, DOC, ZIP, PNG, JPG (Max 5MB)
                                    </p>
                                </div>
                            </label>
                        </div>
                        {file && (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-600" />
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{file.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="text-emerald-600 hover:text-emerald-700 text-xs font-bold uppercase"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-outline">Uploading...</span>
                                <span className="font-bold text-primary">{uploadProgress}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-600 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 hover:shadow-2xl hover:shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                SUBMITTING...
                            </>
                        ) : (
                            <>
                                <Upload size={20} /> SUBMIT WORK
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WorkSubmissionModal;
