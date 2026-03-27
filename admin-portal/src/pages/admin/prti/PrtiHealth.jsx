import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    Activity, Database, Shield, Zap, 
    RefreshCw, CheckCircle, AlertTriangle, Cpu,
    Server, Globe, Clock
} from 'lucide-react';

const PrtiHealth = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000); // Auto refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await api.get('/admin/system/health');
            setHealth(res.data.data);
        } catch (err) {
            console.error('Health check failed', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    const metrics = [
        { label: 'DB Latency', value: health?.latency || '0ms', icon: Database, color: 'text-indigo-500' },
        { label: 'Uptime', value: `${Math.floor((health?.uptime || 0) / 3600)}h ${Math.floor(((health?.uptime || 0) % 3600) / 60)}m`, icon: Clock, color: 'text-emerald-500' },
        { label: 'Environment', value: health?.environment || 'PROD', icon: Server, color: 'text-amber-500' },
        { label: 'Last Sync', value: new Date(health?.lastSync).toLocaleTimeString(), icon: RefreshCw, color: 'text-primary' },
    ];

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Infrastructure Intelligence</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">System Health</h2>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={fetchHealth}
                        className="flex items-center gap-2 px-6 py-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs font-bold text-primary hover:bg-surface-container-high transition-all uppercase tracking-widest"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Force Diagnostic
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-surface-container-low ${m.color} group-hover:scale-110 transition-transform`}>
                                <m.icon size={20} />
                            </div>
                            <Activity size={12} className="text-outline/20" />
                        </div>
                        <h4 className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{m.label}</h4>
                        <p className="text-xl font-black text-primary tracking-tight">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-8 flex items-center gap-3">
                        <Shield className="text-primary" size={18} /> Protocol Integrity
                    </h3>
                    <div className="space-y-6">
                        {Object.entries(health?.services || {}).map(([name, status]) => (
                            <div key={name} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                        {name === 'database' ? <Database size={18} className="text-indigo-500" /> : <Server size={18} className="text-primary" />}
                                    </div>
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">{name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                    <span className="text-[10px] font-black text-outline uppercase tracking-widest">{status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-primary p-1 bg-gradient-to-br from-primary to-indigo-900 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
                    <div className="bg-surface-container-lowest h-full w-full rounded-[2.25rem] p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-10">
                                <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                                    <Cpu size={32} />
                                </div>
                                <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">A-Grade Performance</div>
                            </div>
                            <h3 className="text-3xl font-black text-primary tracking-tighter mb-4 leading-none">Diagnostic Mastery</h3>
                            <p className="text-xs text-outline font-bold uppercase tracking-tight leading-relaxed opacity-60">
                                The PRTI infrastructure utilizes high-availability protocols and real-time database mirroring. Health checks are automated and anomalies trigger immediate administrative alerts.
                            </p>
                        </div>
                        <div className="pt-8 mt-8 border-t border-outline-variant/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-outline">
                            <span className="flex items-center gap-2"><Globe size={14} /> Global Distribution</span>
                            <span className="flex items-center gap-2"><Zap size={14} /> 99.9% SLO</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrtiHealth;
