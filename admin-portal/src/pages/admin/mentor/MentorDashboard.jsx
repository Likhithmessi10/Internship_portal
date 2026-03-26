import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Network, Users, BookOpen, Clock, Activity, Briefcase } from 'lucide-react';

const MentorDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-8 mt-6 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner">
                        <Network className="w-8 h-8 text-sky-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black font-rajdhani mb-1 flex items-center gap-3">
                            MENTOR PORTAL, <span className="text-sky-400">{user?.name || user?.email?.split('@')[0]}</span>!
                        </h1>
                        <p className="text-indigo-200/60 font-medium text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            Assigned Intern Monitoring & Attendance
                        </p>
                    </div>
                </div>
            </div>

            {/* Mentor Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600"><Users size={20} /></div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">My Interns</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-800 dark:text-white">0</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Currently Assigned</p>
                </div>
                
                <div className="glass-card bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600"><Activity size={20} /></div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">Avg Attendance</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-800 dark:text-white">--%</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Overall Performance</p>
                </div>

                <div className="glass-card bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600"><Clock size={20} /></div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">Pending Tasks</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-800 dark:text-white">0</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Requires Review</p>
                </div>
            </div>

            {/* Interns List Mockup */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-3">
                        <Briefcase size={20} className="text-sky-500" /> Allocated Students
                    </h2>
                </div>
                <div className="p-16 text-center">
                    <BookOpen size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 font-bold mb-2">No interns assigned to you yet.</p>
                    <p className="text-slate-400 text-sm">Once the HOD assigns candidates to your mentorship, they will appear here.</p>
                </div>
            </div>
        </div>
    );
};

export default MentorDashboard;
