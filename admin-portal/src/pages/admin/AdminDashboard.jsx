import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    Briefcase, Plus, Download, Trash2, ToggleLeft, ToggleRight,
    Users, TrendingUp, CheckCircle, Clock, ChevronRight, BarChart2, Calendar, Filter, X, FileSpreadsheet
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const StatCard = ({ icon: Icon, label, value, color, subtext, onEdit }) => (
    <div className={`glass-card bg-white/50 dark:bg-indigo-950/40 border-l-4 ${color} dark:border-white/5 premium-shadow rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300 group`}>
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 group-hover:scale-110 transition-transform shadow-sm">
                {React.createElement(Icon, { size: 24, className: "text-indigo-600 dark:text-indigo-400" })}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-indigo-400/60">{label}</span>
                {onEdit && (
                    <button onClick={onEdit} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-indigo-600">
                        <TrendingUp size={12} />
                    </button>
                )}
            </div>
        </div>
        <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 leading-none">{value}</p>
        {subtext && <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">{subtext}</p>}
    </div>
);

const ProgressBar = ({ value, max, color = 'bg-emerald-500' }) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
};

const AdvancedExportModal = ({ onClose }) => {
    const [filters, setFilters] = useState({
        internshipId: '',
        collegeName: '',
        yearOfStudy: '',
        status: 'All',
        tier: 'All'
    });
    const [allInternships, setAllInternships] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await api.get('/admin/internships');
                setAllInternships(res.data.data);
            } catch (err) {
                console.error('Failed to fetch all internships');
            } finally {
                setFetching(false);
            }
        };
        fetchAll();
    }, []);

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => {
                if (v && v !== 'All') params.append(k, v);
            });

            const res = await api.get(`/admin/applications/export/advanced?${params.toString()}`, { 
                responseType: 'blob' 
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'advanced_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            onClose();
        } catch (err) {
            alert('Export failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/10">
                <div className="bg-indigo-600 p-6 flex justify-between items-center">
                    <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <FileSpreadsheet size={20} /> Advanced Export
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Filter by Internship</label>
                        <select 
                            className="admin-input w-full font-bold"
                            value={filters.internshipId}
                            onChange={e => setFilters({...filters, internshipId: e.target.value})}
                        >
                            <option value="">All Internships</option>
                            {allInternships.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">College Name</label>
                        <input 
                            type="text"
                            placeholder="Type college name..."
                            className="admin-input w-full"
                            value={filters.collegeName}
                            onChange={e => setFilters({...filters, collegeName: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Year of Study</label>
                            <select 
                                className="admin-input w-full font-bold"
                                value={filters.yearOfStudy}
                                onChange={e => setFilters({...filters, yearOfStudy: e.target.value})}
                            >
                                <option value="">Any Year</option>
                                {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Tier / Category</label>
                            <select 
                                className="admin-input w-full font-bold"
                                value={filters.tier}
                                onChange={e => setFilters({...filters, tier: e.target.value})}
                            >
                                <option value="All">All Tiers</option>
                                {['IIT', 'NIT', 'IIIT', 'CENTRAL', 'STATE_UNIV', 'DEEMED', 'AUTONOMOUS', 'COLLEGE'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Application Status</label>
                        <select 
                            className="admin-input w-full font-bold"
                            value={filters.status}
                            onChange={e => setFilters({...filters, status: e.target.value})}
                        >
                            <option value="All">All Statuses</option>
                            {['PENDING', 'SHORTLISTED', 'HIRED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                        {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Download size={20} />}
                        Download Filtered Data
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const { lang, t } = useLanguage();
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [toggling, setToggling] = useState(null);
    const [exporting, setExporting] = useState(null);
    const [showAdvancedExport, setShowAdvancedExport] = useState(false);
    const [authorizedTotal, setAuthorizedTotal] = useState(0);
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [newTarget, setNewTarget] = useState(0);

    useEffect(() => { fetchData(); fetchConfig(); }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/admin/config');
            setAuthorizedTotal(res.data.data.authorizedTotal);
            setNewTarget(res.data.data.authorizedTotal);
        } catch (err) {
            console.error('Failed to fetch config');
        }
    };

    const handleUpdateTarget = async () => {
        try {
            const res = await api.put('/admin/config', { authorizedTotal: newTarget });
            setAuthorizedTotal(res.data.data.authorizedTotal);
            setIsEditingTarget(false);
        } catch (err) {
            alert('Failed to update authorized total');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/internships');
            // Filter only LIVE (Active AND not Expired)
            const live = res.data.data.filter(i => 
                i.isActive && (!i.applicationDeadline || new Date(i.applicationDeadline) >= new Date())
            );
            setInternships(live);
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
    const totalAllocated = internships.reduce((s, i) => {
        const rolesTotal = i.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0;
        const effectiveOpenings = i.openingsCount || rolesTotal;
        return s + effectiveOpenings;
    }, 0);
    const totalHired = internships.reduce((s, i) => s + (i.hiredCount || 0), 0);
    
    // Fallback logic for targets when Authorized Total (Global CEO Target) is 0
    const effectiveTarget = authorizedTotal > 0 ? authorizedTotal : totalAllocated;
    const unallocatedGap = authorizedTotal > 0 ? (authorizedTotal - totalAllocated) : 0;
    const netRemaining = effectiveTarget - totalHired;
    const progressPct = effectiveTarget > 0 ? Math.round((totalHired / effectiveTarget) * 100) : 0;

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

            {/* Premium Header/Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-[2.5rem] p-8 mb-6 text-white shadow-2xl relative overflow-hidden group border border-white/5 dark:border-white/10">
                {/* Decorative Blur Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner group-hover:rotate-6 transition-transform">
                            <BarChart2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-black font-rajdhani mb-1 text-white flex items-center gap-3 tracking-tight">
                                {t('dashboard.welcome') || 'WELCOME BACK,'} <span className="text-amber-400">{user?.email?.split('@')[0].toUpperCase()}</span>! 👋
                            </h1>
                            <p className="text-indigo-200/60 font-medium text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                APTRANSCO System Integrated · Admin Portal
                            </p>
                        </div>
                    </div>
                    {['ADMIN', 'CE_PRTI'].includes(user?.role) && (
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setShowAdvancedExport(true)}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-2xl transition-all backdrop-blur-md border border-white/10 flex items-center gap-2"
                            >
                                <Filter size={18} /> Advanced Export
                            </button>
                            <Link to="/internships/new" className="bg-amber-500 hover:bg-amber-400 text-indigo-950 font-black py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 group/btn">
                                <div className="p-1 bg-indigo-950/10 rounded-lg group-hover/btn:rotate-90 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                                {t('dashboard.new')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    icon={Briefcase} 
                    label="Active Internships" 
                    value={internships.length} 
                    color="border-indigo-500" 
                    subtext="Total Live Programs"
                />
                <StatCard 
                    icon={TrendingUp} 
                    label="Total Openings" 
                    value={totalAllocated} 
                    color="border-sky-500" 
                    subtext="Consolidated Intake" 
                />
                <StatCard icon={Users} label="Actual Hired" value={totalHired} color="border-emerald-500" subtext={`${progressPct}% toward ${authorizedTotal > 0 ? 'target' : 'allocation'}`} />
                <StatCard icon={Clock} label="Net Remaining" value={netRemaining} color="border-amber-500" subtext={netRemaining < 0 ? "Target Exceeded" : "Slots to be filled"} />
            </div>

            {/* Internship Table */}
            <div className="glass-card bg-white dark:bg-slate-900/60 border-black/5 dark:border-white/10 rounded-[2.5rem] premium-shadow overflow-hidden transition-all duration-500">
                <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-indigo-950/20">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4 font-rajdhani uppercase tracking-widest">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                            <Briefcase size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Internship Management
                    </h2>
                    <span className="text-[10px] bg-indigo-600 text-white px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">{internships.length} Listings</span>
                </div>

                {internships.length === 0 ? (
                    <div className="text-center py-16">
                        <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-medium">No internships created yet.</p>
                        <Link to="/internships/new" className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                            <Plus size={14} /> Create your first internship
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto px-8 pb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('dashboard.title')}</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('dashboard.status')}</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('dashboard.applications')}</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Openings</th>
                                    <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] pl-6">Fill Rate</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('dashboard.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {internships.map(int => {
                                    const rolesTotal = int.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0;
                                    const effectiveOpenings = int.openingsCount || rolesTotal;
                                    const fillPct = effectiveOpenings > 0 ? Math.round((int.hiredCount / effectiveOpenings) * 100) : 0;
                                    return (
                                        <tr key={int.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all group">
                                            <td className="py-5 pr-6">
                                                <p className="font-bold text-gray-800 dark:text-indigo-100">{int.title}</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium italic underline decoration-indigo-500/20 underline-offset-4">{int.department} · {int.location}</p>
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
                                                <span className="text-lg font-black text-gray-800 dark:text-white">{int.applicationsCount}</span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="font-bold text-gray-700 dark:text-slate-300">{int.hiredCount}</span>
                                                <span className="text-gray-300 dark:text-slate-600 mx-1">/</span>
                                                <span className="text-gray-500 dark:text-slate-400">{effectiveOpenings}</span>
                                            </td>
                                            <td className="py-5 pl-6 w-36">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <ProgressBar value={int.hiredCount} max={effectiveOpenings}
                                                            color={fillPct >= 100 ? 'bg-red-500' : fillPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 w-8 text-right underline decoration-indigo-500/20 underline-offset-4">{fillPct}%</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/internships/${int.id}/applications`}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                                                    >
                                                        Review <ChevronRight size={12} />
                                                    </Link>
                                                    {['ADMIN', 'CE_PRTI'].includes(user?.role) && (
                                                        <>
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
                                                        </>
                                                    )}
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
            {showAdvancedExport && <AdvancedExportModal onClose={() => setShowAdvancedExport(false)} />}
        </div>
    );
};

export default AdminDashboard;
