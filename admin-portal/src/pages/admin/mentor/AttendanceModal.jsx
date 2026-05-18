import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api, { MEDIA_URL } from '../../../utils/api';
import { CheckCircle, XCircle, Calendar, Clock, X, Upload, FileText, AlertTriangle, Award } from 'lucide-react';

const AttendanceModal = ({ application, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [attendanceData, setAttendanceData] = useState(null);
    
    // Form fields
    const [totalDays, setTotalDays] = useState('');
    const [daysAttended, setDaysAttended] = useState('');
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');

    useEffect(() => {
        if (application?.id) {
            fetchAttendance();
        }
    }, [application?.id]);

    const fetchAttendance = async () => {
        try {
            const res = await api.get(`/mentor/attendance?applicationId=${application.id}`);
            const data = res.data.data;
            setAttendanceData(data);
            if (data) {
                setTotalDays(data.totalDays || '');
                setDaysAttended(data.daysAttended || '');
            }
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        // Support Images, PDFs, and Excel formats
        const isPdf = selected.type === 'application/pdf';
        const isImg = /^image\/(jpeg|jpg|png)$/i.test(selected.type);
        const isExcel = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ].includes(selected.type) || /\.(xls|xlsx)$/i.test(selected.name);

        if (!isPdf && !isImg && !isExcel) {
            setFileError('Invalid file type. Please upload a valid PDF, Image, or Excel sheet.');
            setFile(null);
            return;
        }

        if (selected.size > 10 * 1024 * 1024) { // 10MB limit
            setFileError('File size too large. Maximum size is 10MB.');
            setFile(null);
            return;
        }

        setFileError('');
        setFile(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!totalDays || !daysAttended) {
            alert('Please specify both total working days and days attended.');
            return;
        }

        if (parseInt(daysAttended) > parseInt(totalDays)) {
            alert('Days attended cannot exceed total working days.');
            return;
        }

        if (!attendanceData?.fileUrl && !file) {
            alert('Please upload an attendance sheet (PDF, Image, or Excel).');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('applicationId', application.id);
            formData.append('totalDays', totalDays);
            formData.append('daysAttended', daysAttended);
            if (file) {
                formData.append('file', file);
            }

            await api.post('/mentor/attendance', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Attendance details updated successfully!');
            fetchAttendance();
            onClose(true); // Close and refresh list
        } catch (err) {
            console.error('Failed to save attendance:', err);
            alert(err.response?.data?.message || 'Failed to save attendance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleIssueCertificate = async () => {
        if (!window.confirm("Are you sure you want to issue the certificate and mark this student's internship as COMPLETED?")) return;
        setIssuing(true);
        try {
            await api.put(`/admin/applications/${application.id}`, { status: 'COMPLETED' });
            alert("Certificate issued successfully! Internship is now marked as COMPLETED.");
            onClose(true);
        } catch (err) {
            console.error("Failed to issue certificate", err);
            alert(err.response?.data?.message || "Failed to issue certificate.");
        } finally {
            setIssuing(false);
        }
    };

    const attendancePercentage = attendanceData?.totalDays > 0
        ? Math.round((attendanceData.daysAttended / attendanceData.totalDays) * 100)
        : 0;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => onClose()} />
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 z-10 border border-white/20">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-gradient-to-r from-indigo-700 to-indigo-600 text-white">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Calendar size={24} /> Simplified Attendance Sheet
                        </h3>
                        <p className="text-[10px] text-white/70 uppercase font-black mt-1 tracking-widest">
                            {application?.student?.fullName}
                        </p>
                    </div>
                    <button onClick={() => onClose()} className="hover:bg-white/20 p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-6">
                    {/* Current Attendance Summary */}
                    {attendanceData && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">Current Summary</h4>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${attendancePercentage >= 90
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                                }`}>
                                    {attendancePercentage >= 90 ? '90%+ On Track' : 'Needs Attention'}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{attendanceData.daysAttended}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Days Attended</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{attendanceData.totalDays}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Days</p>
                                </div>
                                <div>
                                    <p className={`text-2xl font-black ${attendancePercentage >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{attendancePercentage}%</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Percentage</p>
                                </div>
                            </div>

                            {attendanceData.fileUrl && (
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-medium">Uploaded Sheet:</span>
                                    <a
                                        href={`${MEDIA_URL}/${attendanceData.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider text-[10px]"
                                    >
                                        <FileText size={14} /> View File
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Working Days</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="e.g. 30"
                                    value={totalDays}
                                    onChange={(e) => setTotalDays(e.target.value)}
                                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Days Attended</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    placeholder="e.g. 28"
                                    value={daysAttended}
                                    onChange={(e) => setDaysAttended(e.target.value)}
                                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {attendanceData?.fileUrl ? 'Replace Attendance Sheet (Optional)' : 'Attendance Sheet (PDF, Excel, or Image)'}
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,image/*,.xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                            {fileError && <p className="text-[10px] text-red-500 font-bold mt-1">{fileError}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Saving Details...' : <><Upload size={18} /> Update Attendance Details</>}
                        </button>
                    </form>

                    {/* Low Attendance Alert & Force Issue Certificate */}
                    {attendanceData && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            {attendancePercentage < 90 && (
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
                                    <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5 animate-pulse" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wider">Low Attendance Alert ({attendancePercentage}%)</p>
                                        <p className="text-[11px] font-medium opacity-80 mt-0.5">This candidate does not meet the minimum required 90% attendance. You can still choose to issue the certificate under special approval.</p>
                                    </div>
                                </div>
                            )}

                            {application.status !== 'COMPLETED' ? (
                                <button
                                    onClick={handleIssueCertificate}
                                    disabled={issuing}
                                    className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 ${
                                        attendancePercentage < 90
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                    }`}
                                >
                                    <Award size={18} /> {attendancePercentage < 90 ? 'Force Issue Certificate anyway' : 'Issue Certificate & Complete'}
                                </button>
                            ) : (
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-400">
                                    <CheckCircle size={18} className="text-emerald-600" />
                                    <span className="text-xs font-black uppercase tracking-wider">Internship Completed & Certificate Issued</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AttendanceModal;
