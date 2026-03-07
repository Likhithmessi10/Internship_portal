import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Play, Check, X, Eye, FileText, User } from 'lucide-react';

const AdminApplicationReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [internship, setInternship] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [runningAutomation, setRunningAutomation] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // First get the internship details so we know openings
            const intRes = await api.get(`/internships/${id}`);
            setInternship(intRes.data.data);

            // To be secure, the export endpoint queries all matching applications on the backend
            // For the admin dashboard UI view, we actually need an API to fetch applications JSON.
            // *Wait, I didn't create a GET applications endpoint for admins.* I'll use the export logic to build a quick route, 
            // or I'll implement a fast workaround route on the backend momentarily.

            const res = await api.get(`/admin/internships/${id}/applications`); // <--- Needs to be created
            setApplications(res.data.data);

        } catch (error) {
            console.error("Failed to fetch applications", error);
            setError("Could not load applications. Ensure API endpoint exists.");
        } finally {
            setLoading(false);
        }
    };

    const triggerAutomation = async () => {
        if (!window.confirm("Run Automated Scoring Engine? This will automatically reject candidates based on your weight config.")) return;

        setRunningAutomation(true);
        try {
            const res = await api.post(`/admin/internships/${id}/shortlist`);
            alert(`Automation Complete! Processed ${res.data.summary.totalApplicationsProcessed} | Shortlisted for review: ${res.data.summary.shortlistedForReview} | Automatically Rejected: ${res.data.summary.automaticallyRejected}`);
            fetchData(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || 'Automation Failed');
        } finally {
            setRunningAutomation(false);
        }
    };

    const updateStatus = async (appId, newStatus) => {
        try {
            await api.put(`/admin/applications/${appId}`, { status: newStatus });
            fetchData(); // Refresh UI
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="text-center py-10">Loading Applications...</div>;

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        hired: applications.filter(a => a.status === 'HIRED').length,
        rejected: applications.filter(a => a.status === 'REJECTED').length,
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-secondary flex items-center gap-3">
                        <button onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-primary">&larr;</button>
                        Reviewing: {internship?.title}
                    </h1>
                    <p className="text-muted ml-9 mt-1">Total Openings Available: <strong>{internship?.openingsCount}</strong></p>
                </div>

                <div className="flex gap-3">
                    <a href={`http://localhost:5000/api/v1/admin/internships/${id}/export`} target="_blank" rel="noreferrer" className="btn-secondary">
                        Export Report (Excel)
                    </a>
                    <button
                        onClick={triggerAutomation}
                        disabled={runningAutomation || stats.pending === 0}
                        className={`font-semibold py-2 px-4 rounded transition-colors shadow-sm flex items-center gap-2 ${stats.pending > 0 ? 'bg-accent hover:bg-yellow-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                        <Play size={18} fill="currentColor" />
                        {runningAutomation ? 'Running Engine...' : `Auto Shortlist Pending (${stats.pending})`}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-6">{error}</div>}

            <div className="grid grid-cols-5 gap-4 mb-6 text-center">
                <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded shadow-sm border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-600 uppercase">Pending</p>
                    <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded shadow-sm border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 uppercase">Shortlisted</p>
                    <p className="text-xl font-bold text-blue-700">{stats.shortlisted}</p>
                </div>
                <div className="bg-green-50 p-3 rounded shadow-sm border border-green-100">
                    <p className="text-xs font-bold text-green-600 uppercase">Hired</p>
                    <p className="text-xl font-bold text-green-700">{stats.hired}</p>
                </div>
                <div className="bg-red-50 p-3 rounded shadow-sm border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase">Auto-Rejected</p>
                    <p className="text-xl font-bold text-red-700">{stats.rejected}</p>
                </div>
            </div>

            <div className="card w-full overflow-x-auto">
                {applications.length === 0 ? (
                    <p className="text-center text-muted p-10">No students have applied to this internship yet.</p>
                ) : (
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-3 text-sm font-bold text-gray-700">Student Name</th>
                                <th className="p-3 text-sm font-bold text-gray-700">College / NIRF</th>
                                <th className="p-3 text-sm font-bold text-gray-700">CGPA</th>
                                <th className="p-3 text-sm font-bold text-gray-700">Auto Score</th>
                                <th className="p-3 text-sm font-bold text-gray-700">Status</th>
                                <th className="p-3 text-sm font-bold text-gray-700">Docs</th>
                                <th className="p-3 text-sm font-bold text-gray-700 text-center">Manual Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <div className="font-semibold text-secondary flex items-center gap-2">
                                            <User size={14} className="text-primary" /> {app.student.fullName}
                                        </div>
                                        <div className="text-xs text-muted">{app.student.phone}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="text-sm font-medium">{app.student.collegeName}</div>
                                        <div className="text-xs text-muted flex items-center gap-2">
                                            <span className="font-bold">Tier:</span> {app.student.collegeCategory}
                                            {app.student.nirfRanking && <><span className="font-bold ml-1">NIRF:</span> {app.student.nirfRanking}</>}
                                        </div>
                                    </td>
                                    <td className="p-3 font-semibold text-center">{app.student.cgpa}</td>
                                    <td className="p-3">
                                        <div className="font-bold text-lg text-primary">{Math.round(app.score)}</div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold
                                            ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                                                    app.status === 'HIRED' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1 font-semibold">
                                            <FileText size={12} /> {app.documents?.length || 0} PDFs
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-center gap-2">
                                            {app.status !== 'HIRED' && app.status !== 'REJECTED' && (
                                                <button onClick={() => updateStatus(app.id, 'HIRED')} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Hire Candidate">
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            {app.status !== 'REJECTED' && (
                                                <button onClick={() => updateStatus(app.id, 'REJECTED')} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Reject Candidate">
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminApplicationReview;
