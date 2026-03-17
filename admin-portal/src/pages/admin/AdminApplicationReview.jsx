import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ApplicationProfileModal from './ApplicationProfileModal';
import { ArrowLeft, Download, Users, CheckCircle, Clock, XCircle, Eye, TrendingUp, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const FILTERS = ['All', 'PENDING', 'SHORTLISTED', 'HIRED', 'REJECTED'];

const StatusBadge = ({ status }) => {
    const map = {
        PENDING: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-sm shadow-amber-500/5',
        SHORTLISTED: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 shadow-sm shadow-blue-500/5',
        HIRED: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5',
        REJECTED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20 shadow-sm shadow-red-500/5',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${map[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-white/5'}`}>
            {status}
        </span>
    );
};

const AdminApplicationReview = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();

    const [internship, setInternship] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');
    const [selected, setSelected] = useState(null);
    const [highlightCollege, setHighlightCollege] = useState('');
    const [collapsed, setCollapsed] = useState({
        nominated: false,
        quota: false,
        highlighted: false,
        standard: true // Collapse standard by default to save space
    });

    const toggleSection = (s) => setCollapsed(prev => ({ ...prev, [s]: !prev[s] }));

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [intRes, appRes] = await Promise.all([
                api.get(`/internships/${id}`),
                api.get(`/admin/internships/${id}/applications`)
            ]);
            setInternship(intRes.data.data);
            console.log('>>> ADMIN FETCHED APPLICATIONS:', appRes.data.data);
            setApplications(appRes.data.data);
        } catch {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [id, fetchData]);

    const updateStatus = async (appId, newStatus, assignedRole = null, dates = {}) => {
        try {
            const payload = { status: newStatus, ...dates };
            if (assignedRole) payload.assignedRole = assignedRole;
            if (dates.rollNumber) payload.rollNumber = dates.rollNumber;
            await api.put(`/admin/applications/${appId}`, payload);
            setApplications(prev => prev.map(a => a.id === appId ? { 
                ...a, 
                status: newStatus, 
                assignedRole,
                joiningDate: dates.joiningDate || a.joiningDate,
                endDate: dates.endDate || a.endDate
            } : a));
            if (selected?.id === appId) setSelected(prev => ({ 
                ...prev, 
                status: newStatus, 
                assignedRole,
                joiningDate: dates.joiningDate || prev.joiningDate,
                endDate: dates.endDate || prev.endDate
            }));
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update status';
            alert(msg);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/admin/internships/${id}/export`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const safeTitle = (internship?.title || 'applications').replace(/[^a-zA-Z0-9]/g, '_');
            link.setAttribute('download', `${safeTitle}_applications.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export applications. Please try again.');
        }
    };

    const isTopUniversity = (student) => {
        if (!student) return false;
        const nirf = parseInt(student.nirfRanking);
        const category = student.collegeCategory;
        const topCategories = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];
        return (nirf > 0 && nirf <= 100) || topCategories.includes(category);
    };

    const quotaPct = internship?.quotaPercentages?.topUniversity || 0;
    const priorityPct = internship?.priorityCollegeQuota || 0;
    const totalCap = internship?.openingsCount || 0;
    
    // Intake caps are for the status badges, but we'll show all matching students in sections
    const quotaCap = Math.round((totalCap * quotaPct) / 100);
    const priorityMetricCap = Math.round((totalCap * priorityPct) / 100);

    const { nominatedApps, highlightedApps, quotaApps, standardApps, uniqueColleges, nominatedHired, quotaHired, roleHiredStats } = (() => {
        const sortedFull = [...applications].sort((a, b) => (b.student?.cgpa || 0) - (a.student?.cgpa || 0));
        
        const nominated = [];
        const highlighted = [];
        const quota = [];
        const pool = [];
        const collegesSet = new Set();

        const priorityCollegeName = internship?.priorityCollege;

        const clean = (s) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        sortedFull.forEach(app => {
            const collegeNameRaw = (app.student?.collegeName || '').trim();
            collegesSet.add(collegeNameRaw);
            
            const collegeName = clean(collegeNameRaw);
            const pCollege = clean(priorityCollegeName || '');
            const hCollege = clean(highlightCollege);
            
            const isNominated = pCollege.length > 0 && (collegeName.includes(pCollege) || pCollege.includes(collegeName));
            const isTopUniv = isTopUniversity(app.student);
            const isHighlighted = hCollege.length > 0 && (collegeName.includes(hCollege) || hCollege.includes(collegeName));
            
            if (isNominated) {
                nominated.push({ ...app, nominatedMatch: true });
            } else if (isTopUniv) {
                quota.push({ ...app, quotaMatch: true });
            } else if (isHighlighted) {
                highlighted.push({ ...app, highlightMatch: true });
            } else {
                pool.push({ 
                    ...app, 
                    nominatedMatch: isNominated, 
                    quotaMatch: isTopUniv && !isNominated 
                });
            }
        });

        const filterFn = a => filter === 'All' ? true : a.status === filter;
        
        // Calculate hiring stats per role
        const roleHiredStats = {};
        applications.forEach(a => {
            if (a.status === 'HIRED' && a.assignedRole) {
                roleHiredStats[a.assignedRole] = (roleHiredStats[a.assignedRole] || 0) + 1;
            }
        });

        return {
            nominatedApps: nominated.filter(filterFn),
            highlightedApps: highlighted.filter(filterFn),
            quotaApps: quota.filter(filterFn),
            standardApps: pool.filter(filterFn),
            uniqueColleges: Array.from(collegesSet).sort(),
            nominatedHired: nominated.filter(a => a.status === 'HIRED').length,
            quotaHired: quota.filter(a => a.status === 'HIRED').length,
            roleHiredStats
        };
    })();

    // Auto-collapse filled sections
    useEffect(() => {
        if (!loading && internship) {
            setCollapsed(prev => ({
                ...prev,
                nominated: nominatedHired >= priorityMetricCap ? true : prev.nominated,
                quota: quotaHired >= quotaCap ? true : prev.quota
            }));
        }
    }, [nominatedHired, quotaHired, priorityMetricCap, quotaCap, loading, internship]);

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        hired: applications.filter(a => a.status === 'HIRED').length,
        rejected: applications.filter(a => a.status === 'REJECTED').length,
    };
    const remaining = internship ? Math.max(0, internship.openingsCount - stats.hired) : 0;
    const fillPct = internship ? Math.min(100, Math.round((stats.hired / internship.openingsCount) * 100)) : 0;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Premium Header/Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-[2.5rem] p-8 mb-6 text-white shadow-2xl relative overflow-hidden group border border-white/5 dark:border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate('/dashboard')} className="w-12 h-12 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl shadow-inner hover:bg-white/20 transition-all hover:rotate-6">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black font-rajdhani mb-1 text-white uppercase tracking-tighter">
                                Application <span className="text-amber-400">Review</span>
                            </h1>
                            <p className="text-indigo-200/70 font-medium text-sm tracking-wide uppercase text-[10px] font-bold tracking-[0.3em]">
                                {internship?.title || 'Loading Internship...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative">
                            <input
                                list="applicant-colleges"
                                type="text"
                                placeholder="Highlight College..."
                                value={highlightCollege}
                                onChange={(e) => setHighlightCollege(e.target.value)}
                                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 w-64 placeholder:text-white/40 font-medium"
                            />
                            <datalist id="applicant-colleges">
                                {uniqueColleges.map((c, i) => <option key={i} value={c} />)}
                            </datalist>
                            {highlightCollege && (
                                <button onClick={() => setHighlightCollege('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                                    <XCircle size={14} />
                                </button>
                            )}
                        </div>
                        <button 
                            onClick={handleExport}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-2xl transition-all backdrop-blur-md border border-white/10 flex items-center gap-2 group/btn"
                        >
                            <Download className="w-5 h-5 group-hover/btn:translate-y-0.5 transition-transform" /> Export Data
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>}

            {/* Dynamic Stats + Fill Rate */}
            <div className="glass-card bg-white dark:bg-slate-900/60 border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 premium-shadow">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mb-8">
                    {[
                        { label: t('dashboard.applications'), value: stats.total, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                        { label: 'Hired', value: stats.hired, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                        { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
                        { label: 'Remaining', value: remaining, icon: TrendingUp, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10' },
                    ].map(({ label, value, icon, color, bg }) => (
                        <div key={label} className="group relative">
                            <div className={`p-4 rounded-3xl ${bg} border border-black/5 dark:border-white/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg`}>
                                {React.createElement(icon, { size: 20, className: `mx-auto mb-2 ${color} group-hover:scale-110 transition-transform` })}
                                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1">{value}</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-semibold w-24">Fill Rate {fillPct}%</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all"
                            style={{
                                width: `${fillPct}%`,
                                background: fillPct >= 80 ? '#f87171' : fillPct >= 50 ? '#fbbf24' : '#10b981'
                            }} />
                    </div>
                    <span className="text-xs text-gray-400">{stats.hired}/{internship?.openingsCount} openings filled</span>
                </div>
            </div>

            {/* Internship Details Collapsible */}
            {(internship?.requirements || internship?.expectations) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {internship.requirements && (
                        <div className="admin-card bg-indigo-50/10 dark:bg-indigo-900/10 border-indigo-100/50 dark:border-indigo-500/20">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-indigo-300 mb-2">📋 Requirements</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 whitespace-pre-line">{internship.requirements}</p>
                        </div>
                    )}
                    {internship.expectations && (
                        <div className="admin-card bg-amber-50/10 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-500/20">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-amber-300 mb-2">🎯 Expectations</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 whitespace-pre-line">{internship.expectations}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Filter Tabs + Table */}
            <div className="admin-card">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-8 bg-gray-50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 w-fit">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-400'}`}>
                            {f} {f !== 'All' && <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] ${filter === f ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-800'}`}>{applications.filter(a => a.status === f).length}</span>}
                        </button>
                    ))}
                </div>

                {applications.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Users size={36} className="mx-auto mb-3 text-gray-200" />
                        <p className="font-medium">No {filter !== 'All' ? filter.toLowerCase() : ''} applications found.</p>
                    </div>
                ) : (
                <div className="overflow-x-auto px-8 pb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Student Profile</th>
                                <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Allocated / College Roll</th>
                                <th className="py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">College / Tier</th>
                                <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">CGPA</th>
                                <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="py-5 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {nominatedApps.length > 0 && (
                                    <>
                                        <tr className="bg-amber-100/50 dark:bg-amber-900/30 cursor-pointer hover:bg-amber-200/50 transition-colors"
                                            onClick={() => toggleSection('nominated')}>
                                            <td colSpan="6" className="py-2 px-4 shadow-inner">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {collapsed.nominated ? <ChevronRight size={14} className="text-amber-700" /> : <ChevronDown size={14} className="text-amber-700" />}
                                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-200 bg-amber-200 dark:bg-amber-800/80 px-2.5 py-1 rounded-lg border border-amber-300/50 dark:border-amber-400/20">
                                                            <Star size={10} className="fill-current" />
                                                            Priority Quota ({priorityPct}%): {internship?.priorityCollege}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-amber-600/60 dark:text-amber-400/40 italic">Reserved intake: {priorityMetricCap}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${nominatedHired >= priorityMetricCap ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-900'}`}>
                                                            {nominatedHired} / {priorityMetricCap} FILLED
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {!collapsed.nominated && nominatedApps.map(app => (
                                            <ApplicationRow 
                                                key={app.id} 
                                                app={app} 
                                                updateStatus={updateStatus} 
                                                setSelected={setSelected} 
                                            />
                                        ))}
                                    </>
                                )}
                                {highlightedApps.length > 0 && (
                                    <>
                                        <tr className="bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-100/30 transition-colors"
                                            onClick={() => toggleSection('highlighted')}>
                                            <td colSpan="6" className="py-2 px-4">
                                                <div className="flex items-center gap-2">
                                                    {collapsed.highlighted ? <ChevronRight size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-amber-500" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                                                        College Highlight: "{highlightCollege}"
                                                    </span>
                                                    <span className="text-[10px] font-bold text-amber-400 dark:text-amber-500/60 italic">Students matching your bias criteria</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {!collapsed.highlighted && highlightedApps.map(app => (
                                            <ApplicationRow 
                                                key={app.id} 
                                                app={app} 
                                                updateStatus={updateStatus} 
                                                setSelected={setSelected} 
                                            />
                                        ))}
                                    </>
                                )}
                                {quotaApps.length > 0 && (
                                    <>
                                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 cursor-pointer hover:bg-indigo-100/30 transition-colors"
                                            onClick={() => toggleSection('quota')}>
                                            <td colSpan="6" className="py-2 px-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {collapsed.quota ? <ChevronRight size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                                                            Top University Quota ({quotaPct}%)
                                                        </span>
                                                        <span className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500/60 italic">Reserved seats: {quotaCap}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${quotaHired >= quotaCap ? 'bg-emerald-500 text-white' : 'bg-indigo-200 text-indigo-900'}`}>
                                                            {quotaHired} / {quotaCap} FILLED
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {!collapsed.quota && quotaApps.map(app => (
                                            <ApplicationRow 
                                                key={app.id} 
                                                app={app} 
                                                updateStatus={updateStatus} 
                                                setSelected={setSelected} 
                                            />
                                        ))}
                                    </>
                                )}
                                {standardApps.length > 0 && (
                                    <>
                                        <tr className="bg-gray-50 dark:bg-slate-800/50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleSection('standard')}>
                                            <td colSpan="6" className="py-2 px-4">
                                                <div className="flex items-center gap-2">
                                                    {collapsed.standard ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-300 dark:border-white/5">
                                                        Standard Selection Pool
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {!collapsed.standard && standardApps.map(app => (
                                            <ApplicationRow 
                                                key={app.id} 
                                                app={app} 
                                                updateStatus={updateStatus} 
                                                setSelected={setSelected} 
                                            />
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selected && (
                <ApplicationProfileModal
                    application={{ ...selected, roleHiredStats }}
                    internship={internship}
                    onClose={() => setSelected(null)}
                    onHire={(assignedRole, dates) => updateStatus(selected.id, 'HIRED', assignedRole, dates)}
                    onReject={() => updateStatus(selected.id, 'REJECTED')}
                    onReconsider={() => updateStatus(selected.id, 'PENDING')}
                />
            )}
        </div>
    );
};

const ApplicationRow = ({ app, updateStatus, setSelected }) => {
    const studentPhoto = app.student?.photoUrl;
    const fullPhotoUrl = studentPhoto ? (studentPhoto.startsWith('data:') ? studentPhoto : `http://localhost:5001/${studentPhoto.replace(/\\/g, '/')}`) : null;

    return (
        <tr className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all group font-medium">
            <td className="py-5 pl-8">
                <div className="flex items-center gap-4">
                    {fullPhotoUrl ? (
                        <img src={fullPhotoUrl} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-sm flex-shrink-0 border border-indigo-200 dark:border-indigo-500/20">
                            {app.student?.fullName?.charAt(0)}
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{app.student?.fullName}</p>
                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest mt-0.5">#{app.trackingId.slice(-6)}</p>
                    </div>
                </div>
            </td>
            <td className="py-5 px-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black font-mono bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-400/20 text-indigo-700 dark:text-indigo-300 shadow-sm w-fit">
                        {app.student?.rollNumber}
                    </span>
                    <span className="text-[10px] font-bold font-mono bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 shadow-sm w-fit">
                        {app.student?.collegeRollNumber || 'No College Roll'}
                    </span>
                </div>
            </td>
            <td className="py-5 px-6">
                <p className="text-sm text-gray-700 dark:text-slate-200 font-semibold max-w-xs truncate">{app.student?.collegeName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest border border-gray-200 dark:border-white/5">
                        {app.student?.collegeCategory}
                    </span>
                    {app.student?.nirfRanking && (
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 rounded border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-widest">
                            NIRF #{app.student.nirfRanking}
                        </span>
                    )}
                </div>
            </td>
            <td className="py-5 text-center">
                <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-black text-gray-800 dark:text-indigo-200">{app.student?.cgpa}</span>
                    <div className="w-8 h-1 bg-gray-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(app.student?.cgpa / 10) * 100}%` }} />
                    </div>
                </div>
            </td>
            <td className="py-5 text-center">
                <div className="flex flex-col items-center gap-1">
                    <StatusBadge status={app.status} />
                    {app.assignedRole && (
                        <span className="text-[9px] uppercase font-black text-emerald-600 dark:text-emerald-400 px-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-100 dark:border-emerald-500/20">
                            {app.assignedRole}
                        </span>
                    )}
                </div>
            </td>
            <td className="py-5 pr-8">
                <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelected(app)}
                        className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white rounded-xl transition-all shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                        <Eye size={16} />
                    </button>
                    {app.status === 'PENDING' && (
                        <>
                            <button onClick={() => setSelected(app)}
                                className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                                <CheckCircle size={16} />
                            </button>
                            <button onClick={() => updateStatus(app.id, 'REJECTED')}
                                className="p-2.5 bg-red-50 dark:bg-red-900/40 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white rounded-xl transition-all shadow-sm border border-red-100 dark:border-red-500/20">
                                <XCircle size={16} />
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default AdminApplicationReview;
