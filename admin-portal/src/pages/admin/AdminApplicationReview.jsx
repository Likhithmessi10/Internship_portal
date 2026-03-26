import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ApplicationProfileModal from './ApplicationProfileModal';
import { 
    ArrowLeft, Download, Users, CheckCircle, Clock, XCircle, 
    Eye, TrendingUp, Star, ChevronDown, ChevronRight, Sparkles,
    Shield, Briefcase, GraduationCap, Award, Info, MapPin
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const FILTERS = ['All', 'SUBMITTED', 'HOD_REVIEW', 'COMMITTEE_EVALUATION', 'CA_APPROVED', 'ONGOING', 'COMPLETED', 'REJECTED'];

const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    return `http://localhost:5001/${url.replace(/\\/g, '/')}`;
};

const StatusBadge = ({ status }) => {
    const map = {
        SUBMITTED: 'bg-surface-container-low text-outline border-outline-variant/20',
        HOD_REVIEW: 'bg-primary/10 text-primary border-primary/20',
        COMMITTEE_EVALUATION: 'bg-secondary/10 text-secondary border-secondary/20',
        CA_APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ONGOING: 'bg-emerald-100/50 text-emerald-800 border-emerald-300/50',
        COMPLETED: 'bg-surface-container-high text-primary/60 border-outline-variant/10',
        REJECTED: 'bg-error/5 text-error border-error/10',
    };
    return (
        <span className={`px-4 py-1.5 rounded text-[9px] font-bold uppercase tracking-[0.15em] border ${map[status] || 'bg-surface-container text-outline border-outline-variant/10'}`}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
};

const AdminApplicationReview = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    const [internship, setInternship] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');
    const [selected, setSelected] = useState(null);
    const [highlightCollege, setHighlightCollege] = useState('');
    
    // AI Allocation states removed

    const [collapsed, setCollapsed] = useState({
        nominated: false,
        quota: false,
        highlighted: false,
        standard: true 
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
            setApplications(appRes.data.data);
        } catch {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [id, fetchData]);

    // AI Allocation functions removed

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
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/admin/internships/${id}/export`, { responseType: 'blob' });
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
    const priorityMetricCap = Math.round((totalCap * priorityPct) / 100);
    const quotaCap = Math.round((totalCap * quotaPct) / 100);

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
            
            if (isNominated) nominated.push({ ...app, nominatedMatch: true });
            else if (isTopUniv) quota.push({ ...app, quotaMatch: true });
            else if (isHighlighted) highlighted.push({ ...app, highlightMatch: true });
            else pool.push({ ...app, nominatedMatch: isNominated, quotaMatch: isTopUniv && !isNominated });
        });

        const filterFn = a => filter === 'All' ? true : a.status === filter;
        const roleHiredStats = {};
        applications.forEach(a => { if (a.status === 'HIRED' && a.assignedRole) roleHiredStats[a.assignedRole] = (roleHiredStats[a.assignedRole] || 0) + 1; });

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

    const stats = {
        total: applications.length,
        pending: applications.filter(a => ['SUBMITTED', 'HOD_REVIEW', 'COMMITTEE_EVALUATION'].includes(a.status)).length,
        hired: applications.filter(a => ['CA_APPROVED', 'ONGOING', 'COMPLETED'].includes(a.status)).length,
        rejected: applications.filter(a => a.status === 'REJECTED').length,
    };
    const fillPct = internship ? Math.min(100, Math.round((stats.hired / internship.openingsCount) * 100)) : 0;

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full shadow-xl" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end mb-8 pt-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-lg bg-surface-container-low border border-outline-variant/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Candidate Selection Board</span>
                        <h2 className="text-3xl font-bold text-primary tracking-tight">{internship?.title}</h2>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors">
                        <span className="material-symbols-outlined text-lg">download</span> Export Pool
                    </button>
                </div>
            </section>

            {/* Selection Visualiser - Bento Style */}
            <section className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-8 rounded-xl border border-outline-variant/10 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Recruitment Progress</h3>
                            <p className="text-[10px] text-outline font-medium">Real-time fulfillment tracking for this program</p>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-extrabold text-primary">{fillPct}%</span>
                            <div className="text-[9px] font-bold text-outline uppercase tracking-wider mt-1">Status: {fillPct >= 100 ? 'FULFILLED' : 'OPEN'}</div>
                        </div>
                    </div>
                    
                    <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden mb-8">
                        <div className="bg-primary h-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.3)]" style={{ width: `${fillPct}%` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="p-4 bg-white/50 rounded-lg border border-outline-variant/5">
                            <p className="text-[10px] font-bold text-outline uppercase mb-1">Preferred</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-primary">{nominatedHired}</span>
                                <span className="text-[10px] text-outline">/ {priorityMetricCap}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-lg border border-outline-variant/5">
                            <p className="text-[10px] font-bold text-outline uppercase mb-1">Top Tier</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-primary">{quotaHired}</span>
                                <span className="text-[10px] text-outline">/ {quotaCap}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-lg border border-outline-variant/5">
                            <p className="text-[10px] font-bold text-outline uppercase mb-1">Total Pool</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-primary">{stats.total}</span>
                                <span className="text-[10px] text-outline underline decoration-outline-variant">LIFETIME</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-primary-container p-8 rounded-xl text-on-primary-container flex flex-col justify-between">
                    <div>
                         <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">Decision Pipeline</span>
                         <div className="space-y-4 mt-6">
                            <div className="flex justify-between items-center text-xs font-bold text-white">
                                <span className="opacity-60 uppercase">In Review</span>
                                <span>{stats.pending}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-white">
                                <span className="opacity-60 uppercase">Confirmed</span>
                                <span>{stats.hired}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-white">
                                <span className="opacity-60 uppercase">Rejected</span>
                                <span>{stats.rejected}</span>
                            </div>
                         </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 uppercase font-bold text-[10px] tracking-widest opacity-60">
                        Admin Approval Required
                    </div>
                </div>
            </section>

            {/* Candidate Table Area - Stitch Style */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-white">
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-surface-container-high text-outline hover:bg-surface-variant'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative w-full md:w-80">
                         <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
                         <input list="college-list" value={highlightCollege} onChange={e => setHighlightCollege(e.target.value)} 
                            placeholder="College filter..." className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-primary focus:outline-primary placeholder:text-outline/40" />
                         <datalist id="college-list">{uniqueColleges.map((c, i) => <option key={i} value={c} />)}</datalist>
                    </div>
                </div>

                <div className="overflow-x-auto pb-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-high/30">
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Candidate Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Identification</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">College Profile</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">CGPA</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            <GroupingHeader label="Preferred College Students" icon={<span className="material-symbols-outlined text-[12px] fill">grade</span>} active={nominatedApps.length > 0} 
                                collapsed={collapsed.nominated} onToggle={() => toggleSection('nominated')} count={nominatedApps.length} hired={nominatedHired} cap={priorityMetricCap} color="amber" />
                            {!collapsed.nominated && nominatedApps.map(app => <ApplicationRow key={app.id} app={app} updateStatus={updateStatus} setSelected={setSelected} />)}

                            <GroupingHeader label="Top Tier Institute Students" icon={<span className="material-symbols-outlined text-[12px]">school</span>} active={quotaApps.length > 0} 
                                collapsed={collapsed.quota} onToggle={() => toggleSection('quota')} count={quotaApps.length} hired={quotaHired} cap={quotaCap} color="indigo" />
                            {!collapsed.quota && quotaApps.map(app => <ApplicationRow key={app.id} app={app} updateStatus={updateStatus} setSelected={setSelected} />)}
                            
                            <GroupingHeader label="Other Applicants (General Merit)" icon={<span className="material-symbols-outlined text-[12px]">groups</span>} active={standardApps.length > 0} 
                                collapsed={collapsed.standard} onToggle={() => toggleSection('standard')} count={standardApps.length} color="slate" />
                            {!collapsed.standard && standardApps.map(app => <ApplicationRow key={app.id} app={app} updateStatus={updateStatus} setSelected={setSelected} />)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AUTO-SELECT MODAL REMOVED */}

            {selected && (
                <ApplicationProfileModal application={{ ...selected, roleHiredStats }} internship={internship} onClose={() => setSelected(null)}
                    updateStatus={(status, extra) => updateStatus(selected.id, status, extra?.assignedRole, extra)} />
            )}
        </div>
    );
};

const StatRow = ({ label, val, color }) => (
    <div className="flex items-center justify-between group">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`text-xl font-black ${color || 'text-slate-900 dark:text-white'} group-hover:scale-110 transition-transform`}>{val}</span>
    </div>
);

const GroupingHeader = ({ label, icon, active, collapsed, onToggle, count, hired, cap, color }) => {
    if (!active) return null;
    const colors = {
        amber: 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-amber-300/50',
        indigo: 'bg-indigo-50/50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border-indigo-200',
        slate: 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200'
    };
    return (
        <tr className={`${colors[color]} cursor-pointer hover:opacity-80 transition-all group`} onClick={onToggle}>
            <td colSpan="6" className="py-4 px-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm">
                            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 italic">
                                {React.cloneElement(icon, { size: 12 })} {label}
                            </span>
                            <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">{count} Candidates found in this category</span>
                        </div>
                    </div>
                    {cap && (
                        <div className="bg-white/40 px-4 py-1.5 rounded-full flex items-center gap-4 border border-white/40">
                            <span className="text-[10px] font-black uppercase tracking-widest">{hired} / {cap} Seats Occupied</span>
                            <div className="w-20 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (hired/cap)*100)}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const SummaryCard = ({ label, val, total, color }) => {
    const c = {
        amber: 'bg-amber-50 border-amber-100 text-amber-700',
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700'
    }[color];
    return (
        <div className={`p-6 rounded-[2rem] border ${c} text-center`}>
            <p className="text-4xl font-black mb-1 leading-none">{val} <small className="text-sm opacity-40">/ {total}</small></p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
        </div>
    );
};

const ApplicationRow = ({ app, updateStatus, setSelected }) => {
    const fullPhotoUrl = getMediaUrl(app.student?.photoUrl);
    return (
        <tr className="hover:bg-primary/5 transition-colors group">
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    {fullPhotoUrl ? (
                         <img src={fullPhotoUrl} className="w-10 h-10 rounded-lg object-cover bg-surface-container-high" alt="" />
                    ) : (
                         <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-outline font-bold text-sm uppercase">
                            {app.student?.fullName?.charAt(0)}
                         </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-primary">{app.student?.fullName}</p>
                        <p className="text-[10px] text-outline font-medium tracking-tighter uppercase mt-0.5">ID: {app.trackingId.slice(-6)}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{app.student?.rollNumber || 'PENDING'}</p>
                <p className="text-[9px] text-outline font-medium uppercase mt-0.5">{app.student?.collegeRollNumber || 'N/A'}</p>
            </td>
            <td className="px-6 py-5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-tight max-w-[180px] truncate">{app.student?.collegeName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[8px] font-bold px-1 py-0.5 bg-primary/10 text-primary rounded-sm uppercase tracking-widest">NIRF #{app.student?.nirfRanking || 'N/A'}</span>
                    <span className="text-[8px] font-bold px-1 py-0.5 bg-surface-container-high text-outline rounded-sm uppercase tracking-widest">{app.student?.collegeCategory}</span>
                </div>
            </td>
            <td className="px-6 py-5 text-center">
                <span className="text-lg font-bold text-primary">{app.student?.cgpa}</span>
                <div className="w-8 bg-surface-container-high h-0.5 mt-0.5 mx-auto rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${(app.student?.cgpa/10)*100}%` }}></div>
                </div>
            </td>
            <td className="px-6 py-5 text-center">
                <StatusBadge status={app.status} />
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setSelected(app)} className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    {['SUBMITTED', 'HOD_REVIEW', 'COMMITTEE_EVALUATION', 'CA_APPROVED'].includes(app.status) && (
                        <button onClick={() => setSelected(app)} className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white hover:opacity-90 transition-all shadow-sm">
                            <span className="material-symbols-outlined text-lg">task_alt</span>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default AdminApplicationReview;
