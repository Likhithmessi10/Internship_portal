import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import ApplicationProfileModal from '../ApplicationProfileModal';
import ExportDataModal from '../../../components/ExportDataModal';
import { 
    Search, Filter, Download, ChevronRight, ChevronDown,
    GraduationCap, Award, Info, MapPin, Eye, CheckCircle,
    Users, FileText, UserCheck, XCircle, Check, X
} from 'lucide-react';
import WarningCard from '../../../components/ui/WarningCard';

const HodApplications = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);

    const fetchData = useCallback(async (background = false) => {
        if (!background) setLoading(true);
        try {
            // First get all internships for this HOD
            const intRes = await api.get('/admin/internships');
            const deptInternships = intRes?.data?.data || [];
            
            // Then fetch applications for each internship and flatten
            const allAppsPromises = deptInternships.map(i => api.get(`/admin/internships/${i.id}/applications`));
            const appsResults = await Promise.all(allAppsPromises);
            const flattened = appsResults.flatMap(r => r?.data?.data || []);
            
            setApplications(flattened);
        } catch (err) {
            console.error('Failed to fetch departmental applications');
            if (!background) setError('Failed to sync departmental applications. Please check your connection.');
            if (!background) setApplications([]);
        } finally {
            if (!background) setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredApps = (applications || []).filter(app => {
        const matchesStatus = filter === 'All' || app.status === filter;
        const matchesSearch = searchQuery === '' || 
            app.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.student?.collegeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.trackingId?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Stats for KPI Cards
    const stats = {
        total: applications.length,
        applied: applications.filter(a => a.status === 'APPLIED').length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        approved: applications.filter(a => a.status === 'APPROVED').length,
        rejected: applications.filter(a => a.status === 'REJECTED').length
    };

    const handleQuickAction = async (appId, newStatus) => {
        // Optimistic UI update
        const previousApps = [...applications];
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        try {
            const res = await api.put(`/admin/applications/${appId}`, { status: newStatus });
            if (res.data?.warning) {
                alert(res.data.message);
            } else {
                alert(`Application status updated to ${newStatus} successfully!`);
            }
            // Re-sync silently
            fetchData(true);
        } catch (err) {
            // Revert on failure
            setApplications(previousApps);
            alert('Failed to execute quick action.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 w-full">
            <div className="flex flex-col items-center gap-4 text-outline/50">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Loading Applicants...</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
            {error && <WarningCard message={error} onClose={() => setError(null)} />}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline dark:text-indigo-400 uppercase mb-1 block">Recruitment Oversight</span>
                    <h2 className="text-3xl font-bold text-primary dark:text-white tracking-tight">Departmental Applications</h2>
                </div>
                <button 
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 w-full md:w-auto"
                >
                    <Download size={14} />
                    Export to Excel
                </button>
            </section>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total', count: stats.total, value: 'All', icon: <Users size={18} className="text-secondary" />, color: 'border-secondary/20 bg-secondary/5' },
                    { label: 'Shortlisted', count: stats.shortlisted, value: 'SHORTLISTED', icon: <Award size={18} className="text-blue-500" />, color: 'border-blue-500/20 bg-blue-50/50' },
                    { label: 'Approved', count: stats.approved, value: 'APPROVED', icon: <CheckCircle size={18} className="text-emerald-500" />, color: 'border-emerald-500/20 bg-emerald-50/50' },
                    { label: 'Rejected', count: stats.rejected, value: 'REJECTED', icon: <XCircle size={18} className="text-red-500" />, color: 'border-red-500/20 bg-red-50/50' },
                ].map((kpi, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setFilter(kpi.value)}
                        className={`cursor-pointer rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${filter === kpi.value ? 'ring-2 ring-primary border-primary shadow-sm ' + kpi.color : 'border-outline-variant/10 dark:border-slate-800 bg-surface-container-lowest dark:bg-slate-900'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-outline dark:text-slate-500 uppercase tracking-widest">{kpi.label}</span>
                            <div className={`p-2 rounded-lg ${filter === kpi.value ? 'bg-white' : 'bg-surface-container-high dark:bg-slate-800'}`}>
                                {kpi.icon}
                            </div>
                        </div>
                        <span className={`text-3xl font-black ${filter === kpi.value ? 'text-primary dark:text-primary-light' : 'text-slate-700 dark:text-slate-200'}`}>{kpi.count}</span>
                    </div>
                ))}
            </div>

            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 dark:border-slate-800">
                <div className="p-4 md:p-6 border-b border-outline-variant/10 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/50">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {['All', 'APPLIED', 'SHORTLISTED', 'APPROVED', 'REJECTED'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-high dark:bg-slate-800 text-outline dark:text-slate-400 hover:bg-surface-variant dark:hover:bg-slate-700'}`}>
                                {f.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative w-full md:w-80 shrink-0">
                         <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-lg">search</span>
                         <input 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search applicant or college..." 
                            className="w-full bg-surface-container-high dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline/40 dark:placeholder:text-slate-600 transition-all" 
                         />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-surface-container-lowest dark:bg-slate-900">
                                <th className="px-6 py-4 text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[0.2em] border-b border-outline-variant/10 dark:border-slate-800">Candidate</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[0.2em] border-b border-outline-variant/10 dark:border-slate-800">College Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[0.2em] text-center border-b border-outline-variant/10 dark:border-slate-800">Score</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[0.2em] text-center border-b border-outline-variant/10 dark:border-slate-800">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[0.2em] text-right border-b border-outline-variant/10 dark:border-slate-800">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
                            {filteredApps.map(app => (
                                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{app.student?.fullName}</span>
                                            <span className="text-[10px] font-medium text-slate-500 dark:text-indigo-400/60 uppercase tracking-widest mt-1 opacity-80">{app.internship?.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="max-w-[200px]">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={app.student?.collegeName}>{app.student?.collegeName}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                {app.student?.collegeCategory !== 'OTHER' ? app.student?.collegeCategory : 'MANUAL'}
                                                {app.student?.nirfRanking ? ` • NIRF: ${app.student?.nirfRanking}` : ''}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span className="inline-flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-black text-sm px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                            {app.student?.cgpa ? app.student.cgpa.toFixed(2) : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                            app.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' :
                                            app.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30' :
                                            app.status === 'SHORTLISTED' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right align-middle">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {app.status === 'APPLIED' && (
                                                <button onClick={() => handleQuickAction(app.id, 'SHORTLISTED')} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors" title="Shortlist Candidate">
                                                    <Award size={14} />
                                                </button>
                                            )}
                                            {app.status === 'SHORTLISTED' && (
                                                <button onClick={() => handleQuickAction(app.id, 'APPROVED')} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors" title="Final Approve">
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            {(app.status === 'APPLIED' || app.status === 'SHORTLISTED') && (
                                                <button onClick={() => handleQuickAction(app.id, 'REJECTED')} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors" title="Reject Candidate">
                                                    <X size={14} />
                                                </button>
                                            )}
                                            <div className="w-px h-6 bg-outline-variant/20 dark:bg-slate-800 mx-1"></div>
                                            <button 
                                                onClick={() => setSelected(app)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5"
                                            >
                                                <Eye size={12} /> View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredApps.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                                                <Search size={24} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">No Applications Found</p>
                                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">There are no candidates matching your current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selected && (
                <ApplicationProfileModal 
                    application={selected} 
                    internship={selected.internship} 
                    allApplications={applications}
                    onClose={() => setSelected(null)}
                    updateStatus={async (newStatus, extra) => {
                        try {
                            const res = await api.put(`/admin/applications/${selected.id}`, { status: newStatus, ...extra });
                            if (res.data?.warning) {
                                alert(res.data.message);
                            } else {
                                alert(`Application status transitioned to ${newStatus} successfully!`);
                            }
                            fetchData(true);
                            setSelected(null);
                        } catch (err) {
                            alert('Failed to update status');
                        }
                    }}
                />
            )}

            <ExportDataModal 
                isOpen={showExportModal} 
                onClose={() => setShowExportModal(false)} 
                currentFilter={filter}
            />
        </div>
    );
};

export default HodApplications;
