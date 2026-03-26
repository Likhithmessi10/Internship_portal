import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
    Briefcase, Users, CheckCircle, ChevronRight, Star
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <div className={`glass-card bg-white/50 dark:bg-indigo-950/40 border-l-4 ${color} dark:border-white/5 premium-shadow rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300 group`}>
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 group-hover:scale-110 transition-transform shadow-sm">
                {React.createElement(Icon, { size: 24, className: "text-indigo-600 dark:text-indigo-400" })}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-indigo-400/60">{label}</span>
            </div>
        </div>
        <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 leading-none">{value}</p>
        {subtext && <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">{subtext}</p>}
    </div>
);

const HodDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/internships');
                // Filter only LIVE and belonging to HOD department
                const live = res.data.data.filter(i => 
                    i.isActive && (!i.applicationDeadline || new Date(i.applicationDeadline) >= new Date())
                );
                // IF HOD has a department set in their user profile, filter by it. Or show all if ADMIN.
                const filtered = user?.role === 'ADMIN' ? live : live.filter(i => i.department?.toUpperCase() === user?.department?.toUpperCase());
                setInternships(filtered);
            } catch {
                console.error('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const totalApplications = internships.reduce((s, i) => s + (i.applicationsCount || 0), 0);
    const totalAllocated = internships.reduce((s, i) => {
        const rolesTotal = i.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0;
        return s + (i.openingsCount || rolesTotal);
    }, 0);
    const totalHired = internships.reduce((s, i) => s + (i.hiredCount || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
             <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-8 mb-6 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner group-hover:rotate-6 transition-transform">
                            <Star className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-black font-rajdhani mb-1 text-white flex items-center gap-3 tracking-tight">
                                HOD DASHBOARD, <span className="text-purple-400">{user?.name || user?.email?.split('@')[0]}</span>! 👋
                            </h1>
                            <p className="text-indigo-200/60 font-medium text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                {user?.department || 'Department'} Internship Management
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={Briefcase} label="Dept Internships" value={internships.length} color="border-purple-500" subtext="Active Programs" />
                <StatCard icon={Users} label="Total Applications" value={totalApplications} color="border-sky-500" subtext="Pending & Reviewed" />
                <StatCard icon={CheckCircle} label="Students Hired" value={totalHired} color="border-emerald-500" subtext={`Out of ${totalAllocated} openings`} />
            </div>

            {/* Internship Table */}
            <div className="glass-card bg-white dark:bg-slate-900/60 border-black/5 dark:border-white/10 rounded-[2.5rem] premium-shadow overflow-hidden transition-all duration-500">
                <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-indigo-950/20">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-4 font-rajdhani uppercase tracking-widest">
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
                            <Briefcase size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        {user?.department} Internships
                    </h2>
                </div>

                {internships.length === 0 ? (
                    <div className="text-center py-16">
                        <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-medium">No active internships in your department.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto px-8 pb-8">
                        <table className="w-full text-sm mt-4">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Internship Title</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Applications</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Openings</th>
                                    <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {internships.map(int => {
                                    const effectiveOpenings = int.openingsCount || (int.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0);
                                    return (
                                        <tr key={int.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-500/5 transition-all group">
                                            <td className="py-5 pr-6">
                                                <p className="font-bold text-gray-800 dark:text-indigo-100">{int.title}</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{int.location}</p>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-lg font-black text-gray-800 dark:text-white">{int.applicationsCount}</span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="font-bold text-gray-700 dark:text-slate-300">{int.hiredCount}</span>
                                                <span className="text-gray-300 mx-1">/</span>
                                                <span className="text-gray-500">{effectiveOpenings}</span>
                                            </td>
                                            <td className="py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/internships/${int.id}/applications`}
                                                        className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                                                    >
                                                        Review Applications <ChevronRight size={14} />
                                                    </Link>
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

export default HodDashboard;
