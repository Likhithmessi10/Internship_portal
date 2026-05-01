import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
    Briefcase, Users, CheckCircle, ChevronRight, Star, Activity, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import StatsDetailModal from '../../../components/ui/StatsDetailModal';
import CreateMentorModal from './CreateMentorModal';
import { UserPlus } from 'lucide-react';

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
    const [hiredInterns, setHiredInterns] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStat, setSelectedStat] = useState(null);
    const [showCreateMentor, setShowCreateMentor] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Get all internships first
                const intRes = await api.get('/admin/internships');

                // Filter internships belonging to HOD department
                const dept = user?.department?.toUpperCase().trim();
                const allInts = intRes.data.data || [];

                const filteredInts = user?.role === 'ADMIN'
                    ? allInts
                    : allInts.filter(i => i.department?.toUpperCase().trim() === dept);

                const liveInts = filteredInts.filter(i => i.isActive && (!i.applicationDeadline || new Date(i.applicationDeadline) >= new Date()));

                // Fetch applications for each internship in the department
                const appsPromises = liveInts.map(internship =>
                    api.get(`/admin/internships/${internship.id}/applications`)
                );
                const appsResults = await Promise.allSettled(appsPromises);
                const allApps = appsResults
                    .filter(result => result.status === 'fulfilled')
                    .flatMap(result => result.value.data.data || []);

                // Fetch all interns and filter (HODs can only see their department's interns)
                try {
                    const internsRes = await api.get('/admin/interns/all');
                    const allInterns = internsRes.data.data || [];
                    const filteredInterns = allInterns.filter(i =>
                        i.internship?.department?.toUpperCase().trim() === dept
                    );
                    setHiredInterns(filteredInterns);
                } catch (err) {
                    // HODs might not have permission to fetch all interns, that's OK
                    setHiredInterns([]);
                }

                setInternships(liveInts);
                setApplications(allApps);
            } catch (err) {
                console.error('Failed to fetch HOD dashboard data', err);
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
            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Departmental Oversight</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">{user?.department} Dashboard</h2>
                </div>
                <div className="flex gap-4 items-center text-right">
                    <button 
                        onClick={() => setShowCreateMentor(true)}
                        className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/50 dark:text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        <UserPlus size={16} /> Create Mentor
                    </button>
                    <div className="border-l border-outline-variant/30 h-8"></div>
                    <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Academic Year</p>
                        <p className="text-sm font-bold text-primary">{new Date().getFullYear() - 1} - {new Date().getFullYear()}</p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            {/* Bento Grid Stats */}
            <section className="grid grid-cols-12 gap-6">
                <button
                    onClick={() => setSelectedStat({ title: 'Active Programs', type: 'PROGRAMS', data: internships })}
                    className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all text-left group"
                >
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Active Programs</span>
                    <div className="text-4xl font-extrabold text-primary mt-2 group-hover:scale-110 transition-transform origin-left">{internships.length}</div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded w-fit uppercase">
                        <Activity size={12} /> Live Status
                    </div>
                </button>

                <button
                    onClick={() => setSelectedStat({ title: 'Application Pool', type: 'APPLICATIONS', data: applications })}
                    className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all text-left group"
                >
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Pool Size</span>
                    <div className="text-4xl font-extrabold text-primary mt-2 group-hover:scale-110 transition-transform origin-left">{totalApplications}</div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-outline uppercase">
                        <Users size={12} /> Cumulative Applicants
                    </div>
                </button>

                <button
                    onClick={() => setSelectedStat({ title: 'Hired Interns', type: 'INTERNS', data: hiredInterns })}
                    className="col-span-12 lg:col-span-4 bg-primary-container p-6 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                >
                    <span className="text-[10px] font-bold text-on-primary-container uppercase tracking-widest opacity-80">Hiring Quota</span>
                    <div className="flex items-end justify-between mt-2 text-white group-hover:translate-x-1 transition-transform">
                        <div className="text-4xl font-extrabold">{totalHired}</div>
                        <div className="text-xl font-medium opacity-50 mb-1">/ {totalAllocated}</div>
                    </div>
                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-white h-full transition-all duration-1000" style={{ width: `${totalAllocated > 0 ? (totalHired / totalAllocated) * 100 : 0}%` }}></div>
                    </div>
                </button>
            </section>

            {/* Internship Table */}
            {/* Internship Table - Stitch Style */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Departmental Programs</h3>
                        <p className="text-[10px] text-outline font-medium mt-0.5">Recruitment overview for {user?.department}</p>
                    </div>
                    <div className="flex gap-2 text-outline">
                        <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">filter_list</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-high/30">
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Program</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Applications</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Quota Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {internships.map(int => {
                                const effectiveOpenings = int.openingsCount || (int.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0);
                                const isFilled = int.hiredCount >= effectiveOpenings && effectiveOpenings > 0;
                                return (
                                    <tr key={int.id} className="hover:bg-surface-container-high/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-primary">{int.title}</p>
                                                    <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-0.5">{int.location}</p>
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
                                            <div className="inline-flex flex-col items-center">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold text-primary">{int.hiredCount}</span>
                                                    <span className="text-[10px] text-outline">/ {effectiveOpenings}</span>
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-tighter ${isFilled ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {isFilled ? 'FULFILLED' : 'OPEN'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Link
                                                to={`/internships/${int.id}/applications`}
                                                className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
                                            >
                                                Review Pool <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedStat && (
                <StatsDetailModal
                    title={selectedStat.title}
                    type={selectedStat.type}
                    data={selectedStat.data}
                    onClose={() => setSelectedStat(null)}
                />
            )}

            {showCreateMentor && (
                <CreateMentorModal onClose={(success) => {
                    setShowCreateMentor(false);
                    if (success) {
                        alert('Mentor credentials created successfully!');
                    }
                }} />
            )}
        </div>
    );
};

export default HodDashboard;
