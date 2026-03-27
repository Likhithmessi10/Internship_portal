import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    BarChart2, Download, Filter, FileText, 
    PieChart, Layers, Calendar, ChevronRight,
    ArrowUpRight, Database, TrendingUp, Info, Users
} from 'lucide-react';

const PrtiReports = () => {
    const [stats, setStats] = useState({
        totalInternships: 0,
        totalApplications: 0,
        hiredPercentage: 0
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        internshipId: '',
        status: 'All',
        tier: 'All'
    });
    const [internships, setInternships] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/internships');
                const all = res.data.data || [];
                setInternships(all);
                
                const totalApps = all.reduce((acc, i) => acc + (i.applicationsCount || 0), 0);
                const totalHired = all.reduce((acc, i) => acc + (i.hiredCount || 0), 0);
                
                setStats({
                    totalInternships: all.length,
                    totalApplications: totalApps,
                    hiredPercentage: totalApps > 0 ? Math.round((totalHired / totalApps) * 100) : 0
                });
            } catch (err) {
                console.error('Failed to fetch reports data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAdvancedExport = () => {
        const queryParams = new URLSearchParams();
        if (filters.internshipId) queryParams.append('internshipId', filters.internshipId);
        if (filters.status !== 'All') queryParams.append('status', filters.status);
        if (filters.tier !== 'All') queryParams.append('tier', filters.tier);

        window.open(`${api.defaults.baseURL}/admin/applications/export/advanced?${queryParams.toString()}`, '_blank');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Analytics Dashboard</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Institutional Reports</h2>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs font-bold text-primary hover:bg-surface-container-high transition-all uppercase tracking-widest shadow-sm">
                        <TrendingUp size={14} /> Forecast Mode
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold tracking-widest hover:opacity-90 shadow-premium uppercase transition-all">
                        <Database size={14} /> Master Sync
                    </button>
                </div>
            </header>

            {/* Quick Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm group">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <Layers size={24} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-outline block mb-1">Cycle Aggregation</span>
                    <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.totalInternships} Active Programs</h2>
                    <p className="text-[10px] font-medium text-outline mt-2 leading-relaxed italic">Across all specialized institutional departments</p>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                        <BarChart2 size={24} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-outline block mb-1">Global Applicants</span>
                    <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.totalApplications.toLocaleString()} Total Talent Pool</h2>
                    <p className="text-[10px] font-medium text-outline mt-2 leading-relaxed italic">Cumulative applications received for 2024 academic year</p>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                        <PieChart size={24} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-outline block mb-1">Success Yield</span>
                    <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.hiredPercentage}% Selection Rate</h2>
                    <p className="text-[10px] font-medium text-outline mt-2 leading-relaxed italic">Merit-based conversion from initial application pool</p>
                </div>
            </section>

            {/* Dynamic Export Generator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <section className="lg:col-span-2 space-y-8">
                    <div className="bg-surface-container-low p-10 rounded-4xl border border-outline-variant/20 shadow-premium relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-primary tracking-tight mb-4">Export Engine</h3>
                            <p className="text-xs font-medium text-outline mb-10 max-w-lg leading-relaxed italic border-l-4 border-primary/20 pl-4 uppercase tracking-[0.05em]">Generate dynamic institutional reports with synchronized student data, role assignments, and recruitment timelines.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">Target Program</label>
                                    <select 
                                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 shadow-subtle appearance-none cursor-pointer group"
                                        value={filters.internshipId}
                                        onChange={(e) => setFilters({...filters, internshipId: e.target.value})}
                                    >
                                        <option value="">All Institutional Programs</option>
                                        {internships.map(i => <option key={i.id} value={i.id}>{i?.title || 'Untitled'}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">Talent Tier</label>
                                    <select 
                                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 shadow-subtle appearance-none cursor-pointer"
                                        value={filters.tier}
                                        onChange={(e) => setFilters({...filters, tier: e.target.value})}
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="IIT">IIT Tier</option>
                                        <option value="NIT">NIT Tier</option>
                                        <option value="IIIT">IIIT Tier</option>
                                        <option value="STATE">State Govt</option>
                                        <option value="PRIVATE">Private University</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 italic">Recruitment Status</label>
                                    <select 
                                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 shadow-subtle appearance-none cursor-pointer"
                                        value={filters.status}
                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    >
                                        <option value="All">All Stages</option>
                                        <option value="HIRED">Successfully Hired</option>
                                        <option value="PENDING">Under Review</option>
                                        <option value="SHORTLISTED">Interview Phase</option>
                                        <option value="REJECTED">Archived</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={handleAdvancedExport}
                                        className="w-full bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-container shadow-premium transition-all flex items-center justify-center gap-3"
                                    >
                                        <Download size={18} /> Download Data <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                    </div>
                </section>

                <aside className="space-y-8">
                    <div className="bg-surface-container-lowest p-8 rounded-4xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline mb-8 border-b border-outline-variant/10 pb-4 italic">Standard Reports</h4>
                            <div className="space-y-6">
                                <button className="w-full flex items-center justify-between group/link">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-all shadow-sm">
                                            <FileText size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-primary uppercase tracking-widest">General Audit</p>
                                            <p className="text-[9px] font-bold text-outline opacity-60">Complete system snapshot</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-outline group-hover/link:translate-x-1 transition-transform" />
                                </button>
                                <button className="w-full flex items-center justify-between group/link">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-all shadow-sm">
                                            <Users size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-primary uppercase tracking-widest">Diversity Index</p>
                                            <p className="text-[9px] font-bold text-outline opacity-60">Quota & category analysis</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-outline group-hover/link:translate-x-1 transition-transform" />
                                </button>
                                <button className="w-full flex items-center justify-between group/link">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-all shadow-sm">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-primary uppercase tracking-widest">Timeline Report</p>
                                            <p className="text-[9px] font-bold text-outline opacity-60">Cycle duration & performance</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-outline group-hover/link:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-surface-container-low rounded-4xl flex items-center gap-4 border border-outline-variant/10 group cursor-help transition-all hover:bg-surface-container-high">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-premium">
                            <Info size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Documentation</p>
                            <p className="text-[9px] font-medium text-outline opacity-70 leading-relaxed mt-1">Learn about our merit-based deterministic allocation logic.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PrtiReports;
