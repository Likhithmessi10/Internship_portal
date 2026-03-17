import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import {
    Briefcase, Download, Trash2, ToggleLeft, ToggleRight,
    Users, CheckCircle, ChevronRight, BarChart2, Calendar, ArrowLeft, History
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <div className={`glass-card bg-white/50 dark:bg-slate-900/60 border-l-4 ${color} dark:border-white/5 premium-shadow rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300 group shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 group-hover:scale-110 transition-transform shadow-sm">
                {React.createElement(Icon, { size: 24, className: "text-indigo-600 dark:text-indigo-400" })}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-indigo-400/60">{label}</span>
        </div>
        <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 leading-none">{value}</p>
        {subtext && <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">{subtext}</p>}
    </div>
);

const AdminPastInternships = () => {
    const navigate = useNavigate();
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
            // Filter only INACTIVE or EXPIRED internships
            const past = res.data.data.filter(i => 
                !i.isActive || (i.applicationDeadline && new Date(i.applicationDeadline) < new Date())
            );
            setInternships(past);
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

    const handleExport = async (id, title) => {
        setExporting(id);
        try {
            const res = await api.get(`/admin/internships/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}_applications.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Failed to export applications.');
        } finally {
            setExporting(null);
        }
    };

    const totalApplications = internships.reduce((s, i) => s + (i.applicationsCount || 0), 0);
    const totalHired = internships.reduce((s, i) => s + (i.hiredCount || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading past archives...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Premium Header/Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-[2.5rem] p-10 mb-8 text-white shadow-2xl relative overflow-hidden group border border-white/5 dark:border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/admin/dashboard')} className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner hover:bg-white/20 transition-all hover:rotate-6">
                            <ArrowLeft className="w-6 h-6 text-white" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black font-rajdhani mb-1 text-white uppercase tracking-tighter">
                                Past <span className="text-amber-400">Internships</span>
                            </h1>
                            <p className="text-indigo-200/70 font-medium text-lg tracking-wide uppercase text-[12px] font-bold tracking-[0.3em]">
                                Archived internship listings for reference and reporting
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={Briefcase} label="Closed Listings" value={internships.length} color="border-gray-500" subtext="archived programs" />
                <StatCard icon={Users} label="Final Applications" value={totalApplications} color="border-sky-500" subtext="historical data" />
                <StatCard icon={CheckCircle} label="Total Hired" value={totalHired} color="border-emerald-500" subtext="hiring success" />
            </div>

            {/* Archive Table Container */}
            <div className="glass-card bg-white dark:bg-slate-900/60 border-black/5 dark:border-white/10 rounded-[2.5rem] premium-shadow overflow-hidden transition-all duration-500">
                <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-indigo-950/20">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4 font-rajdhani uppercase tracking-widest">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                            <History size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Archive Management
                    </h2>
                    <span className="text-[10px] bg-indigo-600 text-white px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">{internships.length} Archived</span>
                </div>

                {internships.length === 0 ? (
                    <div className="text-center py-16">
                        <History size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-medium">No past internships found yet.</p>
                    </div>
                ) : (
                <div className="overflow-x-auto px-8 pb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Internship</th>
                                <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Applications</th>
                                <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Final Hiring</th>
                                <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {internships.map(int => (
                                    <tr key={int.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all group font-medium">
                                        <td className="py-5 pr-6">
                                            <p className="font-bold text-gray-800 dark:text-indigo-100">{int.title}</p>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-widest">{int.department} · {int.location}</p>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${int.isActive ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${int.isActive ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
                                                {int.isActive ? 'Expired' : 'Directly Closed'}
                                            </span>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className="text-lg font-black text-gray-900 dark:text-white">{int.applicationsCount}</span>
                                        </td>
                                        <td className="py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-emerald-600 dark:text-emerald-400">{int.hiredCount}</span>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase">of {int.openingsCount} hired</span>
                                            </div>
                                        </td>
                                        <td className="py-5 pr-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    to={`/admin/internships/${int.id}/applications`}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
                                                >
                                                    Review <ChevronRight size={12} />
                                                </Link>
                                                <button
                                                    onClick={() => handleExport(int.id, int.title)}
                                                    disabled={exporting === int.id}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Export Excel"
                                                >
                                                    <Download size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggle(int.id)}
                                                    disabled={toggling === int.id}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Re-open applications"
                                                >
                                                    <ToggleLeft size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(int.id, int.title)}
                                                    disabled={deleting === int.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete permanently"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                    </table>
                </div>
                )}
            </div>
        </div>
    );
};

export default AdminPastInternships;
