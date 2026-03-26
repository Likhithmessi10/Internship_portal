import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
    Briefcase, Plus, Download, Trash2, ToggleLeft, ToggleRight,
    Users, TrendingUp, CheckCircle, Clock, ChevronRight, BarChart2, Calendar, Filter, X, FileSpreadsheet, Video
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

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

const CommitteeModal = ({ internship, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prtiUsers, setPrtiUsers] = useState([]);
    const [data, setData] = useState({ meetLink: '', interviewDate: '', prtiMemberId: '' });

    useEffect(() => {
        const fetchCommitteeAndUsers = async () => {
            try {
                // Fetch PRTI users for dropdown
                const usersRes = await api.get('/admin/users?role=CE_PRTI');
                setPrtiUsers(usersRes.data.data || []);

                // Fetch existing committee
                const res = await api.get(`/admin/internships/${internship.id}/committee`);
                if (res.data && res.data.data) {
                    const c = res.data.data;
                    let parsedMembers = {};
                    try { parsedMembers = typeof c.membersData === 'string' ? JSON.parse(c.membersData) : (c.membersData || {}); } catch(e) {}
                    
                    setData({
                        meetLink: c.meetLink || '',
                        interviewDate: c.interviewDate ? new Date(new Date(c.interviewDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
                        prtiMemberId: parsedMembers.prtiMemberId || ''
                    });
                }
            } catch (err) {
                console.error('No committee found or error fetch', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommitteeAndUsers();
    }, [internship.id]);

    const handleSave = async () => {
        if (!data.prtiMemberId) {
            alert('Please select a PRTI Committee Member.');
            return;
        }

        setSaving(true);
        try {
            await api.put(`/admin/internships/${internship.id}/committee`, {
                meetLink: data.meetLink,
                interviewDate: data.interviewDate,
                membersData: { prtiMemberId: data.prtiMemberId }
            });
            alert('Committee Saved successfully!');
            onClose();
        } catch (err) {
            alert('Failed to save committee');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
                <div className="bg-sky-600 p-6 flex justify-between items-center">
                    <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <Video size={20} /> Interview Committee
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                {loading ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Details...</p>
                    </div>
                ) : (
                    <div className="p-8 space-y-5">
                        <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl border border-sky-100 dark:border-sky-500/20">
                            <p className="text-sm font-black text-sky-900 dark:text-sky-300 mb-1">{internship.title}</p>
                            <p className="text-xs text-sky-700 dark:text-sky-400 font-medium leading-relaxed">Set up the evaluation committee and schedule the interview google meet.</p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">PRTI Committee Member <span className="text-red-500">*</span></label>
                            <select 
                                value={data.prtiMemberId} 
                                onChange={e => setData({...data, prtiMemberId: e.target.value})} 
                                className="admin-input w-full bg-slate-50 dark:bg-slate-800 font-bold"
                            >
                                <option value="">-- Select PRTI Member --</option>
                                {prtiUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name || u.email.split('@')[0]} (PRTI)</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-400 font-medium px-2 mt-1">
                                Note: The 3-member committee will automatically include the HOD ({internship.department}) and the specific Mentor assigned to each applicant.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Google Meet Link</label>
                            <div className="relative">
                                <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" size={16} />
                                <input type="url" value={data.meetLink} onChange={e => setData({...data, meetLink: e.target.value})} placeholder="https://meet.google.com/..." className="admin-input w-full pl-11 bg-slate-50 dark:bg-slate-800" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Interview Date & Time</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                                <input type="datetime-local" value={data.interviewDate} onChange={e => setData({...data, interviewDate: e.target.value})} className="admin-input w-full pl-11 bg-slate-50 dark:bg-slate-800 font-bold" />
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 mt-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-sky-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {saving ? <><span className="animate-spin w-4 h-4 border-2 border-white/60 border-t-white rounded-full"></span> Saving...</> : 'Save Committee Details'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const PrtiDashboard = () => {
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
    const [committeeModalData, setCommitteeModalData] = useState(null);

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

            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Institutional Coordination</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">PRTI Admin Dashboard</h2>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowAdvancedExport(true)}
                        className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors"
                    >
                        <Download size={16} /> Advanced Export
                    </button>
                    <Link to="/internships/new" className="bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                        <Plus size={16} /> New Internship
                    </Link>
                </div>
            </section>

            {/* Bento Grid Stats */}
            <section className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Prgram Performance Index</h3>
                        <div className="flex gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-2 text-sky-600"><span className="w-2 h-2 rounded-full bg-sky-600"></span> APPLICANTS</span>
                            <span className="flex items-center gap-2 text-primary"><span className="w-2 h-2 rounded-full bg-primary"></span> HIRED</span>
                        </div>
                    </div>
                    <div className="h-40 flex items-end justify-between gap-6 px-4">
                        {internships.slice(0, 8).map((int) => {
                            const rolesTotal = int.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0;
                            const total = int.openingsCount || rolesTotal;
                            const h1 = total > 0 ? (int.hiredCount / total) * 100 : 0;
                            const h2 = total > 0 ? (int.applicationsCount / (total * 5)) * 100 : 0;
                            return (
                                <div key={int.id} className="flex-1 bg-surface-container-high rounded-t-lg relative group h-full">
                                    <div className="absolute bottom-0 w-full bg-sky-100 rounded-t-lg" style={{ height: `${Math.min(100, h2)}%` }}></div>
                                    <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-lg" style={{ height: `${Math.min(100, h1)}%` }}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 bg-primary-container p-6 rounded-xl text-on-primary-container flex flex-col justify-between">
                    <div>
                         <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">Global Fulfillment</span>
                         <div className="flex items-end justify-between mt-2">
                            <div className="text-4xl font-extrabold text-white">{totalHired}</div>
                            <div className="text-xl font-medium text-white/50 pb-1">/ {effectiveTarget}</div>
                         </div>
                    </div>
                    <div className="mt-6">
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white h-full" style={{ width: `${progressPct}%` }}></div>
                        </div>
                        <p className="text-[9px] mt-2 opacity-60 font-medium">Institutional Target Status</p>
                    </div>
                </div>
            </section>

            {/* Internship Management Table - Stitch Style */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Master Internship Directory</h3>
                        <p className="text-[10px] text-outline font-medium mt-0.5">Overseeing {internships.length} institutional recruitment cycles</p>
                    </div>
                    <div className="flex gap-2">
                         <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">filter_list</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-high/30">
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Program Details</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Applicants</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Fill Rate</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Coordination</th>
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
                                                    <span className="material-symbols-outlined">account_balance</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-primary">{int.title}</p>
                                                    <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-0.5">{int.department} • {int.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-sm font-bold text-primary">{int.applicationsCount}</span>
                                                <span className="text-[9px] text-outline font-bold uppercase tracking-tighter">Pool Size</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex flex-col items-baseline gap-1">
                                                <span className="text-sm font-bold text-primary">{fillPct}%</span>
                                                <div className="w-16 bg-surface-container-high h-1 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full" style={{ width: `${fillPct}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setCommitteeModalData(int)}
                                                    className="bg-surface-container-high text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-xs">groups</span> Committee
                                                </button>
                                                <button
                                                    onClick={() => handleExport(int.id, int.title)}
                                                    className="p-2 text-outline hover:text-green-600 rounded transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-lg">download</span>
                                                </button>
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
            {committeeModalData && (
                <CommitteeModal internship={committeeModalData} onClose={() => setCommitteeModalData(null)} />
            )}
        </div>
    );
};

export default PrtiDashboard;
