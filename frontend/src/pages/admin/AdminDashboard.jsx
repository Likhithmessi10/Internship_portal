import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Settings, Download, Trash, Award, Briefcase, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stats
    const [stats, setStats] = useState({ totalOpenings: 0, activeInternships: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const intRes = await api.get('/internships');

            const ints = intRes.data.data;
            setInternships(ints);

            // Calc Stats
            const totalOpenings = ints.reduce((sum, current) => sum + current.openingsCount, 0);
            setStats({ totalOpenings, activeInternships: ints.length });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-secondary">Admin Dashboard</h1>
                <Link to="/admin/internships/new" className="btn-primary">
                    + Create Internship
                </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card border-t-4 border-primary">
                    <p className="text-muted text-sm font-semibold uppercase">Active Internships</p>
                    <p className="text-3xl font-bold text-secondary mt-2">{stats.activeInternships}</p>
                </div>
                <div className="card border-t-4 border-accent">
                    <p className="text-muted text-sm font-semibold uppercase">Total Openings</p>
                    <p className="text-3xl font-bold text-secondary mt-2">{stats.totalOpenings}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content: Internships Management */}
                <div className="xl:col-span-3">
                    <div className="card h-full">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Briefcase className="text-primary" /> Manage Internships
                        </h2>

                        {internships.length === 0 ? (
                            <p className="text-muted">No internships have been created yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="p-3 text-sm font-bold text-gray-700">Title</th>
                                            <th className="p-3 text-sm font-bold text-gray-700">Dept</th>
                                            <th className="p-3 text-sm font-bold text-gray-700">Openings</th>
                                            <th className="p-3 text-sm font-bold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {internships.map(internship => (
                                            <tr key={internship.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium text-secondary">{internship.title}</td>
                                                <td className="p-3 text-sm text-gray-600">{internship.department}</td>
                                                <td className="p-3 text-sm text-gray-600 font-semibold">{internship.openingsCount}</td>
                                                <td className="p-3 text-sm flex gap-2">
                                                    <Link
                                                        to={`/admin/internships/${internship.id}/applications`}
                                                        className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-blue-800 transition-colors"
                                                    >
                                                        Review Applications
                                                    </Link>
                                                    <a
                                                        href={`http://localhost:5000/api/v1/admin/internships/${internship.id}/export`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                                                    >
                                                        <Download size={12} /> Excel
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
