import React, { useState, useEffect } from 'react';
import {
    Search, User, Briefcase, GraduationCap, Calendar,
    Clock, CheckCircle, XCircle, AlertCircle, Mail,
    Phone, MapPin, Award, BookOpen, ClipboardList,
    TrendingUp, FileText, Landmark, Zap, ExternalLink,
    ScrollText, ListChecks, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../../utils/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CandidateSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Work log state — keyed by applicationId
    const [workLogs, setWorkLogs] = useState({});
    const [loadingLogs, setLoadingLogs] = useState({});

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError(null);
        setWorkLogs({});
        try {
            const res = await api.get(`/admin/interns/search/${searchQuery.trim()}`);
            setStudentData(res.data.data);
            setActiveTab('overview');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to find student. Please verify the roll number.');
            setStudentData(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch work logs when logs tab is opened
    useEffect(() => {
        if (activeTab !== 'logs' || !studentData) return;
        const activeApps = studentData.applications?.filter(a =>
            ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)
        ) || [];
        activeApps.forEach(app => {
            if (workLogs[app.id] !== undefined) return; // already fetched
            setLoadingLogs(prev => ({ ...prev, [app.id]: true }));
            api.get(`/admin/applications/${app.id}/work-logs`)
                .then(r => setWorkLogs(prev => ({ ...prev, [app.id]: r.data.data || [] })))
                .catch(() => setWorkLogs(prev => ({ ...prev, [app.id]: [] })))
                .finally(() => setLoadingLogs(prev => ({ ...prev, [app.id]: false })));
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, studentData]);

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';

    const InfoItem = ({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md group">
            {Icon && <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform"><Icon size={18} /></div>}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value || 'Not Provided'}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Standard Header Section */}
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Talent Management</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight font-rajdhani">Candidate Search</h2>
                </div>
                <div className="hidden md:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Institutional Student Intelligence</p>
                    <p className="text-[8px] text-slate-300 font-bold uppercase text-right">v2.0 Stable Build</p>
                </div>
            </header>

            {/* Standard Search Section */}
            <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Enter Roll Number to explore (e.g. 260101001)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface-container-lowest border-none rounded-xl pl-12 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-subtle placeholder:text-outline/40"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-primary text-white rounded-xl text-xs font-black tracking-widest hover:opacity-90 shadow-md transition-all uppercase disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <><Zap size={16} /> Explore Profile</>
                        )}
                    </button>
                </form>
            </section>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 flex items-center gap-4 text-red-600 dark:text-red-400 animate-in slide-in-from-top-4">
                    <AlertCircle size={24} />
                    <p className="text-sm font-black uppercase tracking-widest">{error}</p>
                </div>
            )}

            {!studentData && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-24 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
                    <div className="w-20 h-20 bg-surface-container-lowest rounded-2xl shadow-subtle flex items-center justify-center text-outline mb-6">
                        <User size={40} />
                    </div>
                    <h2 className="text-lg font-black text-primary uppercase tracking-tighter">Enter a Roll Number</h2>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mt-2">To view complete intelligence profile</p>
                </div>
            )}

            {studentData && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Student Profile Overview Banner */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden border border-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 p-1 flex-shrink-0">
                                <div className="w-full h-full rounded-xl bg-white/5 flex items-center justify-center text-3xl font-black overflow-hidden">
                                    {studentData.photoUrl ? (
                                        <img src={`${api.defaults.baseURL.replace('/api/v1', '')}/${studentData.photoUrl}`} alt={studentData.fullName} className="w-full h-full object-cover" />
                                    ) : studentData.fullName?.charAt(0)}
                                </div>
                            </div>
                            
                            <div className="flex-1 text-center lg:text-left">
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-white/10 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <Zap size={10} className="text-yellow-400" /> Roll No: {studentData.rollNumber}
                                    </span>
                                    <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                        Verified
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black font-rajdhani tracking-tight mb-1">{studentData.fullName}</h2>
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 text-slate-300 text-xs font-medium">
                                    <span className="flex items-center gap-1.5"><Mail size={14} /> {studentData.user?.email}</span>
                                    <span className="flex items-center gap-1.5"><Phone size={14} /> {studentData.phone}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> Created: {formatDate(studentData.user?.createdAt)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 shrink-0 min-w-[200px]">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Applications</p>
                                    <p className="text-xl font-black">{studentData.applications?.length || 0}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Active</p>
                                    <p className="text-xl font-black">{studentData.applications?.filter(a => ['HIRED', 'APPROVED'].includes(a.status)).length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex overflow-x-auto pb-1 gap-1.5 custom-scrollbar">
                        {[
                            { id: 'overview',     label: 'Overview',     icon: TrendingUp  },
                            { id: 'personal',     label: 'Personal',     icon: User        },
                            { id: 'academic',     label: 'Academic',     icon: GraduationCap },
                            { id: 'experience',   label: 'Experience',   icon: BookOpen    },
                            { id: 'logs',         label: 'Daily Logs',   icon: ScrollText  },
                            { id: 'assignments',  label: 'Assignments',  icon: ListChecks  },
                            { id: 'history',      label: 'History',      icon: Clock       }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0
                                    ${activeTab === tab.id 
                                        ? 'bg-primary text-white shadow-md' 
                                        : 'bg-surface-container-low text-outline hover:text-primary border border-outline-variant/10'}`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            {activeTab === 'overview' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Award size={16} className="text-primary" /> Active Enrollments
                                    </h3>
                                    <div className="grid gap-4">
                                        {studentData.applications?.filter(a => ['HIRED', 'APPROVED'].includes(a.status)).map(app => (
                                            <div key={app.id} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm relative group overflow-hidden">
                                                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                                                    <div className="space-y-3 flex-1">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded tracking-widest">Active</span>
                                                                <span className="text-[9px] font-bold text-outline uppercase">{app.internship?.department}</span>
                                                            </div>
                                                            <h4 className="text-lg font-black text-primary uppercase leading-tight">{app.internship?.title}</h4>
                                                            <p className="text-xs font-bold text-primary opacity-70 uppercase tracking-widest">{app.assignedRole || 'Associate Intern'}</p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <User size={14} className="text-outline" />
                                                                <div>
                                                                    <p className="text-[8px] font-black text-outline uppercase">Mentor</p>
                                                                    <p className="text-xs font-bold text-primary">{app.mentor?.name || 'Unassigned'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={14} className="text-outline" />
                                                                <div>
                                                                    <p className="text-[8px] font-black text-outline uppercase">Duration</p>
                                                                    <p className="text-xs font-bold text-primary">{formatDate(app.joiningDate)} - {formatDate(app.endDate)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Recent Task Submissions inside app card */}
                                                        {app.workAssignments?.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-outline-variant/10">
                                                                <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-2">Recent Tasks</p>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {app.workAssignments.slice(0, 2).map(work => (
                                                                        <div key={work.id} className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg border border-outline-variant/5">
                                                                            <div className="flex items-center gap-2 truncate">
                                                                                <ClipboardList size={12} className="text-primary shrink-0" />
                                                                                <p className="text-[10px] font-bold text-primary truncate">{work.title}</p>
                                                                            </div>
                                                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${work.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                                                                {work.status}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="md:w-56 space-y-3">
                                                        <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <p className="text-[9px] font-black text-outline uppercase tracking-widest">Attendance</p>
                                                                <span className="text-xs font-black text-emerald-500">
                                                                    {app.attendance?.totalDays > 0 ? Math.round((app.attendance.daysAttended / app.attendance.totalDays) * 100) : 0}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-emerald-500 rounded-full" 
                                                                    style={{ width: `${app.attendance?.totalDays > 0 ? (app.attendance.daysAttended / app.attendance.totalDays) * 100 : 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">Stipend</p>
                                                            <p className="text-[10px] font-black text-primary uppercase">{app.stipend?.approvalStatus || 'Pending'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {studentData.applications?.filter(a => ['HIRED', 'APPROVED'].includes(a.status)).length === 0 && (
                                            <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20">
                                                <p className="text-xs font-bold text-outline uppercase tracking-widest">No Active Internship Found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'personal' && (
                                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 shadow-sm space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InfoItem icon={User} label="Full Name" value={studentData.fullName} />
                                        <InfoItem icon={Zap} label="Roll Number" value={studentData.rollNumber} />
                                        <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(studentData.dob)} />
                                        <InfoItem icon={FileText} label="Aadhaar" value={studentData.aadhaarNumber} />
                                        <InfoItem icon={Mail} label="Email" value={studentData.user?.email} />
                                        <InfoItem icon={Phone} label="Phone" value={studentData.phone} />
                                        <div className="md:col-span-2">
                                            <InfoItem icon={MapPin} label="Address" value={studentData.address} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'academic' && (
                                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 shadow-sm space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <InfoItem icon={Landmark} label="College" value={studentData.collegeName} />
                                        </div>
                                        <InfoItem icon={GraduationCap} label="Degree" value={`${studentData.degree} - ${studentData.branch}`} />
                                        <InfoItem icon={TrendingUp} label="CGPA" value={studentData.cgpa} />
                                        <InfoItem icon={Calendar} label="Year" value={`${studentData.yearOfStudy} Year`} />
                                        <InfoItem icon={Award} label="Category" value={`${studentData.collegeCategory} (NIRF: ${studentData.nirfRanking || 'N/A'})`} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'experience' && (
                                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 shadow-sm space-y-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Briefcase size={14} /> Professional Experience
                                            </h4>
                                            <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/10 min-h-[80px]">
                                                <p className="text-xs font-medium text-primary leading-relaxed whitespace-pre-wrap">
                                                    {studentData.experienceDesc || 'No experience listed.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <BookOpen size={14} /> Academic Projects
                                            </h4>
                                            <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/10 min-h-[80px]">
                                                <p className="text-xs font-medium text-primary leading-relaxed whitespace-pre-wrap">
                                                    {studentData.projectsDesc || 'No projects listed.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Zap size={14} /> Skills
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {studentData.skills?.split(',').map((skill, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-tight border border-primary/10">
                                                        {skill.trim()}
                                                    </span>
                                                )) || <p className="text-[10px] font-bold text-outline uppercase tracking-widest">No skills</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Daily Logs tab ── */}
                            {activeTab === 'logs' && (() => {
                                const activeApps = studentData.applications?.filter(a =>
                                    ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)
                                ) || [];
                                if (activeApps.length === 0) return (
                                    <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20">
                                        <ScrollText size={32} className="mx-auto text-outline/30 mb-3" />
                                        <p className="text-xs font-bold text-outline uppercase tracking-widest">No active internship — logs unavailable</p>
                                    </div>
                                );
                                return (
                                    <div className="space-y-6">
                                        {activeApps.map(app => {
                                            const logs = workLogs[app.id] || [];
                                            const isLoading = loadingLogs[app.id];
                                            const totalHours = logs.reduce((s, l) => s + (l.hoursWorked || 0), 0);
                                            return (
                                                <div key={app.id} className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl overflow-hidden shadow-sm">
                                                    <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50">
                                                        <div>
                                                            <p className="text-xs font-black text-primary uppercase tracking-tight">{app.internship?.title}</p>
                                                            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-0.5">{app.internship?.department}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase">{logs.length} entries</span>
                                                            {totalHours > 0 && <span className="text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg uppercase">{totalHours}h total</span>}
                                                        </div>
                                                    </div>
                                                    {isLoading ? (
                                                        <div className="flex justify-center py-10">
                                                            <Loader2 size={22} className="animate-spin text-primary/40" />
                                                        </div>
                                                    ) : logs.length === 0 ? (
                                                        <p className="text-center py-10 text-[10px] font-bold text-outline uppercase tracking-widest">No daily logs submitted yet</p>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left min-w-[520px]">
                                                                <thead>
                                                                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                                                                        {['#', 'Date', 'Day', 'Work Done', 'Hours'].map(h => (
                                                                            <th key={h} className="px-5 py-2.5 text-[9px] font-black text-outline uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 whitespace-nowrap">{h}</th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                    {logs.map((log, i) => {
                                                                        const d = new Date(log.date);
                                                                        return (
                                                                            <tr key={log.id} className={i % 2 === 0 ? '' : 'bg-slate-50/60 dark:bg-slate-800/20'}>
                                                                                <td className="px-5 py-3 text-[10px] font-black text-outline">{i + 1}</td>
                                                                                <td className="px-5 py-3 text-xs font-bold text-primary whitespace-nowrap">{d.toLocaleDateString('en-IN')}</td>
                                                                                <td className="px-5 py-3 text-[10px] font-bold text-outline">{DAYS[d.getDay()]}</td>
                                                                                <td className="px-5 py-3 text-xs text-slate-700 dark:text-slate-300 max-w-xs">
                                                                                    <p className="line-clamp-2 leading-relaxed">{log.description}</p>
                                                                                </td>
                                                                                <td className="px-5 py-3 text-xs font-black text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                                    {log.hoursWorked != null ? `${log.hoursWorked}h` : '—'}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* ── Assignments tab ── */}
                            {activeTab === 'assignments' && (() => {
                                const activeApps = studentData.applications?.filter(a =>
                                    ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)
                                ) || [];
                                if (activeApps.length === 0) return (
                                    <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20">
                                        <ListChecks size={32} className="mx-auto text-outline/30 mb-3" />
                                        <p className="text-xs font-bold text-outline uppercase tracking-widest">No active internship — assignments unavailable</p>
                                    </div>
                                );
                                return (
                                    <div className="space-y-6">
                                        {activeApps.map(app => {
                                            const assignments = app.workAssignments || [];
                                            const done  = assignments.filter(a => a.status === 'COMPLETED').length;
                                            const total = assignments.length;
                                            return (
                                                <div key={app.id} className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl overflow-hidden shadow-sm">
                                                    <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50">
                                                        <div>
                                                            <p className="text-xs font-black text-primary uppercase tracking-tight">{app.internship?.title}</p>
                                                            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-0.5">{app.internship?.department}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase">{total} tasks</span>
                                                            {total > 0 && <span className="text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg uppercase">{done}/{total} done</span>}
                                                        </div>
                                                    </div>
                                                    {total === 0 ? (
                                                        <p className="text-center py-10 text-[10px] font-bold text-outline uppercase tracking-widest">No assignments yet</p>
                                                    ) : (
                                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {assignments.map((task, i) => (
                                                                <div key={task.id} className={`px-6 py-4 flex items-start justify-between gap-4 ${i % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-800/20' : ''}`}>
                                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                            {task.status === 'COMPLETED' ? <CheckCircle size={13} /> : <Clock size={13} />}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-bold text-primary truncate">{task.title}</p>
                                                                            {task.description && <p className="text-[10px] text-outline font-medium mt-0.5 line-clamp-2">{task.description}</p>}
                                                                            {task.submittedAt && <p className="text-[9px] font-bold text-outline/60 uppercase tracking-widest mt-1">Submitted {formatDate(task.submittedAt)}</p>}
                                                                            {task.submissionText && (
                                                                                <div className="mt-2 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/10 text-[10px] text-primary font-medium leading-relaxed">
                                                                                    {task.submissionText}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="shrink-0 text-right space-y-1">
                                                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                                            task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                            : task.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        }`}>{task.status}</span>
                                                                        {task.dueDate && <p className="text-[9px] font-bold text-outline/60 uppercase">Due {formatDate(task.dueDate)}</p>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {activeTab === 'history' && (
                                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 shadow-sm">
                                    <div className="space-y-3">
                                        {studentData.applications?.map(app => (
                                            <div key={app.id} className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/10 flex items-center justify-between transition-all hover:bg-surface-container-low">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm 
                                                        ${['HIRED', 'APPROVED'].includes(app.status) ? 'bg-emerald-500 text-white' : 
                                                        app.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-amber-400 text-primary'}`}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-black text-primary uppercase tracking-tight leading-none mb-1">{app.internship?.title}</h5>
                                                        <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Applied {formatDate(app.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest
                                                    ${['HIRED', 'APPROVED'].includes(app.status) ? 'bg-emerald-500/10 text-emerald-600' : 
                                                    app.status === 'REJECTED' ? 'bg-red-500/10 text-red-600' : 'bg-amber-400/10 text-amber-700'}`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Actions - Compact */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            {/* Digital Footprint */}
                            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 shadow-sm space-y-4">
                                <h4 className="text-[9px] font-black text-outline uppercase tracking-widest">Digital Footprint</h4>
                                <div className="space-y-2">
                                    <a href={studentData.linkedinUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 group hover:border-primary transition-all no-underline ${!studentData.linkedinUrl && 'opacity-50 pointer-events-none'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-[#0077b5] text-white rounded-lg"><TrendingUp size={14} /></div>
                                            <span className="text-[10px] font-bold text-primary uppercase">LinkedIn</span>
                                        </div>
                                        <ExternalLink size={12} className="text-outline group-hover:text-primary" />
                                    </a>
                                    <a href={studentData.githubUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 group hover:border-slate-900 transition-all no-underline ${!studentData.githubUrl && 'opacity-50 pointer-events-none'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-900 text-white rounded-lg"><FileText size={14} /></div>
                                            <span className="text-[10px] font-bold text-primary uppercase">GitHub</span>
                                        </div>
                                        <ExternalLink size={12} className="text-outline group-hover:text-slate-900" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateSearch;
