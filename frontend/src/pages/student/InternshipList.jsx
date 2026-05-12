import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
    MapPin, Users, Briefcase, Search, ArrowRight,
    Clock, IndianRupee, ClipboardList
} from 'lucide-react';

const formatStipendRange = (stipendAmounts) => {
    if (!stipendAmounts || typeof stipendAmounts !== 'object') return null;
    const amounts = Object.values(stipendAmounts).filter(v => v != null && !isNaN(Number(v))).map(Number);
    if (amounts.length === 0) return null;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const fmt = v => `₹${v.toLocaleString('en-IN')}`;
    return min === max ? `${fmt(min)} / month` : `${fmt(min)} – ${fmt(max)} / month`;
};

// ── Card for GROUP COLLABORATIVE internship ───────────────────────────────────
const GroupCollabCard = ({ internship }) => {
    const allPs = (internship.departmentGroups || []).flatMap(g => g.problemStatements || []);
    const totalVacancies = allPs.reduce((s, ps) => s + (ps.vacancies || 0), 0);
    const deptCount = internship.departmentGroups?.length || 0;
    const stipendRange = formatStipendRange(internship.stipendAmounts);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#003087]/20 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col h-full group overflow-hidden relative">
            {/* Top strip */}
            <div className="h-2.5 w-full bg-gradient-to-r from-indigo-500 to-indigo-700" />

            <div className="p-6 lg:p-7 flex-grow flex flex-col">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <ClipboardList size={11} /> Multi-Department
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Collaborative
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

                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-6 line-clamp-3 leading-relaxed flex-grow">
                    {internship.description}
                </p>

                <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-slate-700 mt-auto mb-6">
                    <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                            <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {internship.duration}
                    </div>
                    <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                            <Briefcase size={14} className="text-[#003087] dark:text-blue-400" />
                        </div>
                        {deptCount} Department{deptCount !== 1 ? 's' : ''} Participating
                    </div>
                    {allPs.length > 0 ? (
                        <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                                <Users size={14} className="text-amber-500" />
                            </div>
                            {totalVacancies} Total Vacancies · {allPs.length} Problem Statement{allPs.length !== 1 ? 's' : ''}
                        </div>
                    ) : (
                        <div className="flex items-center text-sm font-bold text-amber-600 gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                                <Clock size={14} />
                            </div>
                            Problem statements being prepared…
                        </div>
                    )}
                    {stipendRange && (
                        <div className="flex items-center text-sm font-bold text-emerald-700 dark:text-emerald-400 gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                                <IndianRupee size={14} />
                            </div>
                            {stipendRange}
                        </div>
                    )}
                </div>

                <Link
                    to={`/student/internships/${internship.id}`}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-widest text-[10px]"
                >
                    View Problem Statements <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
};

// ── Card for SINGLE internship (role-based) ───────────────────────────────────
const SingleRoleCard = ({ internship, item }) => {
    const stipendRange = formatStipendRange(internship.stipendAmounts);
    const applyUrl = `/student/internships/${internship.id}/apply`
        + `?role=${encodeURIComponent(item.roleName)}`
        + (item.groupId ? `&groupId=${item.groupId}` : '')
        + (item.fieldId ? `&fieldId=${item.fieldId}` : '')
        + (item.problemStatementId ? `&problemStatementId=${item.problemStatementId}` : '');

    const deptColor = item.department === 'IT' ? 'bg-blue-500' :
        item.department === 'Operations' ? 'bg-emerald-500' :
        item.department === 'HR' ? 'bg-[#D4A017]' : 'bg-[#003087]';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#003087]/20 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col h-full group overflow-hidden relative">
            <div className={`h-2.5 w-full ${deptColor}`} />

            <div className="p-6 lg:p-7 flex-grow flex flex-col">
                <div className="flex flex-wrap items-center justify-between mb-5 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <Briefcase size={11} /> {item.department}
                        </div>
                        {item.isNonStipend ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                Learning Internship
                            </div>
                        ) : internship.stipendType === 'COLLABORATIVE' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                Collaborative
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                Non-Collaborative
                            </div>
                        )}
                    </div>
                    {item.psNumber != null && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[9px] font-black uppercase tracking-widest">
                            <ClipboardList size={11} /> PS-{item.psNumber}
                        </div>
                    )}
                </div>

                <h2 className="text-xl lg:text-2xl font-black font-rajdhani text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-[#003087] dark:group-hover:text-blue-400 transition-colors">
                    {internship.title}
                </h2>
                <div className="text-[11px] font-extrabold text-gray-400 dark:text-slate-500 tracking-wide mb-4 line-clamp-1 flex items-center gap-1.5">
                    <Briefcase size={10} className="shrink-0" />
                    <span className="text-[#003087] dark:text-blue-400 opacity-80">{item.roleName}</span>
                </div>

                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-6 line-clamp-3 leading-relaxed flex-grow">
                    {item.description || internship.description}
                </p>

                <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-slate-700 mt-auto mb-6">
                    <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                            <MapPin size={14} className="text-[#003087] dark:text-blue-400" />
                        </div>
                        {item.isNonStipend
                            ? (Array.isArray(item.locations) && item.locations.length > 0 ? item.locations.join(', ') : 'Multiple')
                            : (internship.location || 'Multiple Locations')}
                    </div>
                    <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                            <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {internship.duration}
                    </div>
                    <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300 gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
                            <Users size={14} className="text-amber-500" />
                        </div>
                        {item.openings} {item.isNonStipend ? 'Vacancies' : 'Openings'}
                    </div>
                    {stipendRange && !item.isNonStipend && (
                        <div className="flex items-center text-sm font-bold text-emerald-700 dark:text-emerald-400 gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                                <IndianRupee size={14} />
                            </div>
                            {stipendRange}
                        </div>
                    )}
                </div>

                <Link
                    to={applyUrl}
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
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchInternships = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/internships?page=${page}&limit=20`);
                setInternships(res.data.data);
                setTotalPages(res.data.totalPages || 1);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        fetchInternships();
    }, [page]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003087] dark:border-blue-500" />
        </div>
    );

    // Build card list:
    // - GROUP COLLABORATIVE → one card per internship (GroupCollabCard)
    // - Everything else → expand to role/field cards (SingleRoleCard)
    const cards = [];
    internships.forEach(internship => {
        const isGroupCollab = internship.internshipMode === 'GROUP'
            && internship.internshipType === 'COLLABORATIVE';

        if (isGroupCollab) {
            // Search match on title, description, or any PS title
            const q = searchTerm.toLowerCase();
            const matches = !q
                || internship.title.toLowerCase().includes(q)
                || internship.description?.toLowerCase().includes(q)
                || internship.batch?.title?.toLowerCase().includes(q)
                || (internship.departmentGroups || []).some(g =>
                    g.department.toLowerCase().includes(q) ||
                    (g.problemStatements || []).some(ps => ps.title.toLowerCase().includes(q))
                );
            if (matches) {
                cards.push(
                    <GroupCollabCard key={internship.id} internship={internship} />
                );
            }
            return;
        }

        // SINGLE and GROUP NON_STIPEND: expand to individual role/field cards
        const items = [];
        if (internship.internshipMode === 'GROUP') {
            // NON_STIPEND GROUP — expand by group
            (internship.departmentGroups || []).forEach(group => {
                const fields = group.fields || [];
                fields.forEach(field => {
                    items.push({
                        department: group.department,
                        roleName: field.fieldName,
                        openings: field.vacancies || 'N/A',
                        groupId: group.id,
                        fieldId: field.id,
                        locations: field.locations || [],
                        isNonStipend: true
                    });
                });
                if (fields.length === 0) {
                    items.push({
                        department: group.department,
                        roleName: group.title || group.department,
                        openings: group.openings || 'N/A',
                        groupId: group.id
                    });
                }
            });
        } else if (internship.internshipType === 'NON_STIPEND') {
            const displayFields = (internship.fields && internship.fields.length > 0)
                ? internship.fields
                : [{ 
                    id: '', 
                    fieldName: internship.title, 
                    vacancies: internship.openingsCount,
                    locations: internship.location ? [internship.location] : [] 
                  }];

            displayFields.forEach(field => {
                items.push({
                    department: internship.department,
                    roleName: field.fieldName,
                    description: field.description,
                    openings: field.vacancies || 'N/A',
                    fieldId: field.id,
                    locations: field.locations || [],
                    isNonStipend: true
                });
            });
        } else {
            const roles = internship.rolesData || (internship.roles
                ? internship.roles.split(',').map(r => ({ name: r.trim(), openings: 'N/A' }))
                : [{ name: internship.title, openings: internship.openingsCount }]);
            roles.forEach(role => {
                items.push({
                    department: internship.department,
                    roleName: role.name,
                    openings: role.openings || internship.openingsCount || 'N/A'
                });
            });
        }

        items.forEach((item, idx) => {
            const q = searchTerm.toLowerCase();
            const matches = !q
                || item.roleName?.toLowerCase().includes(q)
                || item.department?.toLowerCase().includes(q)
                || internship.title?.toLowerCase().includes(q);
            if (matches) {
                cards.push(
                    <SingleRoleCard key={`${internship.id}-${idx}`} internship={internship} item={item} />
                );
            }
        });
    });

    return (
        <div className="w-full py-4 transition-colors duration-300">
            {/* Search */}
            <div className="mb-8">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search internships or departments..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {cards.length === 0 ? (
                <div className="bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-[2rem] p-12 text-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
                        <Briefcase size={36} className="text-gray-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 font-rajdhani">No internships found</h3>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 font-bold text-[#003087] dark:text-blue-400 hover:underline text-sm"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {cards}
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
