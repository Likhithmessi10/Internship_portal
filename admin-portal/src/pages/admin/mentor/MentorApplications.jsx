import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { FileText, Search, Filter, Download, Mail, Phone, Calendar, User, Briefcase } from 'lucide-react';

const MentorApplications = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                // Get all internships first
                const intRes = await api.get('/admin/internships');
                const allInternships = intRes.data.data || [];

                // Get applications for each internship where this mentor is assigned
                const appsPromises = allInternships.map(internship =>
                    api.get(`/admin/internships/${internship.id}/applications`)
                );
                const appsResults = await Promise.allSettled(appsPromises);
                const allApps = appsResults
                    .filter(result => result.status === 'fulfilled')
                    .flatMap(result => result.value.data.data || [])
                    .filter(app => app.mentorId === user.id);

                setApplications(allApps);
            } catch (err) {
                console.error('Failed to fetch applications', err);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, [user.id]);

    const filteredApps = applications.filter(app =>
        app.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student?.collegeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Applications</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">View applications for your assigned internships</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or college..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-input pl-12"
                />
            </div>

            {/* Applications Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : filteredApps.length === 0 ? (
                <div className="admin-card p-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8 flex items-center justify-center mx-auto mb-6">
                        <FileText size={40} className="text-slate-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No Applications Found</h3>
                    <p className="text-slate-500 dark:text-gray-400">There are no applications assigned to you yet.</p>
                </div>
            ) : (
                <div className="admin-card p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/5">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Internship</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Applied Date</th>
                            </tr>
                        </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredApps.map(app => (
                                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {app.student?.fullName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{app.student?.fullName}</p>
                                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{app.student?.collegeName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{app.internship?.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{app.assignedRole || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${app.status === 'HIRED' || app.status === 'CA_APPROVED'
                                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                : app.status === 'ONGOING'
                                                    ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                                                    : 'bg-slate-100 dark:bg-gray-500/10 text-slate-700 dark:text-gray-400 border border-slate-200 dark:border-gray-500/20'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-gray-400">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MentorApplications;
