import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Calendar, MapPin, Users, Briefcase, Search, ArrowRight, Clock, ShieldCheck, Filter, Zap, TrendingUp } from 'lucide-react';

const InternshipList = () => {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                const res = await api.get('/internships');
                setInternships(res.data.data);
            } catch (error) {
                console.error("Failed to fetch internships", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInternships();
    }, []);

    const departments = ['All', ...new Set(internships.map(i => i.department))];

    const filtered = internships.filter(i => {
        const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'All' || i.department === activeFilter;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003087] dark:border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-4 transition-colors duration-300">

            {/* Header Section */}
            <div className="bg-[#00266b] dark:bg-[#090e17] rounded-[2.5rem] p-8 lg:p-12 mb-10 text-white shadow-2xl relative overflow-hidden group border border-transparent dark:border-slate-800 transition-colors duration-300">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#0044bb] dark:bg-blue-900/40 opacity-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#D4A017] dark:bg-yellow-600/30 opacity-30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 max-w-3xl">
                    <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 text-[10px] font-black tracking-[0.2em] uppercase mb-6 backdrop-blur-md shadow-sm">
                        <Zap className="w-3 h-3 text-[#D4A017]" />
                        Career Launchpad
                    </span>
                    <h1 className="text-4xl lg:text-5xl font-black font-rajdhani mb-4 leading-tight text-white">
                        Power Your Future with APTRANSCO
                    </h1>
                    <p className="text-[#aac4e8] dark:text-slate-400 text-lg sm:text-xl font-medium mb-8 max-w-2xl leading-relaxed">
                        Discover elite internship opportunities across vital energy sectors. Work on live grids, build your expertise, and earn authorized government certification.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search roles or departments..."
                                className="w-full pl-14 pr-4 py-4 rounded-2xl border border-transparent dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#003087]/30 dark:focus:ring-blue-500/30 focus:border-[#003087] dark:focus:border-blue-500 outline-none font-bold placeholder-gray-400 dark:placeholder-slate-500 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Scrolling Ticker */}
            <div className="mb-8 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 rounded-2xl p-4 shadow-xl overflow-hidden relative">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <TrendingUp size={16} className="text-white" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Live Opportunities</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-100">{internships.length} Active Internships</span>
                </div>
                <div className="relative overflow-hidden">
                    <div className="flex animate-scroll-left whitespace-nowrap">
                        {[...internships, ...internships].map((internship, idx) => (
                            <div key={`${internship.id}-${idx}`} className="inline-flex items-center gap-4 px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm mx-2 border border-white/10">
                                <Briefcase size={14} className="text-emerald-200" />
                                <span className="text-sm font-bold text-white">{internship.title}</span>
                                <span className="text-xs text-emerald-200">•</span>
                                <span className="text-xs font-bold text-emerald-100">{internship.department}</span>
                                <span className="text-xs text-emerald-200">•</span>
                                <span className="text-xs font-bold text-emerald-100">{internship.openingsCount} Openings</span>
                            </div>
                        ))}
                    </div>
                </div>
                <style>{`
                    @keyframes scroll-left {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-scroll-left {
                        animation: scroll-left 30s linear infinite;
                    }
                    .animate-scroll-left:hover {
                        animation-play-state: paused;
                    }
                `}</style>
            </div>

            {/* Filters */}
            <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px] sm:text-xs mr-2 shrink-0">
                    <Filter className="w-4 h-4" /> Filter by:
                </div>
                {departments.map(dept => (
                    <button
                        key={dept}
                        onClick={() => setActiveFilter(dept)}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm border uppercase tracking-wide flex-shrink-0
                            ${activeFilter === dept
                                ? 'bg-[#003087] dark:bg-blue-600 border-[#003087] dark:border-blue-500 text-white shadow-[#003087]/20 dark:shadow-blue-900/50'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-[#003087]/30 dark:hover:border-blue-500/50 hover:text-[#003087] dark:hover:text-blue-400'
                            }`}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            {/* Results */}
            {filtered.length === 0 ? (
                <div className="bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-[2rem] p-12 text-center max-w-2xl mx-auto transition-colors">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
                        <Briefcase className="w-10 h-10 text-gray-300 dark:text-slate-600 outline-none" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 font-rajdhani">No roles found</h3>
                    <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">We couldn't find any internships matching "{searchTerm}" in the {activeFilter} category.</p>
                    <button
                        onClick={() => { setSearchTerm(''); setActiveFilter('All'); }}
                        className="mt-6 font-bold text-[#003087] dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors uppercase tracking-widest text-xs"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {filtered.flatMap(internship => {
                        const roles = internship.rolesData || (internship.roles ? internship.roles.split(',').map(r => ({ name: r.trim(), openings: 'N/A' })) : [{ name: internship.title, openings: internship.openingsCount }]);

                        return roles.map((role, idx) => (
                            <div key={`${internship.id}-${idx}`} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#003087]/20 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col h-full group overflow-hidden relative">

                                {/* Card Header Strip */}
                                <div className={`h-2.5 w-full ${internship.department === 'IT' ? 'bg-blue-500' :
                                    internship.department === 'Operations' ? 'bg-emerald-500 dark:bg-emerald-400' :
                                        internship.department === 'HR' ? 'bg-[#D4A017] dark:bg-yellow-500' :
                                            'bg-[#003087] dark:bg-blue-600'
                                    }`}></div>

                                <div className="p-6 lg:p-8 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-5 gap-4">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {internship.department}
                                        </div>
                                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eff4ff] dark:bg-blue-500/10 text-[#003087] dark:text-blue-400 border border-[#b3cfff] dark:border-blue-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Govt. Appr.
                                        </div>
                                    </div>

                                    {/* Stipend Type Badge */}
                                    <div className="mb-4">
                                        {internship.stipendType === 'COLLABORATIVE' ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                <span className="material-symbols-outlined text-sm">payments</span>
                                                Collaborative {internship.stipendAmount && `(${internship.stipendAmount}/month)`}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                                                Non-Collaborative
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="text-xl lg:text-2xl font-black font-rajdhani text-gray-900 dark:text-white mb-1.5 line-clamp-2 leading-tight group-hover:text-[#003087] dark:group-hover:text-blue-400 transition-colors">
                                        {role.name}
                                    </h2>
                                    <div className="text-[11px] font-extrabold text-gray-400 dark:text-slate-500 tracking-wide mb-4 line-clamp-1">
                                        PART OF: <span className="text-[#003087] dark:text-blue-400 opacity-80">{internship.title}</span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-6 line-clamp-3 leading-relaxed flex-grow">
                                        {internship.description}
                                    </p>

                                    <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-slate-700 mt-auto mb-6">
                                        <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600 shadow-sm">
                                                <MapPin className="w-4 h-4 text-[#003087] dark:text-blue-400" />
                                            </div>
                                            {internship.location || 'Multiple Locations'}
                                        </div>
                                        <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600 shadow-sm">
                                                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            {internship.duration}
                                        </div>
                                        <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600 shadow-sm">
                                                <Users className="w-4 h-4 text-[#D4A017] dark:text-yellow-400" />
                                            </div>
                                            {role.openings} Openings
                                        </div>
                                    </div>

                                    <div className="pt-0 mt-auto">
                                        <Link
                                            to={`/student/internships/${internship.id}/apply?role=${encodeURIComponent(role.name)}`}
                                            className="w-full bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:bg-[#003087] dark:group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white active:scale-[0.98] uppercase tracking-widest text-[11px]"
                                        >
                                            View Details & Apply <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ));
                    })}
                </div>
            )}
        </div>
    );
};

export default InternshipList;
