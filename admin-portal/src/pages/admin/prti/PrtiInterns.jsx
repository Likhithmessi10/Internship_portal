import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    Search, Filter, Download, User, 
    Briefcase, Calendar, ChevronRight, Mail,
    Building2, MapPin, Award, Users
} from 'lucide-react';

const PrtiInterns = () => {
    const [interns, setInterns] = useState([]);
    const [filteredInterns, setFilteredInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');

    useEffect(() => {
        const fetchInterns = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/interns/all');
                setInterns(res.data.data || []);
                setFilteredInterns(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch interns', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInterns();
    }, []);

    useEffect(() => {
        let result = [...interns];
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            result = result.filter(i => 
                (i.student?.fullName?.toLowerCase().includes(lowSearch)) ||
                (i.student?.collegeName?.toLowerCase().includes(lowSearch)) ||
                (i.trackingId?.toLowerCase().includes(lowSearch))
            );
        }
        if (filterDept !== 'All') {
            result = result.filter(i => i.internship?.department === filterDept);
        }
        setFilteredInterns(result);
    }, [searchTerm, filterDept, interns]);

    const departments = ['All', ...new Set(interns.map(i => i.internship?.department).filter(Boolean))];

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Talent Management</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Intern Directory</h2>
                </div>
                <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold tracking-widest hover:opacity-90 shadow-md transition-all uppercase">
                    <Download size={14} /> Export Directory
                </button>
            </header>

            {/* Filters */}
            <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, college, or tracking ID..."
                        className="w-full bg-surface-container-lowest border-none rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-subtle placeholder:text-outline/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-3 bg-surface-container-lowest rounded-xl shadow-subtle">
                        <Filter size={16} className="text-outline" />
                        <select 
                            className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 p-0 pr-8"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {/* Intern Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInterns.map(i => (
                    <div key={i.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-primary-container/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-primary group-hover:text-primary-container transition-colors max-w-[150px] truncate">{i.student.fullName}</h3>
                                        <p className="text-[10px] font-bold text-outline uppercase tracking-tighter">{i.trackingId}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase tracking-widest">{i.status}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-outline group-hover:text-primary transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                                        <Building2 size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Institution</p>
                                        <p className="text-xs font-bold truncate">{i.student.collegeName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-outline group-hover:text-primary transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                                        <Briefcase size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Program & Dept</p>
                                        <p className="text-xs font-bold truncate">{i.internship.title} • {i.internship.department}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-outline group-hover:text-primary transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                                        <MapPin size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Deployment Area</p>
                                        <p className="text-xs font-bold truncate">{i.internship?.location || 'VARIOUS'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award size={14} className="text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">View Profile</span>
                            </div>
                            <ChevronRight size={16} className="text-outline group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>

            {filteredInterns.length === 0 && (
                <div className="py-20 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
                    <Users size={48} className="mx-auto text-outline/20 mb-4" />
                    <p className="text-outline font-black text-sm uppercase tracking-[0.2em]">No Interns Found Matching Filters</p>
                </div>
            )}
        </div>
    );
};

export default PrtiInterns;
