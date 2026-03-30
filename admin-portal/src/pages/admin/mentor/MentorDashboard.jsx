import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
    Users, BookOpen, Clock, Activity,
    Briefcase, ClipboardList, Send, FileText, Download,
    ChevronDown, ChevronUp, User, Mail, Calendar, CheckCircle, Video, FileCheck
} from 'lucide-react';
import WorkAssignmentModal from './WorkAssignmentModal';
import AttendanceModal from './AttendanceModal';

const MentorDashboard = () => {
    const { user } = useAuth();
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [showWorkModal, setShowWorkModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [expandedInternships, setExpandedInternships] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('Fetching mentor interns...');
            const res = await api.get('/admin/mentor/interns');
            console.log('API Response:', res.data);
            const internshipsData = res.data.data;
            console.log('Internships data:', internshipsData);

            setInternships(internshipsData);

            // Default expand the first one if exists
            if (internshipsData.length > 0) {
                setExpandedInternships({ [internshipsData[0].id]: true });
            }
        } catch (err) {
            console.error('Failed to fetch mentor dashboard data:', err);
            console.error('Error response:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleInternship = (id) => {
        setExpandedInternships(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAssignWork = (intern) => {
        setSelectedIntern(intern);
        setShowWorkModal(true);
    };

    const handleMarkAttendance = (intern) => {
        setSelectedIntern(intern);
        setShowAttendanceModal(true);
    };

    const generateReport = (internship) => {
        const headers = ["Name", "Roll Number", "College", "Status", "Attendance %"];
        const rows = internship.interns.map(i => [
            i.student.fullName,
            i.student.rollNumber || 'N/A',
            i.student.collegeName,
            i.status,
            i.attendance?.percentage || '0%'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${internship.title.replace(/[^a-z0-9]/gi, '_')}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Interns</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Manage your assigned interns</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="admin-stat-card border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Users size={22} className="text-blue-500 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{internships.reduce((sum, i) => sum + i.interns.length, 0)}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Total Interns</p>
                </div>

                <div className="admin-stat-card border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <Briefcase size={22} className="text-purple-500 dark:text-purple-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{internships.length}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Active Programs</p>
                </div>

                <div className="admin-stat-card border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <ClipboardList size={22} className="text-emerald-500 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">0</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Pending Tasks</p>
                </div>

                <div className="admin-stat-card border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Activity size={22} className="text-amber-500 dark:text-amber-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">0%</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Avg Attendance</p>
                </div>
            </div>

            {/* Internships List */}
            {internships.length === 0 ? (
                <div className="admin-card p-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8 flex items-center justify-center mx-auto mb-6">
                        <Users size={40} className="text-slate-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No Interns Assigned</h3>
                    <p className="text-slate-500 dark:text-gray-400 mb-8">Once candidates are hired and assigned to you, they will appear here for management.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {internships.map(internship => (
                        <div key={internship.id} className="admin-card p-0 overflow-hidden">
                            {/* Internship Header */}
                            <div
                                className="p-6 border-b border-gray-100 dark:border-border/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                onClick={() => toggleInternship(internship.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                                            <Briefcase size={24} className="text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{internship.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                                                {internship.interns.length} {internship.interns.length === 1 ? 'Intern' : 'Interns'} • Dept: {internship.internship?.department || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); generateReport(internship); }}
                                            className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors group"
                                            title="Generate Report"
                                        >
                                            <Download size={20} className="group-hover:scale-110 transition-transform text-slate-500 dark:text-gray-400" />
                                        </button>
                                        <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl">
                                            {expandedInternships[internship.id] ? (
                                                <ChevronUp size={24} className="text-slate-500 dark:text-gray-400" />
                                            ) : (
                                                <ChevronDown size={24} className="text-slate-500 dark:text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interns List */}
                            {expandedInternships[internship.id] && (
                                <div className="p-6 animate-in slide-in-from-top-4 duration-300">
                                    <div className="overflow-x-auto rounded-xl border border-border/50">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-white/5">
                                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Intern</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Attendance</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                {internship.interns.map(intern => (
                                                    <tr key={intern.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                                    {intern.student.fullName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{intern.student.fullName}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{intern.student.rollNumber || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                                                                    <Mail size={12} /> {intern.student?.user?.email || intern.student?.email || 'N/A'}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                                                                    <BookOpen size={12} /> {intern.student.collegeName}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${intern.status === 'HIRED' || intern.status === 'CA_APPROVED'
                                                                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                                    : intern.status === 'ONGOING'
                                                                        ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                                                                        : 'bg-slate-100 dark:bg-gray-500/10 text-slate-700 dark:text-gray-400 border border-slate-200 dark:border-gray-500/20'
                                                                }`}>
                                                                {intern.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {intern.attendance ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                                        <div
                                                                            className="bg-emerald-500 h-2 rounded-full transition-all"
                                                                            style={{ width: `${intern.attendance.percentage}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{intern.attendance.percentage}%</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">No records</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleMarkAttendance(intern)}
                                                                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                                                                >
                                                                    <CheckCircle size={14} /> Attendance
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAssignWork(intern)}
                                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
                                                                >
                                                                    <Send size={14} /> Assign Task
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showWorkModal && (
                <WorkAssignmentModal
                    application={selectedIntern}
                    onClose={(success) => {
                        setShowWorkModal(false);
                        if (success) fetchData();
                    }}
                />
            )}

            {showAttendanceModal && (
                <AttendanceModal
                    application={selectedIntern}
                    onClose={(success) => {
                        setShowAttendanceModal(false);
                        if (success) fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default MentorDashboard;
