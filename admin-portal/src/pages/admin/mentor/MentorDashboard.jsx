import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Network, Users, BookOpen, Clock, Activity, Briefcase } from 'lucide-react';

const MentorDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10 pb-20">
            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end mb-8 pt-4">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Mentorship Portal</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Active Mentoring Sessions</h2>
                </div>
                <div className="flex gap-3 text-right">
                    <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Current Period</p>
                        <p className="text-sm font-bold text-primary">MAR - APR 2024</p>
                    </div>
                </div>
            </section>

            {/* Bento Grid Stats */}
            <section className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Active Interns</span>
                    <div className="text-4xl font-extrabold text-primary mt-2">0</div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded w-fit uppercase">
                        <span className="material-symbols-outlined text-xs">group</span> Assigned Students
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Avg Attendance</span>
                    <div className="text-4xl font-extrabold text-primary mt-2">--%</div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit uppercase">
                         Engagement Score
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Pending Reviews</span>
                    <div className="text-4xl font-extrabold text-primary mt-2">0</div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit uppercase">
                        <span className="material-symbols-outlined text-xs">history_edu</span> Tasks
                    </div>
                </div>
            </section>

            {/* Allocated Students Table - Stitch Style */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Student Cohort</h3>
                        <p className="text-[10px] text-outline font-medium mt-0.5">Monitoring active learners under your guidance</p>
                    </div>
                    <div className="flex gap-2">
                         <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">download</span>
                    </div>
                </div>

                <div className="p-16 text-center bg-white">
                    <span className="material-symbols-outlined text-outline/30 text-6xl mb-4">school</span>
                    <p className="text-outline font-bold mb-2">No interns assigned yet</p>
                    <p className="text-outline/60 text-[10px] uppercase font-bold tracking-widest">Assignments will appear once finalized by HOD</p>
                </div>
            </div>
        </div>
    );
};

export default MentorDashboard;
