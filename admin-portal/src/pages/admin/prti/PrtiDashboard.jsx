import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { 
    TrendingUp, Users, Briefcase, AlertCircle, 
    RefreshCw, CheckCircle, ChevronRight, Filter,
    Activity, ShieldCheck, Terminal, Database, Shield
} from 'lucide-react';

const PrtiDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalDepts: 14,
        activeInterns: 0,
        activePrograms: 0,
        pendingApps: 0
    });
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [intRes, internsRes] = await Promise.all([
                    api.get('/admin/internships'),
                    api.get('/admin/interns/all')
                ]);

                const allInts = intRes.data.data || [];
                const liveInts = allInts.filter(i => i.isActive);
                const allInterns = internsRes.data.data || [];
                
                setInternships(allInts);
                setStats({
                    totalDepts: 16, // Based on config
                    activeInterns: allInterns.length,
                    activePrograms: liveInts.length,
                    pendingApps: allInts.reduce((acc, i) => acc + (i.applicationsCount || 0), 0)
                });
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Institutional Coordination</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">PRTI Admin Dashboard</h2>
                </div>
                <div className="flex gap-4">
                    <Link to="/prti/reports" className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs font-bold text-primary hover:bg-surface-container-high transition-all">
                        <span className="material-symbols-outlined text-sm">download</span> Advanced Export
                    </Link>
                    <Link to="/internships/new" className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold tracking-widest hover:opacity-90 shadow-md transition-all uppercase">
                        <span className="material-symbols-outlined text-sm">add</span> New Internship
                    </Link>
                </div>
            </header>

            {/* Metrics Bento Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between hover:shadow-md transition-all group">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-outline block mb-2">Total Departments</span>
                        <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.totalDepts}</h2>
                    </div>
                    <div className="mt-4 flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        <TrendingUp size={12} className="mr-1" />
                        <span>Corporate Structure</span>
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between hover:shadow-md transition-all group">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-outline block mb-2">Active Interns</span>
                        <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.activeInterns}</h2>
                    </div>
                    <div className="mt-4 flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        <CheckCircle size={12} className="mr-1" />
                        <span>Onboarded Talent</span>
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between hover:shadow-md transition-all group">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-outline block mb-2">Active Programs</span>
                        <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.activePrograms}</h2>
                    </div>
                    <div className="mt-4 flex items-center text-[10px] text-sky-600 font-bold uppercase tracking-wider">
                        <Activity size={12} className="mr-1" />
                        <span>Running Cycles</span>
                    </div>
                </div>
                <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/10 flex flex-col justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-primary/60 block mb-2">Pending Pool</span>
                        <h2 className="text-4xl font-black text-primary tracking-tighter">{stats.pendingApps}</h2>
                    </div>
                    <div className="relative z-10 mt-4 flex items-center text-[10px] text-primary font-bold uppercase tracking-wider">
                        <AlertCircle size={12} className="mr-1" />
                        <span>Needs HOD Review</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                </div>
            </section>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h3 className="text-xl font-black text-primary tracking-tight">Master Internship Directory</h3>
                            <p className="text-xs font-medium text-outline">Overseeing {internships.length} Institutional recruitment cycles</p>
                        </div>
                        <button className="text-outline hover:text-primary transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>

                    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Program Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-center">Applicants</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-center">Fill Rate</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Coordination</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {internships.slice(0, 5).map(int => {
                                    const fillRate = int.openingsCount > 0 ? (int.hiredCount / int.openingsCount) * 100 : 0;
                                    return (
                                        <tr key={int.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined">account_balance</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{int.title}</p>
                                                        <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">{int.location || 'VARIOUS LOCATIONS'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-primary">{int.applicationsCount}</span>
                                                    <span className="text-[9px] font-bold text-outline uppercase tracking-widest">Pool Size</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-24 mx-auto">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-primary">{Math.round(fillRate)}%</span>
                                                    </div>
                                                    <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                                                        <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${fillRate}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container-high text-[10px] font-bold text-primary rounded-lg transition-all uppercase tracking-widest">
                                                       <Users size={12} /> Committee
                                                    </button>
                                                    <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-outline transition-colors"><span className="material-symbols-outlined text-lg">download</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between">
                            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Showing {Math.min(5, internships.length)} of {internships.length} Cycles</span>
                            <div className="flex gap-4">
                                <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Previous</button>
                                <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Next</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar Cards */}
                <aside className="space-y-8">
                    <div>
                        <h3 className="text-xl font-black text-primary tracking-tight mb-6">Portal Infrastructure</h3>
                        <div className="space-y-4">
                            <Link to="/prti/permissions" className="p-4 bg-surface-container-low rounded-2xl hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-outline-variant/30 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                    <Shield size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-primary">Role Permissions</h4>
                                    <p className="text-[10px] text-outline font-medium leading-tight opacity-60">Modify hierarchy and access tokens for PRTI Admin roles.</p>
                                </div>
                                <ChevronRight size={14} className="text-outline/30 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/prti/health" className="p-4 bg-surface-container-low rounded-2xl hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-outline-variant/30 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                    <Terminal size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-primary">System Health</h4>
                                    <p className="text-[10px] text-outline font-medium leading-tight opacity-60">Run automated checks and monitor backend synchronization.</p>
                                </div>
                                <ChevronRight size={14} className="text-outline/30 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/prti/audit-logs" className="p-4 bg-surface-container-low rounded-2xl hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-outline-variant/30 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                    <Database size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-primary">Audit Logs</h4>
                                    <p className="text-[10px] text-outline font-medium leading-tight opacity-60">Full traceability of all administrative actions and events.</p>
                                </div>
                                <ChevronRight size={14} className="text-outline/30 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-primary p-6 rounded-2xl text-white relative overflow-hidden shadow-lg">
                        <div className="relative z-10">
                            <h4 className="text-lg font-black mb-2 flex items-center gap-2">
                                <CheckCircle size={20} className="text-emerald-400" /> System Optimal
                            </h4>
                            <div className="w-full bg-white/10 h-1 rounded-full mb-4">
                                <div className="bg-emerald-400 h-full w-[98%] rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                            </div>
                            <p className="text-[10px] font-medium text-white/70 mb-4 leading-relaxed italic">Last server synchronization was successful. Global services are operational.</p>
                            <button className="w-full py-2 bg-white/10 border border-white/20 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-primary transition-all">
                                Diagnostics Panel
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PrtiDashboard;
