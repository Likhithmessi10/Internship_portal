import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Calendar, MapPin, Users, Briefcase, Search, ArrowRight, Clock, ShieldCheck, Filter, Zap, TrendingUp } from 'lucide-react';

const InternshipList = () => {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchInternships = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/internships?page=${page}&limit=10`);
                setInternships(res.data.data);
                setTotalPages(res.data.totalPages || 1);
            } catch (error) {
                console.error("Failed to fetch internships", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInternships();
    }, [page]);

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
        <div className="w-full py-4 transition-colors duration-300">

            {/* Search and Filters */}
            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search roles or departments..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
                    {departments.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setActiveFilter(dept)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border uppercase tracking-wide
                                ${activeFilter === dept
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-500/30 hover:text-indigo-600'
                                }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
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
                        let itemsToRender = [];
                        
                        if (internship.internshipMode === 'GROUP' && internship.departmentGroups?.length > 0) {
                            internship.departmentGroups.forEach(group => {
                                if (group.internshipType === 'NON_STIPEND') {
                                    const fields = group.fields || [];
                                    fields.forEach(field => {
                                        itemsToRender.push({
                                            department: group.department,
                                            roleName: field.fieldName,
                                            openings: field.vacancies || 'N/A',
                                            groupId: group.id,
                                            fieldId: field.id,
                                            locations: field.locations || [],
                                            isNonStipend: true
                                        });
                                    });
                                } else {
                                    const roles = group.rolesData || [{ name: group.title || group.department, openings: group.openings }];
                                    roles.forEach(role => {
                                        itemsToRender.push({
                                            department: group.department,
                                            roleName: role.name,
                                            openings: role.openings || group.openings || 'N/A',
                                            groupId: group.id
                                        });
                                    });
                                }
                            });
                        } else if (internship.internshipType === 'NON_STIPEND') {
                            const fields = internship.fields || [];
                            fields.forEach(field => {
                                itemsToRender.push({
                                    department: internship.department,
                                    roleName: field.fieldName,
                                    openings: field.vacancies || 'N/A',
                                    fieldId: field.id,
                                    locations: field.locations || [],
                                    isNonStipend: true
                                });
                            });
                        } else {
                            const roles = internship.rolesData || (internship.roles ? internship.roles.split(',').map(r => ({ name: r.trim(), openings: 'N/A' })) : [{ name: internship.title, openings: internship.openingsCount }]);
                            roles.forEach(role => {
                                itemsToRender.push({
                                    department: internship.department,
                                    roleName: role.name,
                                    openings: role.openings || internship.openingsCount || 'N/A'
                                });
                            });
                        }

                        return itemsToRender.map((item, idx) => (
                            <div key={`${internship.id}-${idx}`} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#003087]/20 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col h-full group overflow-hidden relative">

                                {/* Card Header Strip */}
                                <div className={`h-2.5 w-full ${item.department === 'IT' ? 'bg-blue-500' :
                                    item.department === 'Operations' ? 'bg-emerald-500 dark:bg-emerald-400' :
                                        item.department === 'HR' ? 'bg-[#D4A017] dark:bg-yellow-500' :
                                            'bg-[#003087] dark:bg-blue-600'
                                    }`}></div>

                                <div className="p-6 lg:p-7 flex-grow flex flex-col">
                                    <div className="flex flex-wrap items-center justify-between mb-5 gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                {item.department}
                                            </div>
                                            {internship.stipendType === 'COLLABORATIVE' ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                    Collaborative
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                    Non-Collaborative
                                                </div>
                                            )}
                                        </div>
                                    </div>



                                    <h2 className="text-xl lg:text-2xl font-black font-rajdhani text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-[#003087] dark:group-hover:text-blue-400 transition-colors">
                                        {item.roleName}
                                    </h2>
                                    <div className="text-[11px] font-extrabold text-gray-400 dark:text-slate-500 tracking-wide mb-4 line-clamp-1">
                                        PART OF: <span className="text-[#003087] dark:text-blue-400 opacity-80">{internship.title}</span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-6 line-clamp-3 leading-relaxed flex-grow">
                                        {internship.description}
                                    </p>

                                    <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-700 mt-auto mb-8">
                                        <div className="flex items-center text-base font-bold text-gray-700 dark:text-slate-300 gap-4">
                                            <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600 shadow-sm">
                                                <MapPin className="w-5 h-5 text-[#003087] dark:text-blue-400" />
                                            </div>
                                            {item.isNonStipend ? (Array.isArray(item.locations) ? item.locations.join(', ') : 'Multiple') : (internship.location || 'Multiple Locations')}
                                        </div>
                                        <div className="flex items-center text-base font-bold text-gray-700 dark:text-slate-300 gap-4">
                                            <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600 shadow-sm">
                                                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            {internship.duration}
                                        </div>
                                        <div className="flex items-center text-base font-bold text-gray-700 dark:text-slate-300 gap-4">
                                            <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600 shadow-sm">
                                                <Users className="w-5 h-5 text-[#D4A017] dark:text-yellow-400" />
                                            </div>
                                            {item.openings} {item.isNonStipend ? 'Vacancies' : 'Openings'}
                                        </div>
                                    </div>

                                    <div className="pt-0 mt-auto">
                                        <Link
                                            to={`/student/internships/${internship.id}/apply?role=${encodeURIComponent(item.roleName)}${item.groupId ? `&groupId=${item.groupId}` : ''}${item.fieldId ? `&fieldId=${item.fieldId}` : ''}`}
                                            className="w-full bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-extrabold py-2.5 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 group-hover:bg-[#003087] dark:group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white active:scale-[0.98] uppercase tracking-widest text-[10px]"
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center gap-4">
                    <button 
                        disabled={page === 1} 
                        onClick={() => setPage(page - 1)}
                        className="px-6 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold 
                        disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        Previous
                    </button>
                    <span className="font-bold text-gray-500 dark:text-slate-400">
                        Page {page} of {totalPages}
                    </span>
                    <button 
                        disabled={page === totalPages} 
                        onClick={() => setPage(page + 1)}
                        className="px-6 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold 
                        disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default InternshipList;
