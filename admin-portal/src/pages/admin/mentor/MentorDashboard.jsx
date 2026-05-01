import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
    Users, Briefcase, Activity, ClipboardList, Clock
} from 'lucide-react';
import InternshipCard from './components/InternshipCard';
import InternshipDetailView from './components/InternshipDetailView';

const MentorDashboard = () => {
    const { user } = useAuth();
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInternship, setSelectedInternship] = useState(null);

    const fetchInternships = async () => {
        setLoading(true);
        try {
            const res = await api.get('/mentor/internships');
            setInternships(res.data.data);
        } catch (err) {
            console.error('Failed to fetch mentor internships:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    // Computed stats
    const totalInterns = internships.reduce((sum, i) => sum + i.internCount, 0);
    const activePrograms = internships.filter(i => i.isActive).length;
    const avgAttendance = internships.length > 0
        ? Math.round(internships.reduce((sum, i) => sum + i.avgAttendance, 0) / internships.length)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Detail View
    if (selectedInternship) {
        return (
            <div className="p-8">
                <InternshipDetailView
                    internship={selectedInternship}
                    onBack={() => setSelectedInternship(null)}
                />
            </div>
        );
    }

    // Cards View
    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Welcome back, {user?.name || 'Mentor'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Manage your internships, interns, and track their progress.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
                            <Users size={20} className="text-blue-500" />
                        </div>
                        <span className="text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalInterns}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Interns</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center">
                            <Briefcase size={20} className="text-purple-500" />
                        </div>
                        <span className="text-xs font-semibold text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-lg">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{activePrograms}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Programs</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                            <Activity size={20} className="text-emerald-500" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">Avg</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{avgAttendance}%</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Attendance</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center">
                            <ClipboardList size={20} className="text-amber-500" />
                        </div>
                        <span className="text-xs font-semibold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{internships.length}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Internships</p>
                </div>
            </div>

            {/* Internship Cards Grid */}
            {internships.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-6">
                        <Briefcase size={40} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No Internships Assigned</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        You haven't been assigned to any internships yet. Once an HOD assigns you as a mentor, your internships and interns will appear here.
                    </p>
                </div>
            ) : (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Internships</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {internships.map(internship => (
                            <InternshipCard
                                key={internship.id}
                                internship={internship}
                                onClick={setSelectedInternship}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorDashboard;
