import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import {
    Briefcase, Plus, Download, Trash2, ToggleLeft, ToggleRight,
    Users, TrendingUp, CheckCircle, Clock, ChevronRight, BarChart2, Calendar
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <div className={`admin-stat-card border-t-4 ${color}`}>
        <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-gray-50">
                {React.createElement(Icon, { size: 20, className: "text-gray-600" })}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
        </div>
        <p className="text-4xl font-black text-gray-800">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
);

const ProgressBar = ({ value, max, color = 'bg-emerald-500' }) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
};

const AdminDashboard = () => {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [toggling, setToggling] = useState(null);
    const [exporting, setExporting] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/internships');
            setInternships(res.data.data);
        } catch {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, title) => {
        if (!confirm(`Delete internship "${title}"? This will remove all associated applications.`)) return;
        setDeleting(id);
        try {
            await api.delete(`/admin/internships/${id}`);
            setInternships(prev => prev.filter(i => i.id !== id));
        } catch {
            alert('Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    const handleToggle = async (id) => {
        setToggling(id);
        try {
            const res = await api.put(`/admin/internships/${id}/toggle`);
            setInternships(prev => prev.map(i => i.id === id ? { ...i, isActive: res.data.data.isActive } : i));
        } catch {
            alert('Failed to toggle status');
        } finally {
            setToggling(null);
        }
    };

    const handleExtendDeadline = async (id, newDate) => {
        try {
            const res = await api.put(`/admin/internships/${id}/deadline`, { deadline: newDate || null });
            setInternships(prev => prev.map(i => i.id === id ? { ...i, applicationDeadline: res.data.data.applicationDeadline } : i));
        } catch {
            alert('Failed to update deadline');
        }
    };

    const handleExport = async (id, title) => {
        setExporting(id);
        try {
            const res = await api.get(`/admin/internships/${id}/export`, { responseType: 'blob' });

            // Create a temporary link to download the blob
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}_applications.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch {
            console.error('Export failed');
            alert('Failed to export applications.');
        } finally {
            setExporting(null);
        }
    };

    const totalApplications = internships.reduce((s, i) => s + (i.applicationsCount || 0), 0);
    const totalOpenings = internships.reduce((s, i) => s + i.openingsCount, 0);
    const totalHired = internships.reduce((s, i) => s + (i.hiredCount || 0), 0);
    const totalRemaining = totalOpenings - totalHired;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage internships, review applications, and track hiring progress.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/rejected" className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors">
                        <Users size={16} /> Rejected
                    </Link>
                    <Link to="/admin/internships/new" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-colors">
                        <Plus size={16} /> Create Internship
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Briefcase} label="Active Internships" value={internships.filter(i => i.isActive).length} color="border-indigo-500" subtext={`${internships.length} total`} />
                <StatCard icon={Users} label="Total Applications" value={totalApplications} color="border-sky-500" subtext="across all posts" />
                <StatCard icon={CheckCircle} label="Hired" value={totalHired} color="border-emerald-500" subtext={`of ${totalOpenings} openings`} />
                <StatCard icon={Clock} label="Seats Remaining" value={totalRemaining} color="border-amber-500" subtext="available slots" />
            </div>

            {/* Internship Table */}
            <div className="admin-card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BarChart2 size={20} className="text-indigo-500" /> Internship Management
                    </h2>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">{internships.length} listings</span>
                </div>

                {internships.length === 0 ? (
                    <div className="text-center py-16">
                        <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-medium">No internships created yet.</p>
                        <Link to="/admin/internships/new" className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                            <Plus size={14} /> Create your first internship
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Internship</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Applications</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Openings</th>
                                    <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider pl-4">Fill Rate</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {internships.map(int => {
                                    const fillPct = int.openingsCount > 0 ? Math.round((int.hiredCount / int.openingsCount) * 100) : 0;
                                    return (
                                        <tr key={int.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-gray-800">{int.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{int.department} · {int.location}</p>
                                                {int.applicationDeadline && (
                                                    <p className={`text-xs mt-0.5 font-bold ${new Date(int.applicationDeadline) < new Date() ? 'text-red-500' : 'text-amber-600'}`}>
                                                        {new Date(int.applicationDeadline) < new Date() ? 'Closed: ' : 'Deadline: '}
                                                        {new Date(int.applicationDeadline).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${int.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${int.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                    {int.isActive ? 'Active' : 'Closed'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-lg font-black text-gray-800">{int.applicationsCount}</span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="font-bold text-gray-700">{int.hiredCount}</span>
                                                <span className="text-gray-300 mx-1">/</span>
                                                <span className="text-gray-500">{int.openingsCount}</span>
                                            </td>
                                            <td className="py-4 pl-4 w-36">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <ProgressBar value={int.hiredCount} max={int.openingsCount}
                                                            color={fillPct >= 80 ? 'bg-red-400' : fillPct >= 50 ? 'bg-amber-400' : 'bg-emerald-500'} />
                                                    </div>
                                                    <span className="text-xs text-gray-400 w-8 text-right">{fillPct}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/admin/internships/${int.id}/applications`}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                                                    >
                                                        Review <ChevronRight size={12} />
                                                    </Link>
                                                    <input
                                                        type="date"
                                                        className="hidden"
                                                        id={`date-${int.id}`}
                                                        onChange={(e) => handleExtendDeadline(int.id, e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => { try { document.getElementById(`date-${int.id}`).showPicker(); } catch { const d = prompt('Enter new date YYYY-MM-DD'); if (d !== null) handleExtendDeadline(int.id, d); } }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Extend/Change Deadline"
                                                    >
                                                        <Calendar size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExport(int.id, int.title)}
                                                        disabled={exporting === int.id}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Export Excel"
                                                    >
                                                        {exporting === int.id ? <span className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" /> : <Download size={15} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggle(int.id)}
                                                        disabled={toggling === int.id}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title={int.isActive ? 'Close applications' : 'Open applications'}
                                                    >
                                                        {int.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(int.id, int.title)}
                                                        disabled={deleting === int.id}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
