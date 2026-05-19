import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api, { MEDIA_URL } from '../../utils/api';
import {
    ArrowLeft, MapPin, Clock, Users, Briefcase, ClipboardList,
    FileText, X, Check, AlertCircle, ChevronRight, BookOpen, Award, Download
} from 'lucide-react';

// ── JD Download button (reusable) ─────────────────────────────────────────────
const JdDownloadButton = ({ internship, className = '' }) => {
    if (!internship?.jdUrl) return null;
    return (
        <a
            href={`${MEDIA_URL}/${internship.jdUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            download={internship.jdFileName || 'Job_Description.pdf'}
            className={`inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all ${className}`}
            onClick={e => e.stopPropagation()}
        >
            <Download size={13} /> Download JD
        </a>
    );
};

// ── JD Modal ──────────────────────────────────────────────────────────────────
const JdModal = ({ ps, internship, onClose }) => (
    createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 z-10">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white flex justify-between items-start gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider mb-3">
                            <ClipboardList size={13} /> PS-{ps.problemStatementNumber} · {ps.department}
                        </div>
                        <h2 className="text-2xl font-black font-rajdhani leading-tight mb-1">{ps.title}</h2>
                        <p className="text-indigo-200 text-sm font-medium">{internship.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-7 max-h-[60vh]">
                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-indigo-50 rounded-xl">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Vacancies</p>
                            <p className="text-2xl font-black text-indigo-900">{ps.vacancies}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-lg font-black text-slate-900">{internship.duration}</p>
                        </div>
                        {Array.isArray(ps.locations) && ps.locations.length > 0 && (
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Locations</p>
                                <p className="text-sm font-black text-slate-900">{ps.locations.join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {ps.description && (
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
                                <BookOpen size={16} className="text-indigo-500" /> Description
                            </h3>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{ps.description}</p>
                        </div>
                    )}

                    {ps.requirements && (
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
                                <Check size={16} className="text-emerald-500" /> Requirements
                            </h3>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{ps.requirements}</p>
                        </div>
                    )}

                    {internship.description && (
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
                                <Award size={16} className="text-amber-500" /> About the Internship Program
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">{internship.description}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center gap-3 shrink-0 flex-wrap">
                    {internship.jdUrl && (
                        <a
                            href={`${MEDIA_URL}/${internship.jdUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={internship.jdFileName || 'Job_Description.pdf'}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                        >
                            <Download size={13} /> Download JD
                        </a>
                    )}
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:text-slate-900 transition-colors">
                        Close
                    </button>
                    <Link
                        to={`/student/internships/${internship.id}/apply?role=${encodeURIComponent(ps.title)}&groupId=${ps.groupId}&problemStatementId=${ps.id}`}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm"
                    >
                        <ChevronRight size={16} /> Apply for This PS
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    )
);

// ── Problem Statement Card ────────────────────────────────────────────────────
const PsCard = ({ ps, internship, alreadyApplied }) => {
    const [showJd, setShowJd] = useState(false);

    const applyUrl = `/student/internships/${internship.id}/apply`
        + `?role=${encodeURIComponent(ps.title)}`
        + `&groupId=${ps.groupId}`
        + `&problemStatementId=${ps.id}`;

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                {/* Top accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-indigo-700" />

                <div className="p-6">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
                            <ClipboardList size={11} /> PS-{ps.problemStatementNumber}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest">
                            <Briefcase size={11} /> {ps.department}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                        {ps.title}
                    </h3>

                    {/* Description preview */}
                    {ps.description && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-5">
                            {ps.description}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="space-y-2.5 mb-6">
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center border border-gray-100 dark:border-slate-600">
                                <Users size={14} className="text-amber-500" />
                            </div>
                            {ps.vacancies} {ps.vacancies === 1 ? 'vacancy' : 'vacancies'}
                        </div>
                        {Array.isArray(ps.locations) && ps.locations.length > 0 && (
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-slate-300">
                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center border border-gray-100 dark:border-slate-600">
                                    <MapPin size={14} className="text-[#003087] dark:text-blue-400" />
                                </div>
                                {ps.locations.join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowJd(true)}
                            className="flex-1 py-2.5 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl border border-gray-200 dark:border-slate-600 transition-all flex items-center justify-center gap-2"
                        >
                            <FileText size={13} /> View JD
                        </button>
                        {alreadyApplied ? (
                            <div className="flex-[2] py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-widest rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
                                <Check size={13} /> Applied
                            </div>
                        ) : (
                            <Link
                                to={applyUrl}
                                className="flex-[2] py-2.5 bg-[#D4A017] hover:bg-[#b88c14] text-[#00266b] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                Apply Now <ChevronRight size={13} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {showJd && <JdModal ps={ps} internship={internship} onClose={() => setShowJd(false)} />}
        </>
    );
};

// ── Role / Field Card (for non-COLLABORATIVE internships) ─────────────────────
const RoleCard = ({ option, internship, alreadyApplied }) => {
    const applyUrl = `/student/internships/${internship.id}/apply`
        + `?role=${encodeURIComponent(option.roleName)}`
        + (option.groupId ? `&groupId=${option.groupId}` : '')
        + (option.fieldId ? `&fieldId=${option.fieldId}` : '');

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-700" />

            <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest">
                        <Briefcase size={11} /> {option.department}
                    </span>
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2 break-words">
                    {option.roleName}
                </h3>

                {option.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-5 break-words">
                        {option.description}
                    </p>
                )}

                <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center border border-gray-100 dark:border-slate-600">
                            <Users size={14} className="text-amber-500" />
                        </div>
                        {option.vacancies || 'N/A'} {Number(option.vacancies) === 1 ? 'vacancy' : 'vacancies'}
                    </div>
                    {Array.isArray(option.locations) && option.locations.length > 0 && (
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center border border-gray-100 dark:border-slate-600">
                                <MapPin size={14} className="text-[#003087] dark:text-blue-400" />
                            </div>
                            {option.locations.map(l => typeof l === 'string' ? l : (l?.name || '')).join(', ')}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {internship.jdUrl && (
                        <a href={`${MEDIA_URL}/${internship.jdUrl}`}
                            target="_blank" rel="noopener noreferrer"
                            download={internship.jdFileName || 'Job_Description.pdf'}
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 text-gray-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl border border-gray-200 dark:border-slate-600 transition-all shrink-0">
                            <Download size={13} /> JD
                        </a>
                    )}
                    {alreadyApplied ? (
                        <div className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-widest rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
                            <Check size={13} /> Applied
                        </div>
                    ) : (
                        <Link
                            to={applyUrl}
                            className="flex-1 py-2.5 bg-[#D4A017] hover:bg-[#b88c14] text-[#00266b] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Apply Now <ChevronRight size={13} />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const InternshipDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [internship, setInternship] = useState(null);
    const [appliedPsIds, setAppliedPsIds] = useState(new Set());
    const [appliedFieldIds, setAppliedFieldIds] = useState(new Set());
    const [appliedInternshipIds, setAppliedInternshipIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [intRes, profileRes] = await Promise.allSettled([
                    api.get(`/internships/${id}`),
                    api.get('/students/profile')
                ]);

                if (intRes.status === 'fulfilled') {
                    setInternship(intRes.value.data.data);
                } else {
                    setError('Internship not found.');
                }

                if (profileRes.status === 'fulfilled') {
                    const apps = profileRes.value.data.data?.applications || [];
                    setAppliedPsIds(new Set(apps.map(a => a.problemStatementId).filter(Boolean)));
                    setAppliedFieldIds(new Set(apps.map(a => a.fieldId).filter(Boolean)));
                    setAppliedInternshipIds(new Set(apps.map(a => a.internshipId).filter(Boolean)));
                }
            } catch {
                setError('Failed to load internship details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
        </div>
    );

    if (error) return (
        <div className="max-w-lg mx-auto mt-16 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Not Found</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={() => navigate('/student/internships')} className="text-indigo-600 font-bold hover:underline">
                Back to Internships
            </button>
        </div>
    );

    // Flatten all problem statements across all groups (only submitted groups have PSes)
    const allProblemStatements = (internship.departmentGroups || []).flatMap(group =>
        (group.problemStatements || []).map(ps => ({
            ...ps,
            department: group.department,
            groupId: group.id
        }))
    ).sort((a, b) => (a.problemStatementNumber ?? 0) - (b.problemStatementNumber ?? 0));

    // Build role/field options for non-COLLABORATIVE internships
    const roleOptions = [];
    const isGroup = internship.internshipMode === 'GROUP';
    const isCollab = internship.internshipType === 'COLLABORATIVE';

    if (!isCollab) {
        if (isGroup) {
            // GROUP NON_STIPEND — list each (group, field) pair
            (internship.departmentGroups || []).forEach(group => {
                (group.fields || []).forEach(f => {
                    roleOptions.push({
                        key: `${group.id}-${f.id}`,
                        department: group.department,
                        roleName: f.fieldName,
                        description: f.description,
                        vacancies: f.vacancies,
                        locations: f.locations || [],
                        groupId: group.id,
                        fieldId: f.id,
                    });
                });
                if ((group.fields || []).length === 0) {
                    roleOptions.push({
                        key: group.id,
                        department: group.department,
                        roleName: group.title || group.department,
                        vacancies: group.openings,
                        groupId: group.id,
                    });
                }
            });
        } else if (internship.internshipType === 'NON_STIPEND') {
            const fields = internship.fields && internship.fields.length > 0
                ? internship.fields
                : [{ id: '', fieldName: internship.title, vacancies: internship.openingsCount, locations: internship.location ? [internship.location] : [] }];
            fields.forEach((f, idx) => {
                roleOptions.push({
                    key: f.id || `field-${idx}`,
                    department: internship.department,
                    roleName: f.fieldName,
                    description: f.description,
                    vacancies: f.vacancies,
                    locations: f.locations || [],
                    fieldId: f.id,
                });
            });
        } else {
            // SINGLE non-collab fallback: roles list
            const roles = internship.rolesData || (internship.roles
                ? internship.roles.split(',').map((r, i) => ({ name: r.trim(), openings: 'N/A', _idx: i }))
                : [{ name: internship.title, openings: internship.openingsCount }]);
            roles.forEach((r, idx) => {
                roleOptions.push({
                    key: `role-${idx}`,
                    department: internship.department,
                    roleName: r.name,
                    vacancies: r.openings,
                });
            });
        }
    }

    const hasPS = allProblemStatements.length > 0;
    const hasRoles = roleOptions.length > 0;
    const totalVacancies = hasPS
        ? allProblemStatements.reduce((s, ps) => s + (ps.vacancies || 0), 0)
        : roleOptions.reduce((s, o) => s + (Number(o.vacancies) || 0), 0);
    const totalOptions = hasPS ? allProblemStatements.length : roleOptions.length;
    const optionWord = hasPS ? 'Problem Statement' : 'Role';

    return (
        <div className="max-w-5xl mx-auto py-4">
            {/* Back */}
            <button
                onClick={() => navigate('/student/internships')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Internships
            </button>

            {/* Master Internship Header */}
            <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10">
                    {internship.batch?.title && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider mb-3">
                            {internship.batch.title}
                        </div>
                    )}
                    <h1 className="text-3xl font-black font-rajdhani mb-2 leading-tight">{internship.title}</h1>
                    <p className="text-indigo-200 text-sm font-medium mb-5 leading-relaxed max-w-2xl">
                        {internship.description}
                    </p>
                    <div className="flex flex-wrap gap-5 text-sm font-bold text-indigo-200">
                        {internship.duration && <span className="flex items-center gap-2"><Clock size={15} /> {internship.duration}</span>}
                        {totalOptions > 0 && (
                            <span className="flex items-center gap-2"><ClipboardList size={15} /> {totalOptions} {optionWord}{totalOptions !== 1 ? 's' : ''}</span>
                        )}
                        {totalVacancies > 0 && (
                            <span className="flex items-center gap-2"><Users size={15} /> {totalVacancies} Total Vacancies</span>
                        )}
                    </div>
                    {internship.jdUrl && (
                        <div className="mt-5 pt-5 border-t border-white/10">
                            <JdDownloadButton internship={internship} />
                            {internship.jdFileName && (
                                <span className="ml-3 text-[11px] text-indigo-300 font-medium">{internship.jdFileName}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Options: Problem Statements (collaborative) OR Roles/Fields (non-collaborative) */}
            {hasPS ? (
                <>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                        <ClipboardList size={18} className="text-indigo-500" />
                        Available Problem Statements
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {allProblemStatements.map(ps => (
                            <PsCard
                                key={ps.id}
                                ps={ps}
                                internship={internship}
                                alreadyApplied={appliedPsIds.has(ps.id)}
                            />
                        ))}
                    </div>
                </>
            ) : hasRoles ? (
                <>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Briefcase size={18} className="text-emerald-500" />
                        Available Roles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {roleOptions.map(opt => (
                            <RoleCard
                                key={opt.key}
                                option={opt}
                                internship={internship}
                                alreadyApplied={opt.fieldId
                                    ? appliedFieldIds.has(opt.fieldId)
                                    : appliedInternshipIds.has(internship.id)}
                            />
                        ))}
                    </div>
                </>
            ) : isCollab ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-3xl">
                    <ClipboardList size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-1">Problem Statements Pending</h3>
                    <p className="text-gray-400 dark:text-slate-400 text-sm font-medium">
                        Departments are still preparing their problem statements. Check back soon.
                    </p>
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-3xl">
                    <Briefcase size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-1">No Roles Configured Yet</h3>
                    <p className="text-gray-400 dark:text-slate-400 text-sm font-medium">
                        This internship doesn't have any roles defined. Please check back later.
                    </p>
                </div>
            )}
        </div>
    );
};

export default InternshipDetailPage;
