import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { 
    Calendar, Video, Clock, MapPin, 
    ChevronRight, ArrowUpRight, CheckCircle, Info
} from 'lucide-react';

const HodMeetings = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const intRes = await api.get('/admin/internships');
            const deptInternships = intRes.data.data;
            
            const committeePromises = deptInternships.map(i => api.get(`/admin/internships/${i.id}/committee`));
            const committeeResults = await Promise.all(committeePromises);
            
            const allMeetings = committeeResults
                .map((r, idx) => ({ 
                    ...r.data.data, 
                    internshipTitle: deptInternships[idx].title,
                    internshipId: deptInternships[idx].id 
                }))
                .filter(m => m.meetingDate); // Only those with a date set
            
            // Sort by date soonest first
            setMeetings(allMeetings.sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate)));
        } catch (err) {
            console.error('Failed to fetch departmental meetings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
             <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Interview Schedule</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Institutional Meetings</h2>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6">
                {meetings.map((m, idx) => {
                    const mDate = new Date(m.meetingDate);
                    const isPast = mDate < new Date();
                    return (
                        <div key={idx} className={`bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row items-center gap-8 ${isPast ? 'opacity-60' : ''}`}>
                            <div className="flex flex-col items-center text-center px-6 border-r border-outline-variant/10">
                                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{mDate.toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-3xl font-black text-primary leading-none my-1">{mDate.getDate()}</span>
                                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{mDate.getFullYear()}</span>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                     <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold rounded uppercase tracking-wider">{isPast ? 'CONCLUDED' : 'UPCOMING'}</span>
                                     <span className="text-outline text-xs">•</span>
                                     <span className="text-outline text-[10px] font-bold uppercase tracking-widest">{m.internshipTitle}</span>
                                </div>
                                <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-outline">video_call</span> {m.meetingLink ? 'Interview Session' : 'Meeting Details'}
                                </h3>
                                <div className="flex items-center gap-6 mt-4">
                                    <div className="flex items-center gap-2 text-outline">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        <span className="text-[10px] font-bold uppercase">{mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {m.meetingLink && (
                                        <div className="flex items-center gap-2 text-primary">
                                            <span className="material-symbols-outlined text-sm">link</span>
                                            <a href={m.meetingLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase hover:underline">Google Meet Access</a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-3">
                                <div className="flex -space-x-2 mr-4">
                                     {m.hod && <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary" title="HOD">H</div>}
                                     {m.mentor && <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700" title="Mentor">M</div>}
                                     {m.prtiMember && <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-white flex items-center justify-center text-[10px] font-bold text-outline" title="PRTI">P</div>}
                                </div>
                                {!isPast && m.meetingLink && (
                                    <a href={m.meetingLink} target="_blank" rel="noreferrer" className="bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-lg hover:opacity-90 shadow-md transition-all flex items-center gap-2">
                                        Join Session <ArrowUpRight size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
                {meetings.length === 0 && (
                    <div className="py-20 text-center bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-sm transition-all">
                        <Calendar size={48} className="mx-auto text-outline/20 mb-4" />
                        <p className="text-outline font-bold text-xs uppercase tracking-widest italic">No Institutional Meetings Scheduled</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HodMeetings;
