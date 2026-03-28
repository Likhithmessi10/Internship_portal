import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
    Network, Users, BookOpen, Clock, Activity,
    Briefcase, ClipboardList, Send, FileText, Download,
    ChevronDown, ChevronUp, User, Mail, Calendar, CheckCircle, XCircle
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
            const res = await api.get('/admin/mentor/interns');
            const internshipsData = res.data.data;

            // Fetch attendance for all interns
            const attendanceRes = await api.get('/admin/attendance');
            const attendanceData = attendanceRes.data.data || [];

            // Merge attendance data with internships
            const mergedData = internshipsData.map(internship => ({
                ...internship,
                interns: internship.interns.map(intern => {
                    const attendance = attendanceData.find(a => a.applicationId === intern.id);
                    return {
                        ...intern,
                        attendance: attendance ? {
                            daysAttended: attendance.daysAttended,
                            totalDays: attendance.totalDays,
                            meetsMinimum: attendance.meetsMinimum,
                            percentage: attendance.totalDays > 0
                                ? Math.round((attendance.daysAttended / attendance.totalDays) * 100)
                                : 0
                        } : null
                    };
                })
            }));

            setInternships(mergedData);

            // Default expand the first one if exists
            if (mergedData.length > 0) {
                setExpandedInternships({ [mergedData[0].id]: true });
            }
        } catch (err) {
            console.error('Failed to fetch mentor dashboard data');
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
        // Simple CSV generation for now
        const headers = ["Name", "Roll Number", "College", "Task Count", "Status"];
        const rows = internship.interns.map(i => [
            i.student.fullName,
            i.student.rollNumber || 'N/A',
            i.student.collegeName,
            i.workAssignments?.length || 0,
            i.status
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Internship_Report_${internship.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-surface-container-low">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-outline">Loading Sessions...</p>
            </div>
        </div>
    );

    const totalInterns = internships.reduce((sum, int) => sum + int.interns.length, 0);

    // Calculate average attendance
    const avgAttendance = internships.reduce((sum, int) => {
        const internSum = int.interns.reduce((iSum, intern) => {
            return iSum + (intern.attendance?.percentage || 0);
        }, 0);
        return sum + internSum;
    }, 0) / (totalInterns || 1);

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-fade-in relative z-10 pb-32 pt-8">
            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-outline uppercase mb-2 block animate-slide-in-up">Mentorship Portal</span>
                    <h2 className="text-5xl font-black text-primary tracking-tighter leading-none animate-slide-in-up delay-75">
                        Active Guidance <span className="text-outline-variant font-light">&</span> Sessions
                    </h2>
                </div>
                <div className="flex gap-6 text-right animate-slide-in-up delay-150">
                    <div className="p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Current Period</p>
                        <p className="text-lg font-black text-primary">MAR - APR 2024</p>
                    </div>
                </div>
            </section>

            {/* Bento Grid Stats */}
            <section className="grid grid-cols-12 gap-6">
                <StatCard
                    label="Active Interns"
                    value={totalInterns}
                    icon="group"
                    color="sky"
                    sub="Assigned Students"
                />
                <StatCard
                    label="Avg Attendance"
                    value={`${Math.round(avgAttendance)}%`}
                    icon="timeline"
                    color="emerald"
                    sub="Engagement Score"
                />
                <StatCard
                    label="Pending Tasks"
                    value={internships.reduce((sum, int) => sum + int.interns.reduce((s, i) => s + (i.workAssignments?.filter(w => w.status === 'PENDING').length || 0), 0), 0)}
                    icon="history_edu"
                    color="amber"
                    sub="Requires Review"
                />
            </section>

            {/* Internship Grouped Rows */}
            <div className="space-y-6">
                {internships.map(int => (
                    <div key={int.id} className="bg-white rounded-[2rem] overflow-hidden border border-outline-variant/20 shadow-xl shadow-primary/5 transition-all duration-300">
                        {/* Group Header */}
                        <div
                            onClick={() => toggleInternship(int.id)}
                            className="p-8 flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors select-none"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center text-primary border border-primary/10">
                                    <Briefcase size={32} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-primary tracking-tight">{int.title}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-outline bg-surface-container-high px-3 py-1 rounded-full">
                                            <Users size={12} strokeWidth={3} /> {int.interns.length} INTERNS
                                        </span>
                                        <span className="text-[10px] font-black text-outline/40 uppercase tracking-widest">•</span>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Dept: {int.interns[0].internship.department}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); generateReport(int); }}
                                    className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-white transition-all duration-300 group"
                                    title="Generate Internship Report"
                                >
                                    <Download size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <div className="p-3 bg-surface-container-high rounded-2xl text-outline">
                                    {expandedInternships[int.id] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>
                        </div>

                        {/* Interns List */}
                        {expandedInternships[int.id] && (
                            <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                                <div className="overflow-x-auto rounded-2xl border border-outline-variant/10">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-container-low">
                                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Intern Identity</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Contact & College</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Attendance</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Task Progress</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/10">
                                            {int.interns.map(intern => (
                                                <tr key={intern.id} className="hover:bg-primary/[0.01] transition-colors group">
                                                    <td className="px-6 py-6 font-bold">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-surface-container-high rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-primary group-hover:border-primary/20 transition-all">
                                                                {intern.student.photoUrl ? (
                                                                    <img src={intern.student.photoUrl} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User size={24} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-primary leading-tight">{intern.student.fullName}</p>
                                                                <p className="text-[10px] text-outline font-bold mt-0.5 tracking-wider uppercase">{intern.student.rollNumber || 'PENDING ID'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-[11px] font-bold text-outline">
                                                                <Mail size={12} /> {intern.student.email || 'no-email@transco.in'}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-primary truncate max-w-[200px] uppercase">
                                                                <BookOpen size={12} /> {intern.student.collegeName}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col gap-2">
                                                            {intern.attendance ? (
                                                                <>
                                                                    <div className="flex justify-between items-end mb-1">
                                                                        <span className="text-[10px] font-black text-outline uppercase tracking-tighter">
                                                                            {intern.attendance.meetsMinimum ? (
                                                                                <span className="text-emerald-600 flex items-center gap-1">
                                                                                    <CheckCircle size={10} /> On Track
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-amber-600 flex items-center gap-1">
                                                                                    <Clock size={10} /> Needs Attention
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <span className="text-[10px] font-black text-primary uppercase">{intern.attendance.percentage}%</span>
                                                                    </div>
                                                                    <div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all duration-1000 ${intern.attendance.meetsMinimum ? 'bg-emerald-500' : 'bg-amber-500'
                                                                                }`}
                                                                            style={{ width: `${intern.attendance.percentage}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-[9px] text-outline font-bold">
                                                                        {intern.attendance.daysAttended}/{intern.attendance.totalDays} days
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <p className="text-[10px] text-outline/40 font-bold uppercase">No records</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <span className="text-[10px] font-black text-outline uppercase tracking-tighter">Tasks completed: {intern.workAssignments?.filter(w => w.status === 'COMPLETED').length || 0}</span>
                                                                <span className="text-[10px] font-black text-primary uppercase">{intern.workAssignments?.length > 0 ? Math.round((intern.workAssignments?.filter(w => w.status === 'COMPLETED').length / intern.workAssignments?.length) * 100) : 0}%</span>
                                                            </div>
                                                            <div className="w-48 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all duration-1000"
                                                                    style={{ width: `${intern.workAssignments?.length > 0 ? (intern.workAssignments?.filter(w => w.status === 'COMPLETED').length / intern.workAssignments?.length) * 100 : 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-right">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <button
                                                                onClick={() => handleMarkAttendance(intern)}
                                                                className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black rounded-xl hover:bg-emerald-100 transition-all shadow-sm inline-flex items-center gap-2 uppercase tracking-widest"
                                                            >
                                                                <CheckCircle size={14} /> Attendance
                                                            </button>
                                                            <button
                                                                onClick={() => handleAssignWork(intern)}
                                                                className="px-5 py-2.5 bg-primary text-white text-[10px] font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20 inline-flex items-center gap-2 uppercase tracking-widest"
                                                            >
                                                                <ClipboardList size={14} /> Assign Task
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

                {internships.length === 0 && (
                    <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-outline-variant/30">
                        <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6 text-outline/20">
                            <span className="material-symbols-outlined text-5xl">school</span>
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-2">No assigned interns</h3>
                        <p className="text-outline/60 text-sm font-bold uppercase tracking-[0.2em]">Assignments will appear once finalized by HOD</p>
                    </div>
                )}
            </div>

            {showWorkModal && selectedIntern && (
                <WorkAssignmentModal
                    application={selectedIntern}
                    onClose={(success) => {
                        setShowWorkModal(false);
                        if (success) fetchData();
                    }}
                />
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, color, sub }) => (
    <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2rem] border border-outline-variant/20 shadow-xl shadow-primary/5 group hover:border-primary/30 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">{label}</span>
            <div className={`w-12 h-12 bg-${color}-500/10 text-${color}-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-symbols-outlined text-2xl font-black">{icon}</span>
            </div>
        </div>
        <div className="text-5xl font-black text-primary tracking-tighter mt-2 group-hover:translate-x-1 transition-transform">{value}</div>
        <div className={`mt-6 flex items-center gap-2 text-[10px] font-black text-${color}-600 bg-${color}-50/50 px-4 py-2 rounded-xl w-fit uppercase tracking-widest border border-${color}-100`}>
            {sub}
        </div>
    </div>
);

export default MentorDashboard;
