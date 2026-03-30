import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
    TrendingUp, Users, Briefcase, AlertCircle,
    Filter, Activity, Trash2, CheckCircle
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

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This will delete all applications and related data. This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/admin/internships/${id}`);
            setInternships(prev => prev.filter(i => i.id !== id));
            // Update stats
            setStats(prev => ({
                ...prev,
                activePrograms: prev.activePrograms - 1
            }));
        } catch (err) {
            console.error('Failed to delete internship', err);
            alert(err.response?.data?.message || 'Failed to delete internship');
        }
    };

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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-outline-variant/10 dark:border-white/5 flex flex-col justify-between hover:shadow-md transition-all group">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-outline dark:text-slate-400 block mb-2">Total Departments</span>
                        <h2 className="text-4xl font-black text-primary dark:text-white tracking-tighter">{stats.totalDepts}</h2>
                    </div>
                    <div className="mt-4 flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        <TrendingUp size={12} className="mr-1" />
                        <span>Corporate Structure</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-outline-variant/10 dark:border-white/5 flex flex-col justify-between hover:shadow-md transition-all group">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-outline dark:text-slate-400 block mb-2">Active Interns</span>
                        <h2 className="text-4xl font-black text-primary dark:text-white tracking-tighter">{stats.activeInterns}</h2>
                    </div>
                    <div className="mt-4 flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <CheckCircle size={12} className="mr-1" />
                        <span>Onboarded Talent</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-outline-variant/10 dark:border-white/5 flex flex-col justify-between hover:shadow-md transition-all group">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-outline dark:text-slate-400 block mb-2">Active Programs</span>
                        <h2 className="text-4xl font-black text-primary dark:text-white tracking-tighter">{stats.activePrograms}</h2>
                    </div>
                    <div className="mt-4 flex items-center text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
                        <Activity size={12} className="mr-1" />
                        <span>Running Cycles</span>
                    </div>
                </div>
                <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border-2 border-primary/10 dark:border-primary/20 flex flex-col justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-primary/60 dark:text-primary/40 block mb-2">Pending Pool</span>
                        <h2 className="text-4xl font-black text-primary dark:text-white tracking-tighter">{stats.pendingApps}</h2>
                    </div>
                    <div className="relative z-10 mt-4 flex items-center text-[10px] text-primary dark:text-primary/60 font-bold uppercase tracking-wider">
                        <AlertCircle size={12} className="mr-1" />
                        <span>Needs HOD Review</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 dark:bg-primary/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                </div>
            </section>

            {/* Main Content Area */}
            <section className="space-y-6">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">Master Internship Directory</h3>
                        <p className="text-xs font-medium text-outline dark:text-slate-400">Overseeing {internships.length} Institutional recruitment cycles</p>
                    </div>
                    <button className="text-outline hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 dark:border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low dark:bg-slate-700 border-b border-outline-variant/20 dark:border-white/5">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline dark:text-slate-300">Program Details</th>
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
                                                <Link
                                                    to="/committees"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container-high text-[10px] font-bold text-primary rounded-lg transition-all uppercase tracking-widest no-underline"
                                                >
                                                    <Users size={12} /> Committee
                                                </Link>
                                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-outline transition-colors"><span className="material-symbols-outlined text-lg">download</span></button>
                                                <button
                                                    onClick={() => handleDelete(int.id, int.title)}
                                                    className="p-1.5 hover:bg-error/10 rounded-lg text-outline hover:text-error transition-colors"
                                                    title="Delete Internship"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
        </div>
    );
};

export default PrtiDashboard;
