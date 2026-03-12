import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ApplicationProfileModal from './ApplicationProfileModal';
import { ArrowLeft, Download, Users, CheckCircle, Clock, XCircle, Eye, TrendingUp } from 'lucide-react';

const FILTERS = ['All', 'PENDING', 'SHORTLISTED', 'HIRED', 'REJECTED'];

const StatusBadge = ({ status }) => {
    const map = {
        PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
        SHORTLISTED: 'bg-blue-50 text-blue-700 border-blue-200',
        HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    );
};

const AdminApplicationReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [internship, setInternship] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');
    const [selected, setSelected] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [intRes, appRes] = await Promise.all([
                api.get(`/internships/${id}`),
                api.get(`/admin/internships/${id}/applications`)
            ]);
            setInternship(intRes.data.data);
            setApplications(appRes.data.data);
        } catch {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [id, fetchData]);

    const updateStatus = async (appId, newStatus, assignedRole = null) => {
        try {
            const payload = { status: newStatus };
            if (assignedRole) payload.assignedRole = assignedRole;
            await api.put(`/admin/applications/${appId}`, payload);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, assignedRole } : a));
            if (selected?.id === appId) setSelected(prev => ({ ...prev, status: newStatus, assignedRole }));
        } catch {
            alert('Failed to update status');
        }
    };

    const filtered = filter === 'All' ? applications : applications.filter(a => a.status === filter);

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        hired: applications.filter(a => a.status === 'HIRED').length,
        rejected: applications.filter(a => a.status === 'REJECTED').length,
    };
    const remaining = internship ? Math.max(0, internship.openingsCount - stats.hired) : 0;
    const fillPct = internship ? Math.min(100, Math.round((stats.hired / internship.openingsCount) * 100)) : 0;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button onClick={() => navigate('/admin/dashboard')} className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={18} className="text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">{internship?.title}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{internship?.department} · {internship?.location}</p>
                        {internship?.roles && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {internship.roles.split(',').map(r => (
                                    <span key={r} className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">{r.trim()}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <a href={`http://localhost:5001/api/v1/admin/internships/${id}/export`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm transition-colors">
                    <Download size={15} /> Export Excel
                </a>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>}

            {/* Dynamic Stats + Fill Rate */}
            <div className="admin-card">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5">
                    {[
                        { label: 'Applications', value: stats.total, icon: Users, color: 'text-indigo-600' },
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600' },
                        { label: 'Hired', value: stats.hired, icon: CheckCircle, color: 'text-emerald-600' },
                        { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500' },
                        { label: 'Remaining Seats', value: remaining, icon: TrendingUp, color: 'text-indigo-600' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                            {React.createElement(icon, { size: 18, className: `mx-auto mb-1 ${color}` })}
                            <p className="text-2xl font-black text-gray-800">{value}</p>
                            <p className="text-xs text-gray-400 font-medium">{label}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-semibold w-24">Fill Rate {fillPct}%</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all"
                            style={{
                                width: `${fillPct}%`,
                                background: fillPct >= 80 ? '#f87171' : fillPct >= 50 ? '#fbbf24' : '#10b981'
                            }} />
                    </div>
                    <span className="text-xs text-gray-400">{stats.hired}/{internship?.openingsCount} openings filled</span>
                </div>
            </div>

            {/* Internship Details Collapsible */}
            {(internship?.requirements || internship?.expectations) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {internship.requirements && (
                        <div className="admin-card">
                            <h3 className="text-sm font-bold text-gray-700 mb-2">📋 Requirements</h3>
                            <p className="text-xs text-gray-500 whitespace-pre-line">{internship.requirements}</p>
                        </div>
                    )}
                    {internship.expectations && (
                        <div className="admin-card">
                            <h3 className="text-sm font-bold text-gray-700 mb-2">🎯 Expectations</h3>
                            <p className="text-xs text-gray-500 whitespace-pre-line">{internship.expectations}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Filter Tabs + Table */}
            <div className="admin-card">
                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {f} {f !== 'All' && `(${applications.filter(a => a.status === f).length})`}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Users size={36} className="mx-auto mb-3 text-gray-200" />
                        <p className="font-medium">No {filter !== 'All' ? filter.toLowerCase() : ''} applications found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">College / Tier</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">CGPA</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Docs</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0">
                                                    {app.student?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{app.student?.fullName}</p>
                                                    <p className="text-xs text-gray-400">{app.student?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-4">
                                            <p className="text-sm text-gray-700 font-medium max-w-xs truncate">{app.student?.collegeName}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded font-semibold text-gray-600">{app.student?.collegeCategory}</span>
                                                {app.student?.nirfRanking && <span className="text-xs text-gray-400">NIRF #{app.student.nirfRanking}</span>}
                                            </div>
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span className="text-lg font-black text-gray-800">{app.student?.cgpa}</span>
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${app.documents?.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                                {app.documents?.length || 0} PDFs
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-center flex flex-col items-center gap-1 justify-center">
                                            <StatusBadge status={app.status} />
                                            {app.status === 'HIRED' && app.assignedRole && (
                                                <span className="text-[10px] uppercase tracking-wide font-black text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    {app.assignedRole}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => setSelected(app)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors">
                                                    <Eye size={12} /> Profile
                                                </button>
                                                {app.status !== 'HIRED' && app.status !== 'REJECTED' && (
                                                    <>
                                                        <button onClick={() => updateStatus(app.id, 'HIRED')}
                                                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="Hire">
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button onClick={() => updateStatus(app.id, 'REJECTED')}
                                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors" title="Reject">
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selected && (
                <ApplicationProfileModal
                    application={selected}
                    internship={internship}
                    onClose={() => setSelected(null)}
                    onHire={(assignedRole) => updateStatus(selected.id, 'HIRED', assignedRole)}
                    onReject={() => updateStatus(selected.id, 'REJECTED')}
                    onReconsider={() => updateStatus(selected.id, 'PENDING')}
                />
            )}
        </div>
    );
};

export default AdminApplicationReview;
