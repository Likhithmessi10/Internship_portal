import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const StudentProfileForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    // Initial empty state
    const [formData, setFormData] = useState({
        fullName: '', phone: '', dob: '', address: '', aadhar: '',
        collegeName: '', university: '', degree: '', branch: '', yearOfStudy: 1,
        cgpa: '', collegeCategory: 'OTHER', nirfRanking: '',
        hasExperience: false, hasProjects: false, hasCertifications: false,
        experienceDesc: '', projectsDesc: '', skills: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                if (res.data.data) {
                    const d = res.data.data;
                    // Format date for inputs
                    const dDob = d.dob ? new Date(d.dob).toISOString().split('T')[0] : '';
                    setFormData({ ...d, dob: dDob });
                }
            } catch (error) {
                console.log("No profile to load");
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/students/profile', formData);
            navigate('/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="text-center py-10 text-muted">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-secondary mb-6">Edit Profile</h1>
            <div className="card">
                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* SECTION 1: Personal Details */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-primary border-b pb-2">Personal Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" name="fullName" required className="input-field" value={formData.fullName} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="text" name="phone" required className="input-field" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input type="date" name="dob" required className="input-field" value={formData.dob} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Aadhar / ID Number</label>
                                <input type="text" name="aadhar" required className="input-field" value={formData.aadhar} onChange={handleChange} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Full Address</label>
                                <textarea name="address" required className="input-field h-24" value={formData.address} onChange={handleChange}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Educational Details */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-primary border-b pb-2">Educational Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 border rounded-md">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800">College Category (Important)</label>
                                    <p className="text-xs text-muted mb-2">Used for shortlisting algorithms</p>
                                    <select name="collegeCategory" required className="input-field font-semibold bg-white" value={formData.collegeCategory} onChange={handleChange}>
                                        <option value="IIT">IIT</option>
                                        <option value="NIT">NIT</option>
                                        <option value="IIIT">IIIT</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800">NIRF Ranking</label>
                                    <p className="text-xs text-muted mb-2">Leave blank if not applicable</p>
                                    <input type="number" name="nirfRanking" className="input-field" placeholder="e.g. 24" value={formData.nirfRanking} onChange={handleChange} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">College Name</label>
                                <input type="text" name="collegeName" required className="input-field" value={formData.collegeName} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">University</label>
                                <input type="text" name="university" required className="input-field" value={formData.university} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Degree</label>
                                <input type="text" name="degree" required placeholder="e.g. B.Tech" className="input-field" value={formData.degree} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Branch</label>
                                <input type="text" name="branch" required placeholder="e.g. Computer Science" className="input-field" value={formData.branch} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year of Study</label>
                                <input type="number" name="yearOfStudy" min="1" max="5" required className="input-field" value={formData.yearOfStudy} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current CGPA (Out of 10.0)</label>
                                <input type="number" step="0.01" name="cgpa" required className="input-field" value={formData.cgpa} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Optional Experience Bonus */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-primary border-b pb-2">Experience & Skills (Bonus)</h2>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input type="checkbox" name="hasExperience" className="h-4 w-4 text-primary rounded border-gray-300" checked={formData.hasExperience} onChange={handleChange} />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Previous Internships</label>
                                    {formData.hasExperience && (
                                        <textarea name="experienceDesc" className="input-field mt-2" placeholder="Briefly describe your internship experience..." value={formData.experienceDesc} onChange={handleChange}></textarea>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input type="checkbox" name="hasProjects" className="h-4 w-4 text-primary rounded border-gray-300" checked={formData.hasProjects} onChange={handleChange} />
                                </div>
                                <div className="ml-3 text-sm w-full">
                                    <label className="font-medium text-gray-700">Relevant Projects</label>
                                    {formData.hasProjects && (
                                        <textarea name="projectsDesc" className="input-field w-full mt-2" placeholder="Describe 1-2 major projects..." value={formData.projectsDesc} onChange={handleChange}></textarea>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input type="checkbox" name="hasCertifications" className="h-4 w-4 text-primary rounded border-gray-300" checked={formData.hasCertifications} onChange={handleChange} />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label className="font-medium text-gray-700">Industry Certifications</label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Technical Skills (Comma separated)</label>
                                <input type="text" name="skills" className="input-field" placeholder="React, Node.js, Python, PostgreSQL..." value={formData.skills} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button type="button" onClick={() => navigate('/student/dashboard')} className="btn-secondary mr-4">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving Profile...' : 'Save Profile'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default StudentProfileForm;
