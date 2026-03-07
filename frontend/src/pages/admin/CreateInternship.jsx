import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const CreateInternshipForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        location: '',
        duration: '',
        openingsCount: 1
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/admin/internships', formData);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create internship');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-secondary mb-6">Create New Internship</h1>
            <div className="card">
                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Internship Title</label>
                        <input type="text" name="title" required className="input-field mt-1" value={formData.title} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <input type="text" name="department" required placeholder="e.g. IT, Electrical" className="input-field mt-1" value={formData.department} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" required className="input-field mt-1 h-32" value={formData.description} onChange={handleChange}></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input type="text" name="location" required className="input-field mt-1" value={formData.location} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration</label>
                            <input type="text" name="duration" required placeholder="e.g. 6 Months" className="input-field mt-1" value={formData.duration} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total Openings (Spots available)</label>
                        <input type="number" name="openingsCount" min="1" required className="input-field mt-1" value={formData.openingsCount} onChange={handleChange} />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Creating...' : 'Publish Internship'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateInternshipForm;
