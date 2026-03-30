import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import ApplicationProfileModal from '../ApplicationProfileModal';
import { 
    Search, Filter, Download, ChevronRight, ChevronDown,
    GraduationCap, Award, Info, MapPin, Eye, CheckCircle
} from 'lucide-react';
import WarningCard from '../../../components/ui/WarningCard';

const HodApplications = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // First get all internships for this HOD
            const intRes = await api.get('/admin/internships');
            const deptInternships = intRes?.data?.data || [];
            
            // Then fetch applications for each internship and flatten
            const allAppsPromises = deptInternships.map(i => api.get(`/admin/internships/${i.id}/applications`));
            const appsResults = await Promise.all(allAppsPromises);
            const flattened = appsResults.flatMap(r => r?.data?.data || []);
            
            setApplications(flattened);
        } catch (err) {
            console.error('Failed to fetch departmental applications');
            setError('Failed to sync departmental applications. Please check your connection.');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredApps = (applications || []).filter(app => {
        const matchesStatus = filter === 'All' || app.status === filter;
        const matchesSearch = searchQuery === '' || 
            app.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.student?.collegeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.trackingId?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
             <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 text-slate-800">
            {error && <WarningCard message={error} onClose={() => setError(null)} />}
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Recruitment Oversight</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Departmental Applications</h2>
                </div>
            </section>

            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-white">
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        {['All', 'SUBMITTED', 'COMMITTEE_EVALUATION', 'HIRED', 'REJECTED'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-surface-container-high text-outline hover:bg-surface-variant'}`}>
                                {f.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative w-full md:w-80">
                         <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
                         <input 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search by name, college..." 
                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-primary focus:outline-primary placeholder:text-outline/40" 
                         />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-high/30">
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Candidate</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Program</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">College</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {filteredApps.map(app => (
                                <tr key={app.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div>
                                            <p className="text-sm font-bold text-primary">{app.student?.fullName}</p>
                                            <p className="text-[10px] text-outline font-medium tracking-tighter uppercase mt-0.5">ID: {app.trackingId.slice(-6)}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[10px] font-bold text-primary uppercase">{app.internship?.title}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[10px] font-medium text-outline uppercase max-w-[150px] truncate">{app.student?.collegeName}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${
                                            app.status === 'HIRED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-surface-container-high text-outline border-outline-variant/10'
                                        }`}>
                                            {app.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button 
                                            onClick={() => setSelected(app)}
                                            className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all mx-auto mr-0"
                                        >
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredApps.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-outline font-bold text-xs uppercase tracking-widest">
                                        No applications found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selected && (
                <ApplicationProfileModal 
                    application={selected} 
                    internship={selected.internship} 
                    onClose={() => setSelected(null)}
                    updateStatus={async (newStatus, extra) => {
                        try {
                            await api.put(`/admin/applications/${selected.id}`, { status: newStatus, ...extra });
                            fetchData();
                            setSelected(null);
                        } catch (err) {
                            alert('Failed to update status');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default HodApplications;
