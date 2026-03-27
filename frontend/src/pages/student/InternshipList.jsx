import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Calendar, MapPin, Users, Briefcase, Search, ArrowRight, Clock, ShieldCheck, Filter } from 'lucide-react';

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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-4">
            
            {/* Header Section */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-3xl p-8 lg:p-12 mb-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
                
                <div className="relative z-10 max-w-3xl">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-sm shadow-sm">
                        Career Launchpad
                    </span>
                    <h1 className="text-4xl lg:text-5xl font-black font-rajdhani mb-4 leading-tight">
                        Power Your Future with APTRANSCO
                    </h1>
                    <p className="text-indigo-100 text-lg sm:text-xl font-medium mb-8 max-w-2xl leading-relaxed">
                        Discover elite internship opportunities across vital energy sectors. Work on live grids, build your expertise, and earn authorized government certification.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search roles or departments..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-lg text-gray-900 focus:ring-4 focus:ring-indigo-400 focus:outline-none font-medium placeholder-gray-400 transition-shadow"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-xs mr-2 shrink-0">
                    <Filter className="w-4 h-4" /> Filter by:
                </div>
                {departments.map(dept => (
                    <button
                        key={dept}
                        onClick={() => setActiveFilter(dept)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm border
                            ${activeFilter === dept 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            {/* Results */}
            {filtered.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No roles found</h3>
                    <p className="text-gray-500 font-medium">We couldn't find any internships matching "{searchTerm}" in the {activeFilter} category.</p>
                    <button 
                        onClick={() => {setSearchTerm(''); setActiveFilter('All');}}
                        className="mt-6 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {filtered.flatMap(internship => {
                        const roles = internship.rolesData || (internship.roles ? internship.roles.split(',').map(r => ({ name: r.trim(), openings: 'N/A' })) : [{ name: internship.title, openings: internship.openingsCount }]);
                        
                        return roles.map((role, idx) => (
                            <div key={`${internship.id}-${idx}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group overflow-hidden relative">
                                
                                {/* Card Header Strip */}
                                <div className={`h-2 w-full ${
                                    internship.department === 'IT' ? 'bg-blue-500' : 
                                    internship.department === 'Operations' ? 'bg-emerald-500' : 
                                    internship.department === 'HR' ? 'bg-amber-500' : 
                                    'bg-indigo-500'
                                }`}></div>

                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-100 text-xs font-bold uppercase tracking-wider">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {internship.department}
                                        </div>
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Govt. Appr.
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-xl font-bold font-rajdhani text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {role.name}
                                    </h2>
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3 opacity-70">
                                        Program: {internship.title}
                                    </div>
                                    
                                    <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-3 leading-relaxed flex-grow">
                                        {internship.description}
                                    </p>

                                    <div className="space-y-3 pt-5 border-t border-gray-100">
                                        <div className="flex items-center text-sm font-semibold text-gray-700 gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            {internship.location || 'Multiple Locations'}
                                        </div>
                                        <div className="flex items-center text-sm font-semibold text-gray-700 gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                                <Clock className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            {internship.duration}
                                        </div>
                                        <div className="flex items-center text-sm font-semibold text-gray-700 gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4 text-amber-500" />
                                            </div>
                                            {role.openings} Openings for this role
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 pt-0 mt-auto">
                                    <Link
                                        to={`/student/internships/${internship.id}/apply?role=${encodeURIComponent(role.name)}`}
                                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:bg-indigo-600"
                                    >
                                        View Details & Apply <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
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
