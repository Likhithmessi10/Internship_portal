import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
    MapPin, Users, Briefcase, Search, ArrowRight,
    Clock, IndianRupee, ClipboardList, Zap
} from 'lucide-react';

// ── Fuzzy specialization match ────────────────────────────────────────────────
const tokenize = (s = '') => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
const fuzzyMatch = (studentBranch = '', fieldSpecializations = []) => {
    if (!studentBranch || !fieldSpecializations?.length) return false;
    const branchTokens = tokenize(studentBranch);
    return fieldSpecializations.some(spec => {
        const specTokens = tokenize(spec);
        return branchTokens.some(bt => specTokens.some(st => bt.includes(st) || st.includes(bt)));
    });
};

const formatStipendRange = (stipendAmounts) => {
    if (!stipendAmounts || typeof stipendAmounts !== 'object') return null;
    const amounts = Object.values(stipendAmounts).filter(v => v != null && !isNaN(Number(v))).map(Number);
    if (amounts.length === 0) return null;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const fmt = v => `₹${v.toLocaleString('en-IN')}`;
    return min === max ? `${fmt(min)} / month` : `${fmt(min)} – ${fmt(max)} / month`;
};

// ── Summarize an internship into stats used by the master card ────────────────
const summarize = (internship) => {
    const isGroup = internship.internshipMode === 'GROUP';
    const isCollab = internship.internshipType === 'COLLABORATIVE';
    const isNonStipend = internship.internshipType === 'NON_STIPEND';

    let totalVacancies = 0;
    let optionCount = 0;          // number of selectable roles / fields / problem statements
    let optionLabel = 'Option';
    const departments = new Set();
    const specializations = new Set();

    if (isGroup && isCollab) {
        const allPs = (internship.departmentGroups || []).flatMap(g => g.problemStatements || []);
        totalVacancies = allPs.reduce((s, ps) => s + (ps.vacancies || 0), 0);
        optionCount = allPs.length;
        optionLabel = 'Problem Statement';
        (internship.departmentGroups || []).forEach(g => departments.add(g.department));
    } else if (isGroup && isNonStipend) {
        (internship.departmentGroups || []).forEach(group => {
            departments.add(group.department);
            (group.fields || []).forEach(f => {
                totalVacancies += Number(f.vacancies) || 0;
                optionCount += 1;
                (f.specializations || []).forEach(s => specializations.add(s));
            });
        });
        optionLabel = 'Role';
    } else if (isNonStipend) {
        const fields = internship.fields && internship.fields.length > 0
            ? internship.fields
            : [{ fieldName: internship.title, vacancies: internship.openingsCount }];
        fields.forEach(f => {
            totalVacancies += Number(f.vacancies) || 0;
            optionCount += 1;
            (f.specializations || []).forEach(s => specializations.add(s));
        });
        if (internship.department) departments.add(internship.department);
        optionLabel = 'Role';
    } else {
        // SINGLE COLLABORATIVE — uses rolesData / roles string
        const roles = internship.rolesData || (internship.roles
            ? internship.roles.split(',').map(r => ({ name: r.trim(), openings: 0 }))
            : [{ name: internship.title, openings: internship.openingsCount || 0 }]);
        roles.forEach(r => { totalVacancies += Number(r.openings) || 0; optionCount += 1; });
        if (internship.department) departments.add(internship.department);
        optionLabel = 'Role';
    }

    return {
        isGroup,
        isCollab,
        isNonStipend,
        totalVacancies: totalVacancies || internship.openingsCount || 0,
        optionCount: optionCount || 1,
        optionLabel,
        departments: [...departments],
        specializations: [...specializations],
        stipendRange: formatStipendRange(internship.stipendAmounts),
    };
};

// ── Unified master internship card ────────────────────────────────────────────
const MasterInternshipCard = ({ internship, isMatch }) => {
    const s = summarize(internship);
    const detailUrl = `/student/internships/${internship.id}`;

    const typeBadge = s.isNonStipend
        ? { label: 'Learning Internship', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' }
        : s.isCollab
            ? { label: 'Collaborative', cls: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' }
            : { label: 'Internship', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' };

    const stripGradient = s.isGroup
        ? 'bg-gradient-to-r from-indigo-500 to-indigo-700'
        : s.isNonStipend
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-700'
            : 'bg-gradient-to-r from-[#003087] to-[#0050b0]';

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group overflow-hidden relative ${isMatch ? 'border-violet-300 dark:border-violet-600 ring-2 ring-violet-300/40' : 'border-gray-100 dark:border-slate-700 hover:border-[#003087]/20 dark:hover:border-blue-500/30'}`}>
            {isMatch && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white text-[9px] font-black uppercase rounded-full shadow-md">
                    <Zap size={9} /> Matches Your Profile
                </div>
            )}
            <div className={`h-2.5 w-full ${stripGradient}`} />

            <div className="p-6 lg:p-7 flex-grow flex flex-col">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                    {s.isGroup && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <ClipboardList size={11} /> Multi-Department
                        </div>
                    )}
                    {!s.isGroup && s.departments[0] && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <Briefcase size={11} /> {s.departments[0]}
                        </div>
                    )}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-sm ${typeBadge.cls}`}>
                        {typeBadge.label}
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl lg:text-2xl font-black font-rajdhani text-gray-900 dark:text-white mb-1.5 line-clamp-2 leading-tight group-hover:text-[#003087] dark:group-hover:text-blue-400 transition-colors">
                    {internship.title}
                </h2>
                {internship.batch?.title && (
                    <p className="text-[11px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-3">
                        {internship.batch.title}
                    </p>
                )}

                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-6 line-clamp-3 leading-relaxed break-words flex-grow">
                    {internship.description}
                </p>

                <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-slate-700 mt-auto mb-6">
                    {internship.duration && (
                        <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                                <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            {internship.duration}
                        </div>
                    )}
                    {(internship.location || s.departments.length > 1) && (
                        <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                                {s.departments.length > 1
                                    ? <Briefcase size={14} className="text-[#003087] dark:text-blue-400" />
                                    : <MapPin size={14} className="text-[#003087] dark:text-blue-400" />}
                            </div>
                            {s.departments.length > 1
                                ? `${s.departments.length} Departments Participating`
                                : (internship.location || 'Multiple Locations')}
                        </div>
                    )}
                    <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                            <Users size={14} className="text-amber-500" />
                        </div>
                        {s.totalVacancies > 0 ? `${s.totalVacancies} Total Vacancies` : 'Vacancies TBD'}
                        {s.optionCount > 0 && ` · ${s.optionCount} ${s.optionLabel}${s.optionCount !== 1 ? 's' : ''}`}
                    </div>
                    {internship.applicationDeadline && (
                        <div className="flex items-center text-sm font-bold text-red-600 dark:text-red-400 gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                                <Clock size={14} className="text-red-500" />
                            </div>
                            Deadline: {new Date(internship.applicationDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    )}
                    {s.stipendRange && (
                        <div className="flex items-center text-sm font-bold text-emerald-700 dark:text-emerald-400 gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                                <IndianRupee size={14} />
                            </div>
                            {s.stipendRange}
                        </div>
                    )}
                </div>

                <Link
                    to={detailUrl}
                    className="w-full bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:bg-[#003087] dark:group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white active:scale-[0.98] uppercase tracking-widest text-[10px]"
                >
                    View Details & Apply <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
};

// ── Main list ─────────────────────────────────────────────────────────────────
const InternshipList = () => {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [specFilter, setSpecFilter] = useState('');
    const [studentBranch, setStudentBranch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [intRes, profileRes] = await Promise.allSettled([
                    api.get(`/internships?page=${page}&limit=20`),
                    api.get('/students/profile')
                ]);
                if (intRes.status === 'fulfilled') {
                    setInternships(intRes.value.data.data);
                    setTotalPages(intRes.value.data.totalPages || 1);
                }
                if (profileRes.status === 'fulfilled') {
                    const profile = profileRes.value.data.data;
                    setStudentBranch(profile?.branch || '');
                }
            } catch { /* silent */ }
            finally { setLoading(false); }
        };
        fetchAll();
    }, [page]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003087] dark:border-blue-500" />
        </div>
    );

    // Aggregate all specializations across the internship for fuzzy match against student branch
    const collectSpecs = (internship) => {
        const out = [];
        (internship.departmentGroups || []).forEach(g => {
            (g.fields || []).forEach(f => (f.specializations || []).forEach(s => out.push(s)));
            (g.problemStatements || []).forEach(ps => (ps.specializations || []).forEach(s => out.push(s)));
        });
        (internship.fields || []).forEach(f => (f.specializations || []).forEach(s => out.push(s)));
        return out;
    };

    // Build one master card per internship
    const q = searchTerm.toLowerCase();
    const cards = internships.map(internship => {
        const specs = collectSpecs(internship);

        // Search match
        const matchesSearch = !q
            || internship.title?.toLowerCase().includes(q)
            || internship.description?.toLowerCase().includes(q)
            || internship.department?.toLowerCase().includes(q)
            || internship.batch?.title?.toLowerCase().includes(q)
            || (internship.departmentGroups || []).some(g =>
                g.department?.toLowerCase().includes(q)
                || (g.problemStatements || []).some(ps => ps.title?.toLowerCase().includes(q))
                || (g.fields || []).some(f => f.fieldName?.toLowerCase().includes(q))
            )
            || (internship.fields || []).some(f => f.fieldName?.toLowerCase().includes(q));

        const matchesSpec = !specFilter || specs.some(s => s.toLowerCase().includes(specFilter.toLowerCase()));
        if (!matchesSearch || !matchesSpec) return null;

        const isMatch = fuzzyMatch(studentBranch, specs);
        return {
            key: internship.id,
            isMatch,
            element: <MasterInternshipCard key={internship.id} internship={internship} isMatch={isMatch} />,
        };
    }).filter(Boolean);

    // Matched internships first
    cards.sort((a, b) => (b.isMatch ? 1 : 0) - (a.isMatch ? 1 : 0));

    return (
        <div className="w-full py-4 transition-colors duration-300">
            {/* Search + Spec Filter */}
            <div className="mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-400" />
                        </div>
                        <input type="text" placeholder="Search internships or departments..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <select value={specFilter} onChange={e => setSpecFilter(e.target.value)}
                        className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">All Specializations</option>
                        {[...new Set(internships.flatMap(i => collectSpecs(i)))].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                {studentBranch && cards.some(c => c.isMatch) && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl text-sm font-bold text-violet-700 dark:text-violet-300">
                        <Zap size={14} className="text-violet-500" />
                        {cards.filter(c => c.isMatch).length} internship{cards.filter(c => c.isMatch).length !== 1 ? 's' : ''} match your branch ({studentBranch}) — shown first
                    </div>
                )}
            </div>

            {/* Grid */}
            {cards.length === 0 ? (
                <div className="bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-[2rem] p-12 text-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
                        <Briefcase size={36} className="text-gray-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 font-rajdhani">No internships found</h3>
                    {(searchTerm || specFilter) && (
                        <button onClick={() => { setSearchTerm(''); setSpecFilter(''); }}
                            className="mt-4 font-bold text-[#003087] dark:text-blue-400 hover:underline text-sm">
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {cards.map(c => c.element)}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center gap-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-6 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        Previous
                    </button>
                    <span className="font-bold text-gray-500 dark:text-slate-400">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-6 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default InternshipList;
