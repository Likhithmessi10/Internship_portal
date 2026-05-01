import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { Users, Building2, Mail, Phone, Calendar } from 'lucide-react';

const MentorCommittees = () => {
    const { user } = useAuth();
    const [committees, setCommittees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommittees = async () => {
            try {
                const res = await api.get('/admin/committees');
                const allCommittees = res.data.data || [];
                // Filter committees where this mentor is assigned
                const mentorCommittees = allCommittees.filter(c => c.mentorId === user.id);
                setCommittees(mentorCommittees);
            } catch (err) {
                console.error('Failed to fetch committees', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommittees();
    }, [user.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Committees</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Committee assignments and members</p>
                </div>
            </div>

            {committees.length === 0 ? (
                <div className="admin-card p-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8 flex items-center justify-center mx-auto mb-6">
                        <Building2 size={40} className="text-slate-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No Committee Assignments</h3>
                    <p className="text-slate-500 dark:text-gray-400">You are not assigned to any committees yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {committees.map(committee => (
                        <div key={committee.id} className="admin-card">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                                        <Users size={28} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {committee.internship?.title || 'Committee'}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                                            Department: {committee.internship?.department || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {/* HOD */}
                                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 size={16} className="text-slate-400 dark:text-gray-400" />
                                        <span className="text-xs font-semibold text-slate-400 dark:text-gray-400 uppercase">HOD (Member 1)</span>
                                    </div>
                                    {committee.hodId ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">HOD Name</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                                                <Mail size={12} /> hod@transco.com
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 dark:text-gray-500">Not assigned</p>
                                    )}
                                </div>

                                {/* Mentor */}
                                <div className="border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 bg-indigo-50/30 dark:bg-indigo-500/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Mentor (Member 2)</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">You</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                                            <Mail size={12} /> {user.email}
                                        </div>
                                    </div>
                                </div>

                                {/* PRTI Member */}
                                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users size={16} className="text-slate-400 dark:text-gray-400" />
                                        <span className="text-xs font-semibold text-slate-400 dark:text-gray-400 uppercase">PRTI Rep (Member 3)</span>
                                    </div>
                                    {committee.prtiMemberId ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">PRTI Member</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                                                <Mail size={12} /> prti@transco.com
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 dark:text-gray-500">Not assigned</p>
                                    )}
                                </div>
                            </div>

                            {/* Meeting Info */}
                            <div className="border-t border-slate-100 dark:border-border/50 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="space-y-3 w-full md:w-auto">
                                    <h4 className="text-sm font-semibold text-slate-400 dark:text-gray-400 uppercase">Meeting Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {committee.interviewDate && (
                                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                                <Calendar size={16} />
                                                <span>{new Date(committee.interviewDate).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {committee.meetLink && (
                                            <div className="flex items-center gap-3 text-sm text-blue-400">
                                                <Mail size={16} />
                                                <a href={committee.meetLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    Join Meeting
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <a 
                                    href="/prti/committee"
                                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Users size={16} /> START EVALUATION
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentorCommittees;
