import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { FileBarChart, Download, Users, CheckCircle, TrendingUp } from 'lucide-react';

const MentorReports = () => {
    const { user } = useAuth();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const res = await api.get('/admin/mentor/interns');
                const internships = res.data.data || [];

                const totalInterns = internships.reduce((sum, i) => sum + i.interns.length, 0);
                const completed = internships.reduce((sum, i) => sum + i.interns.filter(int => int.status === 'COMPLETED').length, 0);
                const ongoing = internships.reduce((sum, i) => sum + i.interns.filter(int => int.status === 'ONGOING' || int.status === 'HIRED' || int.status === 'CA_APPROVED').length, 0);

                const allInterns = internships.flatMap(i => i.interns);
                const avgAttendance = allInterns.length > 0
                    ? Math.round(allInterns.reduce((sum, i) => sum + (i.attendance?.percentage || 0), 0) / allInterns.length)
                    : 0;

                setReportData({
                    totalInterns,
                    completed,
                    ongoing,
                    avgAttendance,
                    internships
                });
            } catch (err) {
                console.error('Failed to fetch report data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [user.id]);

    const downloadReport = () => {
        if (!reportData) return;

        const headers = ["Internship", "Intern", "Status", "Attendance %", "College"];
        const rows = reportData.internships.flatMap(i =>
            i.interns.map(intern => [
                i.title,
                intern.student.fullName,
                intern.status,
                intern.attendance?.percentage || '0%',
                intern.student.collegeName
            ])
        );

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `mentor_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Performance and progress reports</p>
                </div>
                <button
                    onClick={downloadReport}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                    <Download size={18} /> Export Report
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="admin-stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Users size={22} className="text-blue-500 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{reportData?.totalInterns || 0}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Total Interns</p>
                </div>

                <div className="admin-stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle size={22} className="text-emerald-500 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{reportData?.completed || 0}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Completed</p>
                </div>

                <div className="admin-stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <TrendingUp size={22} className="text-purple-500 dark:text-purple-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{reportData?.ongoing || 0}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Ongoing</p>
                </div>

                <div className="admin-stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <FileBarChart size={22} className="text-amber-500 dark:text-amber-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{reportData?.avgAttendance || 0}%</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Avg Attendance</p>
                </div>
            </div>

            {/* Detailed Report */}
            {reportData && reportData.internships.length > 0 && (
                <div className="admin-card p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Report</h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Breakdown by internship program</p>
                    </div>
                    <div className="p-6 space-y-6">
                        {reportData.internships.map(internship => (
                            <div key={internship.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{internship.title}</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-white/5">
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">Intern</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">Status</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">Attendance</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">College</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {internship.interns.map(intern => (
                                                <tr key={intern.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{intern.student.fullName}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${intern.status === 'HIRED' || intern.status === 'CA_APPROVED'
                                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                                : intern.status === 'ONGOING'
                                                                    ? 'bg-blue-500/10 text-blue-400'
                                                                    : 'bg-gray-500/10 text-gray-400'
                                                            }`}>
                                                            {intern.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                                                        {intern.attendance?.percentage || 0}%
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400">{intern.student.collegeName}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorReports;
