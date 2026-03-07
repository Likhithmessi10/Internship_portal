import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Upload, FileType, CheckCircle, AlertCircle } from 'lucide-react';

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
    const [principalLetter, setPrincipalLetter] = useState(null);
    const [hodLetter, setHodLetter] = useState(null);

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
                } catch (e) {
                    setProfileComplete(false);
                }

            } catch (err) {
                setError('Internship not found or server error.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleFileChange = (e, setter) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setError('Only PDF files are allowed.');
                setter(null);
                e.target.value = null; // reset
                return;
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

        if (!resume || !principalLetter || !hodLetter) {
            return setError('Please attach all mandatory documents (Resume, Principal Letter, HOD Letter).');
        }

        const formData = new FormData();
        formData.append('resume', resume);
        formData.append('principalLetter', principalLetter);
        formData.append('hodLetter', hodLetter);

        setSubmitting(true);
        setError('');

        try {
            // Because we're sending FormData, axios handles boundary automatically, 
            // but we ensure interceptor passes token correctly.
            await api.post(`/internships/${id}/apply`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess('Application submitted successfully! Redirecting to dashboard...');
            setTimeout(() => navigate('/student/dashboard'), 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit application.');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-10 text-muted">Loading application details...</div>;

    if (!internship && !loading) return <div className="text-center py-10 text-red-500 font-bold">Internship Not Found</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-secondary mb-2">Apply for Internship</h1>
            <p className="text-lg text-primary font-medium mb-6">{internship.title} - {internship.department}</p>

            <div className="card mb-6 bg-blue-50 border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">Automated Shortlisting Notice</h3>
                <p className="text-sm text-blue-700">
                    Your application will be evaluated automatically by the APTRANSCO engine based on the profile details you provided (CGPA, Nirf Ranking, College, etc). Make sure your profile is fully accurate before submitting!
                </p>
            </div>

            <div className="card">
                {!profileComplete ? (
                    <div className="text-center py-8">
                        <AlertCircle className="text-yellow-500 mx-auto mb-3" size={48} />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Incomplete</h2>
                        <p className="text-gray-600 mb-6">You must complete your student profile before applying.</p>
                        <button onClick={() => navigate('/student/profile/edit')} className="btn-primary">
                            Complete Profile Now
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}
                        {success && <div className="bg-green-50 text-green-700 p-3 rounded flex items-center gap-2"><CheckCircle /> {success}</div>}

                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Mandatory Documents Upload (PDF Only, Max 5MB)</h3>

                            {/* Document 1 */}
                            <div className="mb-4 bg-gray-50 p-4 border rounded-md">
                                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <FileType size={16} className="text-primary" /> Resume / CV
                                </label>
                                <p className="text-xs text-muted mb-2">Submit your current professional resume highlighting skills and projects.</p>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    required
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-800"
                                    onChange={(e) => handleFileChange(e, setResume)}
                                />
                            </div>

                            {/* Document 2 */}
                            <div className="mb-4 bg-gray-50 p-4 border rounded-md">
                                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <FileType size={16} className="text-primary" /> Principal Recommendation Letter
                                </label>
                                <p className="text-xs text-muted mb-2">Official letter signed by your college Principal.</p>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    required
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-800"
                                    onChange={(e) => handleFileChange(e, setPrincipalLetter)}
                                />
                            </div>

                            {/* Document 3 */}
                            <div className="mb-4 bg-gray-50 p-4 border rounded-md">
                                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <FileType size={16} className="text-primary" /> HOD Acknowledgement Letter
                                </label>
                                <p className="text-xs text-muted mb-2">Acknowledge letter from your Head of Department.</p>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    required
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-800"
                                    onChange={(e) => handleFileChange(e, setHodLetter)}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t flex gap-4 justify-end">
                            <button type="button" onClick={() => navigate('/internships')} className="btn-secondary">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary flex items-center gap-2"
                                disabled={submitting || error === 'You have already applied to this internship.'}
                            >
                                {submitting ? 'Submitting...' : <><Upload size={18} /> Submit Application</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default InternshipApplication;
