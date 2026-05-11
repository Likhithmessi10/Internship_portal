import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ApplicationProfileModal from './ApplicationProfileModal';
import {
    X, CheckCircle, ChevronDown, ChevronRight, Download, Users, FileText, LayoutGrid, List, AlertCircle, ArrowLeft, MoreVertical, Star, TrendingUp, Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// Keep filters aligned with backend enum ApplicationStatus (Prisma).
const FILTERS = [
    'All',
    'SUBMITTED',
    'SHORTLISTED',
    'UNDER_COMMITTEE_REVIEW',
    'WAITLISTED',
    'APPROVED',
    'HIRED',
    'ONGOING',
    'COMPLETED',
    'REJECTED'
];

const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    return `${MEDIA_URL}/${url.replace(/\\/g, '/')}`;
};

const StatusBadge = ({ status }) => {
    const map = {
        SUBMITTED: 'bg-surface-container-low text-outline border-outline-variant/20',
        SHORTLISTED: 'bg-amber-50 text-amber-700 border-amber-200',
        UNDER_COMMITTEE_REVIEW: 'bg-secondary/10 text-secondary border-secondary/20',
        WAITLISTED: 'bg-surface-container-high text-primary/70 border-outline-variant/15',
        APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        HIRED: 'bg-emerald-100/50 text-emerald-800 border-emerald-300/50',
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
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [groupFilter, setGroupFilter] = useState('All Groups');
    const [fieldFilter, setFieldFilter] = useState('All Fields');
    const [selected, setSelected] = useState(null);
    const [highlightCollege, setHighlightCollege] = useState('');

    // AI Allocation states removed

    const [collapsed, setCollapsed] = useState({
        PREFERRED: false,
        IIT_NIT: false,
        TOP_100: false,
        REGULAR: false
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
            const payload = { status: newStatus, ...(dates || {}) };
            if (assignedRole) payload.assignedRole = assignedRole;
            if (dates?.rollNumber) payload.rollNumber = dates.rollNumber;
            await api.put(`/admin/applications/${appId}`, payload);
            setApplications(prev => prev.map(a => a.id === appId ? {
                ...a,
                status: newStatus,
                assignedRole,
                joiningDate: dates?.joiningDate || a.joiningDate,
                endDate: dates?.endDate || a.endDate
            } : a));
            if (selected?.id === appId) setSelected(prev => ({
                ...prev,
                status: newStatus,
                assignedRole,
                joiningDate: dates?.joiningDate || prev?.joiningDate,
                endDate: dates?.endDate || prev?.endDate
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

    const { filteredApps, uniqueColleges, roleHiredStats } = (() => {
        const sortedFull = [...applications].sort((a, b) => (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0));
        const collegesSet = new Set();
        
        sortedFull.forEach(app => {
            if (app.student?.collegeName) collegesSet.add(app.student.collegeName);
        });

        const filterFn = a => {
            const statusMatch = filter === 'All' ? true : a.status === filter;
            const roleMatch = roleFilter === 'All Roles' ? true : a.assignedRole === roleFilter;
            const groupMatch = groupFilter === 'All Groups' ? true : a.departmentGroupId === groupFilter;
            const fieldMatch = fieldFilter === 'All Fields' ? true : a.fieldId === fieldFilter;
            const collegeMatch = !highlightCollege || (a.student?.collegeName || '').toLowerCase().includes(highlightCollege.toLowerCase());
            return statusMatch && roleMatch && groupMatch && fieldMatch && collegeMatch;
        };

        const roleHiredStats = {};
        applications.forEach(a => { 
            if (['APPROVED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status) && a.assignedRole) {
                roleHiredStats[a.assignedRole] = (roleHiredStats[a.assignedRole] || 0) + 1; 
            }
        });

        return {
            filteredApps: sortedFull.filter(filterFn),
            uniqueColleges: Array.from(collegesSet),
            roleHiredStats
        };
    })();

    const stats = {
        total: applications.length,
        pending: applications.filter(a => ['SUBMITTED', 'SHORTLISTED', 'UNDER_COMMITTEE_REVIEW', 'WAITLISTED'].includes(a.status)).length,
        hired: applications.filter(a => ['APPROVED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length,
        rejected: applications.filter(a => a.status === 'REJECTED').length,
    };
    const fillPct = internship ? Math.min(100, Math.round((stats.hired / internship.openingsCount) * 100)) : 0;

    const normalized = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const tokenized = (s = '') => normalized(s).split(' ').filter(Boolean);
    const tokenSimilaritySimple = (a = '', b = '') => {
        const aSet = new Set(tokenized(a));
        const bSet = new Set(tokenized(b));
        if (aSet.size === 0 || bSet.size === 0) return 0;
        let inter = 0;
        aSet.forEach(t => { if (bSet.has(t)) inter += 1; });
        const union = new Set([...aSet, ...bSet]).size;
        return union > 0 ? inter / union : 0;
    };
    const isPreferredCollegeSimple = (collegeName = '', preferredColleges = []) => {
        if (!collegeName || !Array.isArray(preferredColleges) || preferredColleges.length === 0) return false;
        const target = normalized(collegeName).replace(/\s/g, '');
        return preferredColleges.some(pref => {
            const p = normalized(pref).replace(/\s/g, '');
            if (!p) return false;
            if (target.includes(p) || p.includes(target)) return true;
            if (tokenSimilaritySimple(collegeName, pref) >= 0.5) return true;
            return false;
        });
    };
    const getBucketSimple = (app) => {
        const preferredColleges = internship?.preferredColleges || [];
        const collegeName = app?.student?.collegeName || '';
        const category = (app?.student?.collegeCategory || '').toUpperCase();
        if (isPreferredCollegeSimple(collegeName, preferredColleges)) return 'PREFERRED';
        if (category === 'IIT' || category === 'NIT') return 'PREMIER';
        return 'REGULAR';
    };
    const openings = Number(internship?.openingsCount || 0);
    const preferredPct = Number(internship?.quotaPercentages?.preferred || 0);
    const premierPct = Number(internship?.quotaPercentages?.premier || 0);
    const seatCaps = {
        PREFERRED: Math.floor((openings * preferredPct) / 100),
        PREMIER: Math.floor((openings * premierPct) / 100),
        REGULAR: Math.max(0, openings - Math.floor((openings * preferredPct) / 100) - Math.floor((openings * premierPct) / 100))
    };
    const seatFilled = applications
        .filter(a => ['APPROVED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status))
        .reduce((acc, app) => {
            const bucket = getBucketSimple(app);
            acc[bucket] += 1;
            return acc;
        }, { PREFERRED: 0, PREMIER: 0, REGULAR: 0 });

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-surface-container-lowest/50 rounded-lg border border-outline-variant/5">
                            <p className="text-[10px] font-bold text-outline uppercase mb-1">Target Openings</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-primary">{internship?.openingsCount}</span>
                                <span className="text-[10px] text-outline">Positions</span>
                            </div>
                        </div>
                        <div className="p-4 bg-surface-container-lowest/50 rounded-lg border border-outline-variant/5">
                            <p className="text-[10px] font-bold text-outline uppercase mb-1">Available Pool</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-primary">{applications.length}</span>
                                <span className="text-[10px] text-outline">Candidates</span>
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

            <section className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Preferred Quota Filled</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-extrabold text-primary">{seatFilled.PREFERRED}</span>
                        <span className="text-sm font-bold text-outline mb-1">/ {seatCaps.PREFERRED}</span>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Premier (IIT/NIT) Filled</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-extrabold text-primary">{seatFilled.PREMIER}</span>
                        <span className="text-sm font-bold text-outline mb-1">/ {seatCaps.PREMIER}</span>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Regular Quota Filled</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-extrabold text-primary">{seatFilled.REGULAR}</span>
                        <span className="text-sm font-bold text-outline mb-1">/ {seatCaps.REGULAR}</span>
                    </div>
                </div>
            </section>

            {/* Candidate Table Area - Stitch Style */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-container-lowest">
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-surface-container-high text-outline hover:bg-surface-variant'}`}>
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        {internship?.internshipMode === 'GROUP' && (
                            <div className="relative w-full md:w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">domain</span>
                                <select value={groupFilter} onChange={e => { setGroupFilter(e.target.value); setRoleFilter('All Roles'); }}
                                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-primary focus:outline-primary appearance-none">
                                    <option value="All Groups">All Departments</option>
                                    {internship?.departmentGroups?.map(g => (
                                        <option key={g.id} value={g.id}>{g.title || g.department}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">expand_more</span>
                            </div>
                        )}

                        {internship?.internshipType === 'NON_STIPEND' && (
                            <div className="relative w-full md:w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">account_tree</span>
                                <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}
                                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-primary focus:outline-primary appearance-none">
                                    <option value="All Fields">All Fields</option>
                                    {(internship.fields || []).map(f => (
                                        <option key={f.id} value={f.id}>{f.fieldName}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">expand_more</span>
                            </div>
                        )}

                        <div className="relative w-full md:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">work</span>
                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-primary focus:outline-primary appearance-none">
                                <option>All Roles</option>
                                {internship?.internshipMode === 'GROUP' ? (
                                    (groupFilter === 'All Groups' 
                                        ? internship?.departmentGroups?.flatMap(g => g.rolesData || []) 
                                        : internship?.departmentGroups?.find(g => g.id === groupFilter)?.rolesData || []
                                    ).map((r, i) => <option key={`${r.name}-${i}`} value={r.name}>{r.name}</option>)
                                ) : (
                                    <>
                                        {internship?.rolesData?.map(r => (
                                            <option key={r.name} value={r.name}>{r.name}</option>
                                        ))}
                                        {(!internship?.rolesData && internship?.roles) && internship.roles.split(',').map(r => (
                                            <option key={r.trim()} value={r.trim()}>{r.trim()}</option>
                                        ))}
                                    </>
                                )}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">expand_more</span>
                        </div>

                        <div className="relative w-full md:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
                            <input list="college-list" value={highlightCollege} onChange={e => setHighlightCollege(e.target.value)}
                                placeholder="College filter..." className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-primary focus:outline-primary placeholder:text-outline/40" />
                            <datalist id="college-list">{uniqueColleges.map((c, i) => <option key={i} value={c} />)}</datalist>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto pb-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-high/30">
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Candidate Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">College Profile</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Match Score</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {(() => {
                                if (filteredApps.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-30">
                                                    <span className="material-symbols-outlined text-4xl">person_search</span>
                                                    <p className="text-xs font-bold uppercase tracking-widest">No candidates found matching filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                const preferredColleges = internship?.preferredColleges || [];
                                const STOP_TOKENS = new Set(['college', 'university', 'institute', 'inst', 'technology', 'technologies', 'school', 'of', 'the', 'and']);
                                const ABBR_MAP = {
                                    nit: 'national institute technology',
                                    iit: 'indian institute technology',
                                    iiit: 'indian institute information technology',
                                    nitt: 'national institute technology trichy',
                                    vnit: 'visvesvaraya national institute technology',
                                    mnnit: 'motilal nehru national institute technology',
                                    nitw: 'national institute technology warangal',
                                    nitk: 'national institute technology karnataka',
                                    nitc: 'national institute technology calicut',
                                    nitr: 'national institute technology rourkela',
                                    iitm: 'indian institute technology madras',
                                    iitd: 'indian institute technology delhi',
                                    iitb: 'indian institute technology bombay',
                                    iitk: 'indian institute technology kanpur',
                                    iitkgp: 'indian institute technology kharagpur',
                                    iitr: 'indian institute technology roorkee',
                                    iith: 'indian institute technology hyderabad',
                                    iitg: 'indian institute technology guwahati'
                                };
                                const expandAbbreviations = (s) => {
                                    let text = (s || '').toLowerCase();
                                    Object.entries(ABBR_MAP).forEach(([abbr, full]) => {
                                        const re = new RegExp(`\\b${abbr}\\b`, 'g');
                                        text = text.replace(re, full);
                                    });
                                    return text;
                                };
                                const normalize = (s) => expandAbbreviations(s).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
                                const tokenize = (s) => normalize(s).split(' ').filter(tok => tok && !STOP_TOKENS.has(tok));
                                const tokenSimilarity = (a, b) => {
                                    const aSet = new Set(tokenize(a));
                                    const bSet = new Set(tokenize(b));
                                    if (aSet.size === 0 || bSet.size === 0) return 0;
                                    let inter = 0;
                                    aSet.forEach(t => { if (bSet.has(t)) inter += 1; });
                                    const union = new Set([...aSet, ...bSet]).size;
                                    return union > 0 ? inter / union : 0;
                                };
                                const levenshtein = (a, b) => {
                                    if (a.length === 0) return b.length;
                                    if (b.length === 0) return a.length;
                                    const matrix = [];
                                    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
                                    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
                                    for (let i = 1; i <= b.length; i++) {
                                        for (let j = 1; j <= a.length; j++) {
                                            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
                                            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                                        }
                                    }
                                    return matrix[b.length][a.length];
                                };
                                const isPreferredCollege = (collegeName) => {
                                    const target = normalize(collegeName).replace(/\s/g, '');
                                    if (!target || !Array.isArray(preferredColleges)) return false;
                                    return preferredColleges.some(pref => {
                                        const p = normalize(pref).replace(/\s/g, '');
                                        if (!p) return false;
                                        if (target.includes(p) || p.includes(target)) return true;
                                        if (tokenSimilarity(collegeName, pref) >= 0.5) return true;
                                        const maxLen = Math.max(target.length, p.length);
                                        if (maxLen > 0 && Math.abs(target.length - p.length) <= Math.max(6, Math.floor(maxLen * 0.35))) {
                                            const ratio = levenshtein(target, p) / maxLen;
                                            if (ratio <= 0.22) return true;
                                        }
                                        return false;
                                    });
                                };

                                const getBucket = (app) => {
                                    const collegeName = app.student?.collegeName || '';
                                    const category = (app.student?.collegeCategory || '').toUpperCase();
                                    const nirf = Number(app.student?.nirfRanking || 0);

                                    if (isPreferredCollege(collegeName)) return 'PREFERRED';
                                    if (category === 'IIT' || category === 'NIT') return 'IIT_NIT';
                                    if (nirf > 0 && nirf <= 100) return 'TOP_100';
                                    return 'REGULAR';
                                };

                                const groups = [
                                    { key: 'PREFERRED', label: 'Preferred Colleges', icon: Star, color: 'amber' },
                                    { key: 'IIT_NIT', label: 'IITs & NITs', icon: TrendingUp, color: 'indigo' },
                                    { key: 'TOP_100', label: 'Top 100 Colleges', icon: List, color: 'emerald' },
                                    { key: 'REGULAR', label: 'Regular Colleges', icon: Users, color: 'slate' }
                                ];

                                return groups.map(group => {
                                    const appsInGroup = filteredApps.filter(app => getBucket(app) === group.key);
                                    if (appsInGroup.length === 0) return null;

                                    return (
                                        <React.Fragment key={group.key}>
                                            <GroupingHeader 
                                                label={group.label} 
                                                icon={group.icon} 
                                                active={true} 
                                                collapsed={collapsed[group.key]} 
                                                onToggle={() => toggleSection(group.key)} 
                                                count={appsInGroup.length} 
                                                hired={appsInGroup.filter(a => ['APPROVED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length}
                                                cap={null}
                                                color={group.color} 
                                            />
                                            {!collapsed[group.key] && appsInGroup.map(app => (
                                                <ApplicationRow key={app.id} app={app} updateStatus={updateStatus} setSelected={setSelected} internship={internship} />
                                            ))}
                                        </React.Fragment>
                                    );
                                });
                            })()}
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

const GroupingHeader = ({ label, icon: Icon, active, collapsed, onToggle, count, hired, cap, color }) => {
    if (!active) return null;
    const colors = {
        amber: 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-amber-300/50',
        indigo: 'bg-indigo-50/50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border-indigo-200',
        emerald: 'bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 border-emerald-200',
        slate: 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200'
    };
    return (
        <tr className={`${colors[color] || colors.slate} cursor-pointer hover:opacity-80 transition-all group`} onClick={onToggle}>
            <td colSpan="5" className="py-4 px-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-white/50  flex items-center justify-center shadow-sm">
                            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 italic">
                                {Icon ? <Icon size={12} /> : null} {label}
                            </span>
                            <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">{count} Candidates found in this category</span>
                        </div>
                    </div>
                    {cap && (
                        <div className="bg-white/40 px-4 py-1.5 rounded-full flex items-center gap-4 border border-white/40">
                            <span className="text-[10px] font-black uppercase tracking-widest">{hired} / {cap} Seats Occupied</span>
                            <div className="w-20 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (hired / cap) * 100)}%` }} />
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

const ApplicationRow = ({ app, updateStatus, setSelected, internship }) => {
    return (
        <tr className="hover:bg-primary/5 transition-colors group">
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-outline font-bold text-sm uppercase">
                        {app.student?.fullName?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-primary flex flex-wrap items-center gap-2">
                            {app.student?.fullName}
                            {app.shortlistCategory === 'FALLBACK' && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded text-[8px] uppercase tracking-widest border border-yellow-200 dark:border-yellow-800">Fallback Application</span>
                            )}
                            {internship?.internshipMode === 'GROUP' && app.departmentGroup && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[8px] uppercase tracking-widest border border-purple-200">{app.departmentGroup.department}</span>
                            )}
                        </p>
                        <p className="text-[10px] text-outline font-medium tracking-tighter uppercase mt-0.5">ID: {app.trackingId.slice(-6)} • {app.assignedRole || 'No Role'}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-tight max-w-[180px] truncate">{app.student?.collegeName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[8px] font-bold px-1 py-0.5 bg-primary/10 text-primary rounded-sm uppercase tracking-widest">NIRF #{app.student?.nirfRanking || 'N/A'}</span>
                    <span className="text-[8px] font-bold px-1 py-0.5 bg-surface-container-high text-outline rounded-sm uppercase tracking-widest">{app.student?.collegeCategory}</span>
                </div>
            </td>
            <td className="px-6 py-5 text-center">
                {!app.isResumeProcessed ? (
                    <div className="flex flex-col items-center gap-1.5 animate-pulse">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">Syncing AI Match</span>
                        <span className="text-[8px] font-bold text-outline/40 italic">Processing Resume...</span>
                    </div>
                ) : (
                    <span className="text-lg font-bold text-primary">
                        {(app.resumeMatchScore || 0).toFixed(1)}%
                    </span>
                )}
                <div className="w-16 bg-surface-container-high h-0.5 mt-2 mx-auto rounded-full overflow-hidden">
                    <div
                        className={`h-full ${app.isResumeProcessed ? 'bg-primary' : 'bg-outline/20'}`}
                        style={{ width: `${Math.max(0, Math.min(100, Number(app.resumeMatchScore || 0)))}%` }}
                    ></div>
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
                    {['SUBMITTED', 'SHORTLISTED', 'UNDER_COMMITTEE_REVIEW', 'WAITLISTED', 'APPROVED', 'HIRED'].includes(app.status) && (
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
