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
        SUBMITTED: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-sm shadow-amber-500/5 transition-all',
        HOD_REVIEW: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20 shadow-sm shadow-purple-500/5 transition-all',
        COMMITTEE_EVALUATION: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 shadow-sm shadow-blue-500/5 transition-all',
        CA_APPROVED: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20 shadow-sm shadow-teal-500/5 transition-all',
        ONGOING: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-all',
        COMPLETED: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 shadow-sm shadow-indigo-500/5 transition-all',
        REJECTED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20 shadow-sm shadow-red-500/5 transition-all',
    };
    return (
        <span className={`px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${map[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-white/5'}`}>
            {status}
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
            {/* Super Premium Header */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 opacity-[0.05] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] transition-all duration-1000 group-hover:scale-110"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/dashboard')} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-3xl shadow-2xl hover:bg-white/10 transition-all hover:-translate-x-1">
                            <ArrowLeft className="w-6 h-6 text-indigo-300" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black font-rajdhani mb-2 tracking-tighter uppercase leading-none">
                                Selection <span className="text-amber-400">Board</span>
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-indigo-500/20 rounded-lg text-indigo-300 font-black text-[10px] uppercase tracking-widest border border-indigo-500/20">{internship?.department}</span>
                                <p className="text-slate-400 font-bold text-sm tracking-tight">{internship?.title}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        {['ADMIN', 'CE_PRTI'].includes(user?.role) && (
                            <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-8 rounded-2xl transition-all backdrop-blur-md border border-white/10 flex items-center gap-3 group">
                                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform text-indigo-300" /> EXPORT EXCEL
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Selection Visualiser */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 admin-card p-10 bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] border border-black/5 dark:border-white/5 premium-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-1">Live <span className="text-indigo-600">Fulfillment</span></h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">Monitoring your hiring progress</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{fillPct}%</span>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">Status: {fillPct >= 100 ? 'FULL' : 'OPEN'}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 p-0.5">
                            <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                                style={{
                                    width: `${fillPct}%`,
                                    background: `linear-gradient(90deg, #6366f1, #a855f7)`
                                }} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                            <span>0 Hired</span>
                            <span>{stats.hired} / {internship?.openingsCount} Students Recruited</span>
                            <span>{internship?.openingsCount} Capacity</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-12 bg-slate-50 dark:bg-slate-950/40 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                        <div className="text-center">
                            <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none mb-1">{nominatedHired} / {priorityMetricCap}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Preferred Seats</p>
                        </div>
                        <div className="group text-center border-x border-slate-200 dark:border-white/5">
                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">{quotaHired} / {quotaCap}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Top College Seats</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none mb-1">{stats.hired - nominatedHired - quotaHired}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">General Seats</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="admin-card p-8 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-100 dark:border-indigo-500/10 rounded-[2.5rem]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Users size={20} /></div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Pool Overview</h4>
                        </div>
                        <div className="space-y-6">
                            <StatRow label="Total Applicants" val={stats.total} />
                            <StatRow label="In Review" val={stats.pending} color="text-amber-600" />
                            <StatRow label="Confirmed Hire" val={stats.hired} color="text-emerald-600" />
                            <StatRow label="Rejected" val={stats.rejected} color="text-rose-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Application Table Area */}
            <div className="admin-card overflow-hidden rounded-[3rem] premium-shadow border-black/5 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
                <div className="px-10 py-8 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-black/5">
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-indigo-600'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative group">
                        <input list="college-list" value={highlightCollege} onChange={e => setHighlightCollege(e.target.value)} 
                            placeholder="Find students by college..." className="admin-input pl-12 pr-10 py-3 text-xs font-bold w-80 bg-white/50 border-slate-200" />
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                        {highlightCollege && <button onClick={() => setHighlightCollege('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><XCircle size={16} /></button>}
                        <datalist id="college-list">{uniqueColleges.map((c, i) => <option key={i} value={c} />)}</datalist>
                    </div>
                </div>

                <div className="overflow-x-auto pb-10">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-white/5">
                                <th className="text-left px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Info</th>
                                <th className="text-left px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification</th>
                                <th className="text-left px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">College Profile</th>
                                <th className="text-center px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">CGPA</th>
                                <th className="text-center px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="text-center px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            <GroupingHeader label="Preferred College Students" icon={<Star className="fill-current" />} active={nominatedApps.length > 0} 
                                collapsed={collapsed.nominated} onToggle={() => toggleSection('nominated')} count={nominatedApps.length} hired={nominatedHired} cap={priorityMetricCap} color="amber" />
                            {!collapsed.nominated && nominatedApps.map(app => <ApplicationRow key={app.id} app={app} updateStatus={updateStatus} setSelected={setSelected} />)}

                            <GroupingHeader label="Top Tier Institute Students" icon={<Award />} active={quotaApps.length > 0} 
                                collapsed={collapsed.quota} onToggle={() => toggleSection('quota')} count={quotaApps.length} hired={quotaHired} cap={quotaCap} color="indigo" />
                            {!collapsed.quota && quotaApps.map(app => <ApplicationRow key={app.id} app={app} updateStatus={updateStatus} setSelected={setSelected} />)}
                            
                            <GroupingHeader label="Other Applicants (General Merit)" icon={<Users />} active={standardApps.length > 0} 
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
        <tr className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all group border-b border-slate-50">
            <td className="py-6 px-10">
                <div className="flex items-center gap-5">
                    {fullPhotoUrl ? <img src={fullPhotoUrl} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-xl" alt="" /> : 
                     <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-extrabold text-xl uppercase border shadow-inner">{app.student?.fullName?.charAt(0)}</div>}
                    <div>
                        <p className="font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{app.student?.fullName}</p>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 inline-block">ID: {app.trackingId.slice(-6)}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-6 font-mono text-[10px] font-bold text-slate-400 space-y-1">
                <p className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border shadow-sm w-fit text-slate-600 dark:text-slate-300">{app.student?.rollNumber || 'NOT HIRED'}</p>
                <p className="px-2 py-0.5 opacity-50">{app.student?.collegeRollNumber || 'N/A'}</p>
            </td>
            <td className="px-6 py-6">
                <p className="text-xs font-black text-slate-600 dark:text-slate-200 uppercase tracking-tight max-w-[200px] truncate">{app.student?.collegeName}</p>
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 uppercase tracking-widest">NIRF #{app.student?.nirfRanking || 'N/A'}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded border border-slate-200 uppercase tracking-widest">{app.student?.collegeCategory}</span>
                </div>
            </td>
            <td className="px-6 py-6 text-center">
                <span className="text-2xl font-black text-slate-800 dark:text-indigo-400">{app.student?.cgpa}</span>
                <div className="w-10 h-1 bg-slate-100 dark:bg-slate-800 mx-auto mt-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(app.student?.cgpa/10)*100}%` }} />
                </div>
            </td>
            <td className="px-6 py-6 text-center"><StatusBadge status={app.status} /></td>
            <td className="px-6 py-6 text-center">
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setSelected(app)} className="p-3 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 border border-slate-100 rounded-xl transition-all shadow-sm hover:shadow-indigo-200"><Eye size={18} /></button>
                    {['SUBMITTED', 'HOD_REVIEW', 'COMMITTEE_EVALUATION', 'CA_APPROVED'].includes(app.status) && <button onClick={() => setSelected(app)} className="p-3 bg-emerald-600 text-white rounded-xl transition-all shadow-md hover:scale-105 active:scale-95"><CheckCircle size={18} /></button>}
                </div>
            </td>
        </tr>
    );
};

export default AdminApplicationReview;
