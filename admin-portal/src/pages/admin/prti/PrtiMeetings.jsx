import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    Calendar, Video, Clock, MapPin, 
    ChevronRight, ArrowUpRight, CheckCircle, Info,
    UserCircle, Users, Activity
} from 'lucide-react';

const PrtiMeetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeetings = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/meetings');
                setMeetings(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch institutional meetings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Institutional Oversight</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Interview Schedule</h2>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs font-bold text-primary hover:bg-surface-container-high transition-all uppercase tracking-widest">
                        <Calendar size={14} /> Global View
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {meetings.map((m, idx) => {
                    const mDate = m.interviewDate ? new Date(m.interviewDate) : null;
                    const isPast = mDate && mDate < new Date();
                    return (
                        <div key={idx} className={`bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row items-center gap-10 hover:shadow-xl transition-all group ${isPast ? 'opacity-40 grayscale' : ''}`}>
                            <div className="flex flex-col items-center text-center px-8 border-r-2 border-outline-variant/5">
                                <span className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{mDate?.toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-5xl font-black text-primary leading-none my-1 tracking-tighter group-hover:scale-110 transition-transform">{mDate?.getDate() || '--'}</span>
                                <span className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">{mDate?.getFullYear() || '----'}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3">
                                     <span className={`px-2 py-0.5 ${isPast ? 'bg-surface-container-high text-outline' : 'bg-primary/10 text-primary'} text-[9px] font-black rounded uppercase tracking-widest`}>{isPast ? 'CONCLUDED' : 'UPCOMING'}</span>
                                     <span className="text-outline text-xs opacity-30">•</span>
                                     <span className="text-outline text-[10px] font-bold uppercase tracking-[0.1em] truncate italic">{m.internship?.title || 'Unknown Program'}</span>
                                </div>
                                <h3 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl">video_call</span> 
                                    {m.meetLink ? 'Interview Session' : 'Coordination Update'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-8 mt-4">
                                    <div className="flex items-center gap-2 text-outline group-hover:text-primary transition-colors">
                                        <div className="p-2 rounded-lg bg-surface-container-low shadow-sm">
                                            <Clock size={16} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest">{mDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'TBD'}</span>
                                    </div>
                                    {m.meetLink && (
                                        <div className="flex items-center gap-2 text-primary group-hover:text-indigo-600 transition-colors">
                                            <div className="p-2 rounded-lg bg-indigo-50 shadow-sm">
                                                <Video size={16} />
                                            </div>
                                            <a href={m.meetLink} target="_blank" rel="noreferrer" className="text-[11px] font-black uppercase tracking-widest hover:underline">Launch System Meet</a>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-outline group-hover:text-emerald-600 transition-colors">
                                        <div className="p-2 rounded-lg bg-emerald-50 shadow-sm">
                                            <Activity size={16} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest italic">{m.internship?.department || 'GENERAL'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-6 pr-4">
                                <div className="flex -space-x-3 hover:space-x-1 transition-all">
                                     <div className="w-12 h-12 rounded-2xl bg-primary-container/20 border-4 border-white dark:border-slate-900 flex items-center justify-center text-xs font-black text-primary group-hover:scale-110 transition-transform shadow-premium" title="HOD Representative">H</div>
                                     <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-4 border-white dark:border-slate-900 flex items-center justify-center text-xs font-black text-indigo-700 group-hover:translate-x-1 shadow-premium" title="Mentor Assignment">M</div>
                                     <div className="w-12 h-12 rounded-2xl bg-surface-container-high border-4 border-white dark:border-slate-900 flex items-center justify-center text-xs font-black text-outline group-hover:translate-x-2 shadow-premium" title="PRTI Coordination">P</div>
                                </div>
                                {!isPast && m.meetLink && (
                                    <a href={m.meetLink} target="_blank" rel="noreferrer" className="bg-primary text-white text-xs font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl hover:bg-primary-container shadow-premium transition-all flex items-center gap-3">
                                        Join <ArrowUpRight size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
                {meetings.length === 0 && (
                    <div className="py-24 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/10 shadow-inner">
                        <Calendar size={56} className="mx-auto text-outline/20 mb-6" />
                        <p className="text-outline font-black text-sm uppercase tracking-[0.4em] italic mb-2">No Institutional Meetings</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-40">System is currently clear of scheduled sessions</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrtiMeetings;
