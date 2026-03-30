import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    Briefcase, Plus, Download, Trash2, ToggleLeft, ToggleRight,
    Users, TrendingUp, CheckCircle, Clock, ChevronRight, BarChart2, Calendar, Filter, X, FileSpreadsheet, Settings, Building2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import StatsDetailModal from '../../components/ui/StatsDetailModal';

const StatCard = ({ icon: Icon, label, value, color, subtext, onEdit }) => (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-8 shadow-sm transition-all hover:translate-y-[-2px]">
        <div className="flex items-center justify-between mb-6">
            <div className="shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">
                    {Icon === Briefcase ? 'work' : 
                     Icon === Users ? 'group' : 
                     Icon === TrendingUp ? 'trending_up' : 
                     Icon === CheckCircle ? 'verified' : 
                     Icon === Clock ? 'schedule' : 'query_stats'}
                </span>
            </div>
            {onEdit && (
                <button onClick={onEdit} className="p-1.5 hover:bg-surface-container-high rounded transition-colors text-outline">
                    <span className="material-symbols-outlined text-sm">edit</span>
                </button>
            )}
        </div>
        <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">{label}</span>
            <p className="text-4xl font-black text-primary tracking-tighter leading-none">{value}</p>
            {subtext && <p className="text-[10px] font-bold uppercase tracking-widest text-outline/50 mt-2">{subtext}</p>}
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/20 backdrop-blur-md">
            <div className="bg-surface-container-low rounded-xl w-full max-w-lg overflow-hidden shadow-2xl border border-outline-variant/10">
                <div className="bg-white border-b border-outline-variant/10 px-8 py-6 flex justify-between items-center text-primary">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined">file_export</span>
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Institutional Export</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-8 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Filter by Internship</label>
                        <select 
                            className="w-full bg-white border border-outline-variant/20 rounded px-4 py-3 text-xs font-bold text-primary focus:outline-primary"
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

const DepartmentsModal = ({ onClose }) => {
    const [departments, setDepartments] = useState([]);
    const [newDept, setNewDept] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/admin/config');
                setDepartments(res.data.data.departments || []);
            } catch (err) {
                console.error('Failed to fetch departments');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleAdd = async () => {
        const val = newDept.trim();
        if (!val || departments.includes(val)) return;
        setSaving(true);
        try {
            const updated = [...departments, val];
            await api.put('/admin/config', { departments: updated });
            setDepartments(updated);
            setNewDept('');
        } catch (err) {
            alert('Failed to add department');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (dept) => {
        if (!window.confirm(`Are you sure you want to remove "${dept}"? Users will no longer be able to select it.`)) return;
        setSaving(true);
        try {
            const updated = departments.filter(d => d !== dept);
            await api.put('/admin/config', { departments: updated });
            setDepartments(updated);
        } catch (err) {
            alert('Failed to remove department');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/20 backdrop-blur-md">
            <div className="bg-surface-container-low rounded-xl w-full max-w-lg overflow-hidden shadow-2xl border border-outline-variant/10 animate-fade-in-up">
                <div className="bg-white border-b border-outline-variant/10 px-8 py-6 flex justify-between items-center text-primary">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">corporate_fare</span>
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Institutional Units</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {loading ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Settings...</p>
                    </div>
                ) : (
                    <div className="p-8 space-y-6">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20">
                            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium leading-relaxed">
                                Manage the list of official APTRANSCO departments. These options appear during account registration and internship creation.
                            </p>
                        </div>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="New Department Name..."
                                className="admin-input flex-1 font-bold bg-slate-50 dark:bg-slate-800"
                                value={newDept}
                                onChange={e => setNewDept(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                disabled={saving}
                            />
                            <button 
                                onClick={handleAdd}
                                disabled={saving || !newDept.trim()}
                                className="px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>

                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                            {departments.map((dept, i) => (
                                <div key={i} className="flex flex-row justify-between items-center p-3 px-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl group hover:border-purple-200 transition-colors">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{dept}</span>
                                    <button 
                                        onClick={() => handleRemove(dept)}
                                        disabled={saving}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
    const [showDepartments, setShowDepartments] = useState(false);
    const [authorizedTotal, setAuthorizedTotal] = useState(0);
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [newTarget, setNewTarget] = useState(0);
    const [allInterns, setAllInterns] = useState([]);
    const [allApps, setAllApps] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedStat, setSelectedStat] = useState(null);

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
            const [intRes, appsRes, internsRes, configRes] = await Promise.all([
                api.get('/admin/internships'),
                api.get('/admin/applications'),
                api.get('/admin/interns/all'),
                api.get('/admin/config')
            ]);

            const allInts = intRes.data.data || [];
            const live = allInts.filter(i => 
                i.isActive && (!i.applicationDeadline || new Date(i.applicationDeadline) >= new Date())
            );
            
            setInternships(live);
            setAllApps(appsRes.data.data || []);
            setAllInterns(internsRes.data.data || []);
            setDepartments(configRes.data.data?.departments || []);
            setAuthorizedTotal(configRes.data.data?.authorizedTotal || 0);
            setNewTarget(configRes.data.data?.authorizedTotal || 0);
        } catch (err) {
            console.error('Failed to fetch data', err);
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

            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Institutional Overview</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Super Admin Dashboard</h2>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowAdvancedExport(true)}
                        className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors"
                    >
                        <Download size={16} /> Advanced Export
                    </button>
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={() => setShowDepartments(true)}
                            className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors"
                        >
                            <Building2 size={16} /> Departments
                        </button>
                    )}
                    <Link to="/internships/new" className="bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                        <Plus size={16} /> New Internship
                    </Link>
                </div>
            </section>

            {/* Bento Grid Stats */}
            <section className="grid grid-cols-12 gap-6">
                {/* Main Progress Metric */}
                <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Intake Performance Index</h3>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-sky-600"><span className="w-2 h-2 rounded-full bg-sky-600"></span> APPLICATIONS</span>
                            <span className="flex items-center gap-2 text-[10px] font-bold text-secondary text-primary"><span className="w-2 h-2 rounded-full bg-primary"></span> HIRED</span>
                        </div>
                    </div>
                    <div className="h-48 flex items-end justify-between gap-6 px-4">
                        {internships.slice(0, 7).map((int, idx) => {
                            const rolesTotal = int.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0;
                            const total = int.openingsCount || rolesTotal;
                            const hiredHeight = total > 0 ? (int.hiredCount / total) * 100 : 0;
                            const appHeight = total > 0 ? (int.applicationsCount / (total * 5)) * 100 : 0; // scaled
                            
                            return (
                                <div key={int.id} className="flex-1 bg-surface-container-high rounded-t-lg relative group h-full">
                                    <div 
                                        className="absolute bottom-0 w-full bg-sky-200 dark:bg-sky-900/40 rounded-t-lg transition-all group-hover:bg-sky-300" 
                                        style={{ height: `${Math.min(100, appHeight)}%` }}
                                    ></div>
                                    <div 
                                        className="absolute bottom-0 w-full bg-primary/40 dark:bg-primary/60 rounded-t-lg transition-all group-hover:bg-primary/60"
                                        style={{ height: `${Math.min(100, hiredHeight)}%` }}
                                    ></div>
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-bold text-outline text-center uppercase tracking-tighter w-full truncate px-1">
                                        {int.title.split(' ')[0]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Secondary Metrics Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
                    <button 
                        onClick={() => setSelectedStat({ 
                            title: 'Hired Institutional Talent', 
                            type: 'INTERNS', 
                            data: allInterns 
                        })}
                        className="bg-primary-container p-6 rounded-xl text-on-primary-container flex flex-col justify-between h-full hover:shadow-xl hover:-translate-y-1 transition-all group text-left w-full"
                    >
                        <div>
                            <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">Total Intake Goal</span>
                            <div className="flex items-center justify-between mt-1 group-hover:translate-x-1 transition-transform">
                                <div className="text-4xl font-extrabold text-white">{totalHired}</div>
                                <div className="text-xl font-medium text-white/50">/ {effectiveTarget}</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-medium">Fulfillment Rate</span>
                                <span className="text-[10px] font-bold">{progressPct}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${progressPct}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-[9px] opacity-60 font-medium uppercase tracking-widest">Global Institutional Target</p>
                                <span className="material-symbols-outlined text-sm opacity-40 group-hover:opacity-100 transition-opacity">open_in_new</span>
                            </div>
                        </div>
                    </button>
                </div>
            </section>

            {/* Internship Management Table - Stitch Style */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Active Internship Programs</h3>
                        <p className="text-[10px] text-outline font-medium mt-0.5">Managing {internships.length} live recruitment cycles</p>
                    </div>
                    <div className="flex gap-2">
                         <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">filter_list</span>
                         <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">more_vert</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-high/30">
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Program Details</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Lifecycle</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Applicants</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Fill Rate</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {internships.map(int => {
                                const rolesTotal = int.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0;
                                const total = int.openingsCount || rolesTotal;
                                const fillPct = total > 0 ? Math.round((int.hiredCount / total) * 100) : 0;
                                const isExpired = int.applicationDeadline && new Date(int.applicationDeadline) < new Date();

                                return (
                                    <tr key={int.id} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined">work</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-primary">{int.title}</p>
                                                    <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-0.5">
                                                        {int.department} • {int.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${int.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {int.isActive ? 'Active' : 'Paused'}
                                                </span>
                                                {int.applicationDeadline && (
                                                    <span className={`text-[9px] mt-1 font-bold ${isExpired ? 'text-error' : 'text-outline'}`}>
                                                        {isExpired ? 'EXPIRED' : `DUE: ${new Date(int.applicationDeadline).toLocaleDateString()}`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-sm font-bold text-primary">{int.applicationsCount}</span>
                                                <span className="text-[9px] text-outline font-bold uppercase tracking-tighter">Submitted</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center w-32 mx-auto">
                                                <div className="flex justify-between w-full mb-1">
                                                    <span className="text-[9px] font-bold text-outline">{int.hiredCount}/{total}</span>
                                                    <span className="text-[9px] font-bold text-primary">{fillPct}%</span>
                                                </div>
                                                <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-500 ${fillPct >= 100 ? 'bg-primary' : 'bg-sky-500'}`} style={{ width: `${fillPct}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    to={`/internships/${int.id}/applications`}
                                                    className="p-1 text-outline hover:text-primary hover:bg-surface-container-high rounded transition-all"
                                                    title="Review Applications"
                                                >
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </Link>
                                                {['ADMIN', 'CE_PRTI'].includes(user?.role) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggle(int.id)}
                                                            className={`p-1 rounded transition-all ${int.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                                                            title={int.isActive ? 'Suspend Program' : 'Activate Program'}
                                                        >
                                                            <span className="material-symbols-outlined text-lg">{int.isActive ? 'pause_circle' : 'play_circle'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleExport(int.id, int.title)}
                                                            className="p-1 text-outline hover:text-green-600 hover:bg-green-50 rounded transition-all"
                                                            title="Institutional Export"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">download</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(int.id, int.title)}
                                                            className="p-1 text-outline hover:text-error hover:bg-error/5 rounded transition-all"
                                                            title="Purge Record"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
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
            </div>

            {showAdvancedExport && <AdvancedExportModal onClose={() => setShowAdvancedExport(false)} />}
            {showDepartments && <DepartmentsModal onClose={() => setShowDepartments(false)} />}

            {selectedStat && (
                <StatsDetailModal
                    title={selectedStat.title}
                    type={selectedStat.type}
                    data={selectedStat.data}
                    onClose={() => setSelectedStat(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
