import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    Clock, Search, User, Target, 
    Activity, ChevronRight, Filter, AlertCircle,
    Calendar, ArrowUpRight, History
} from 'lucide-react';

const PrtiAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/audit-logs');
            setLogs(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(l => 
        l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Traceability Feed</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Audit History</h2>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Trace specific administrative event..."
                            className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-80 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {filteredLogs.map((log, idx) => (
                    <div key={log.id} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group flex items-start gap-8 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                        
                        <div className="flex flex-col items-center">
                            <div className="p-3 rounded-2xl bg-surface-container-low text-primary group-hover:scale-110 transition-transform">
                                <History size={20} />
                            </div>
                            <div className="text-[9px] font-black text-outline uppercase tracking-widest mt-2">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{log.action.replace('_', ' ')}</span>
                                <span className="text-outline/20">•</span>
                                <span className="text-xs text-outline font-bold">{new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <h3 className="text-lg font-black text-primary mb-2 line-clamp-1">{log.details || 'Administrative Operation'}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-outline">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-high rounded-lg"><User size={12} className="text-primary" /> {log.userEmail}</span>
                                {log.target && <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg"><Target size={12} /> Target ID: {log.target.slice(0, 8)}...</span>}
                            </div>
                        </div>

                        <div className="shrink-0 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all">
                                Protocol View <ArrowUpRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredLogs.length === 0 && (
                    <div className="py-24 text-center bg-surface-container-low/30 rounded-[3rem] border-2 border-dashed border-outline-variant/10">
                        <History size={64} className="mx-auto text-outline/20 mb-6" />
                        <p className="text-outline font-black text-sm uppercase tracking-[0.4em] italic mb-2">Zero Trace Context</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-40">No administrative actions have been logged matching your current filters</p>
                    </div>
                )}
            </div>

            <div className="p-8 bg-surface-container-high/20 rounded-[3rem] border border-outline-variant/10 flex flex-col items-center text-center">
                 <div className="p-4 bg-primary/10 text-primary rounded-full mb-6">
                    <Shield size={32} />
                 </div>
                 <h4 className="text-xl font-black text-primary mb-2">Immutable Traceability</h4>
                 <p className="text-[11px] text-outline font-bold uppercase tracking-widest max-w-xl leading-relaxed opacity-60">
                    The audit server maintains a full sequence of events within the administrative portal. These logs cannot be deleted or modified by any user role, ensuring operational transparency.
                 </p>
            </div>
        </div>
    );
};

export default PrtiAuditLogs;
