import React, { useState, useEffect } from 'react';
import api from '../../../../../utils/api';
import {
    Calendar, CheckCircle, XCircle, Users, Send, Clock
} from 'lucide-react';

const AttendanceTab = ({ internshipId }) => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceEntries, setAttendanceEntries] = useState({}); // { applicationId: boolean }
    const [submitting, setSubmitting] = useState(false);
    const [existingAttendance, setExistingAttendance] = useState({});

    const fetchInterns = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/mentor/internships/${internshipId}/interns?limit=100`);
            setInterns(res.data.data);

            // Initialize attendance entries
            const entries = {};
            const existing = {};
            res.data.data.forEach(intern => {
                entries[intern.id] = true; // Default to present
                // Check if already marked for selected date
                const log = intern.attendance?.attendanceLog || [];
                const dayEntry = log.find(l => l.date === selectedDate);
                if (dayEntry) {
                    entries[intern.id] = dayEntry.present;
                    existing[intern.id] = true;
                }
            });
            setAttendanceEntries(entries);
            setExistingAttendance(existing);
        } catch (err) {
            console.error('Failed to fetch interns:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterns();
    }, [internshipId, selectedDate]);

    const toggleAttendance = (applicationId) => {
        setAttendanceEntries(prev => ({ ...prev, [applicationId]: !prev[applicationId] }));
    };

    const markAll = (present) => {
        const entries = {};
        interns.forEach(intern => { entries[intern.id] = present; });
        setAttendanceEntries(entries);
    };

    const handleBulkSubmit = async () => {
        setSubmitting(true);
        try {
            const entries = Object.entries(attendanceEntries).map(([applicationId, present]) => ({
                applicationId,
                present
            }));

            await api.post('/mentor/attendance/bulk', {
                date: selectedDate,
                entries
            });

            alert(`Attendance marked for ${entries.length} intern(s)`);
            fetchInterns();
        } catch (err) {
            console.error('Failed to mark attendance:', err);
            alert(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    const presentCount = Object.values(attendanceEntries).filter(Boolean).length;
    const absentCount = interns.length - presentCount;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (interns.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Interns</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">No interns assigned to mark attendance for.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                            <button
                                onClick={() => markAll(true)}
                                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                                <CheckCircle size={14} /> Mark All Present
                            </button>
                            <button
                                onClick={() => markAll(false)}
                                className="px-3 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                                <XCircle size={14} /> Mark All Absent
                            </button>
                        </div>
                    </div>

                    {/* Summary Chips */}
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2 text-center">
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</p>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/60 dark:text-emerald-400/60">Present</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2 text-center">
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">{absentCount}</p>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-red-600/60 dark:text-red-400/60">Absent</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {interns.map(intern => {
                    const isPresent = attendanceEntries[intern.id];
                    const alreadyMarked = existingAttendance[intern.id];
                    const attendancePct = intern.progress?.attendancePct || 0;

                    return (
                        <div
                            key={intern.id}
                            onClick={() => toggleAttendance(intern.id)}
                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                                isPresent
                                    ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-400 dark:border-emerald-500/40'
                                    : 'bg-red-50 dark:bg-red-500/5 border-red-300 dark:border-red-500/30'
                            }`}
                        >
                            {alreadyMarked && (
                                <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    Updated
                                </span>
                            )}
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                    isPresent ? 'bg-emerald-500' : 'bg-red-400'
                                }`}>
                                    {isPresent ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{intern.student.fullName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{intern.student.rollNumber || intern.student.collegeName}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className={`text-xs font-bold ${isPresent ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {isPresent ? 'Present' : 'Absent'}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    Overall: {attendancePct}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 p-4 -mx-6 -mb-6 mt-6 rounded-b-2xl">
                <button
                    onClick={handleBulkSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    {submitting ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <>
                            <Send size={16} />
                            Save Attendance for {selectedDate} ({presentCount} Present, {absentCount} Absent)
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AttendanceTab;
