import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { Users, Edit, CheckCircle, Clock, AlertCircle, Loader2, X } from 'lucide-react';

// ── Committee modal ───────────────────────────────────────────────────────────
const CommitteeModal = ({ internshipId, groupId, psId, internshipTitle, deptLabel, department, isGroup, psMentor, onClose }) => {
    const { user } = useAuth();
    const [mentors, setMentors] = useState([]);
    const [prtis, setPrtis]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [formData, setFormData] = useState({
        interviewDate: '', meetLink: '', mentorId: psMentor?.id || '', prtiMemberId: ''
    });

    const committeeUrl = groupId
        ? `/admin/internships/${internshipId}/committee?departmentGroupId=${groupId}`
        : `/admin/internships/${internshipId}/committee`;

    useEffect(() => {
        const load = async () => {
            try {
                const fetches = [
                    api.get(`/admin/users?role=MENTOR&department=${encodeURIComponent(department)}`),
                    api.get('/admin/users?role=CE_PRTI'),
                ];
                // Only fetch committee for SINGLE internships (GROUP uses PS mentor)
                if (!isGroup) fetches.push(api.get(committeeUrl));

                const results = await Promise.all(fetches);
                setMentors(results[0].data.data || []);
                setPrtis(results[1].data.data || []);
                if (!isGroup && results[2]) {
                    const c = results[2].data.data;
                    if (c) {
                        setFormData(f => ({
                            ...f,
                            interviewDate: c.interviewDate ? new Date(c.interviewDate).toISOString().split('T')[0] : '',
                            meetLink:       c.meetLink || '',
                            mentorId:       c.membersData?.mentorId || '',
                            prtiMemberId:   c.membersData?.prtiMemberId || ''
                        }));
                    }
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [committeeUrl, department, isGroup]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isGroup && psId) {
                // GROUP: save mentor directly to the problem statement
                await api.put(
                    `/admin/internships/${internshipId}/groups/${groupId}/problem-statements/${psId}/mentor`,
                    { mentorId: formData.mentorId }
                );
            } else {
                // SINGLE: save to committee
                const selectedMentor = mentors.find(m => m.id === formData.mentorId);
                const selectedPrti   = prtis.find(p => p.id === formData.prtiMemberId);
                await api.put(committeeUrl, {
                    interviewDate: formData.interviewDate || undefined,
                    meetLink:      formData.meetLink || undefined,
                    membersData: {
                        mentorId:       formData.mentorId,
                        mentorName:     selectedMentor?.name || '',
                        prtiMemberId:   formData.prtiMemberId,
                        prtiMemberName: selectedPrti?.name || ''
                    }
                });
            }
            alert('Mentor updated successfully!');
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-outline-variant/10 animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-primary flex items-center gap-2">
                            <Users size={18} /> Manage Committee
                        </h3>
                        <p className="text-xs text-outline/60 font-medium mt-0.5">{internshipTitle} · {deptLabel}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-outline-variant/10 transition-colors">
                        <X size={18} className="text-outline" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-primary/40" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Mentor */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-outline">
                                {isGroup ? `Mentor for ${deptLabel}` : 'Assigned Mentor'}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            {isGroup && (
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Assigned to all shortlisted applications under this problem statement.
                                </p>
                            )}
                            <select
                                required
                                disabled={!isGroup && user?.role === 'CE_PRTI'}
                                value={formData.mentorId}
                                onChange={e => setFormData(f => ({ ...f, mentorId: e.target.value }))}
                                className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">-- Select a Mentor --</option>
                                {mentors.length === 0 && <option disabled>No mentors for {department}</option>}
                                {mentors.map(m => (
                                    <option key={m.id} value={m.id}>{m.name || m.email} ({m.department})</option>
                                ))}
                            </select>
                        </div>

                        {/* PRTI + schedule — SINGLE only */}
                        {!isGroup && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">
                                        PRTI Member
                                        {user?.role === 'HOD' && <span className="text-amber-500 ml-2">(PRTI action)</span>}
                                    </label>
                                    <select disabled={user?.role === 'HOD'} value={formData.prtiMemberId}
                                        onChange={e => setFormData(f => ({ ...f, prtiMemberId: e.target.value }))}
                                        className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <option value="">-- Select PRTI Member --</option>
                                        {prtis.map(p => <option key={p.id} value={p.id}>{p.name || p.email}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Interview Date</label>
                                    <input type="date" value={formData.interviewDate}
                                        onChange={e => setFormData(f => ({ ...f, interviewDate: e.target.value }))}
                                        className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Meeting Link</label>
                                    <input type="url" placeholder="https://meet.google.com/..." value={formData.meetLink}
                                        onChange={e => setFormData(f => ({ ...f, meetLink: e.target.value }))}
                                        className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                            </>
                        )}

                        <button type="submit" disabled={saving}
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// ── Committee card ────────────────────────────────────────────────────────────
const CommitteeCard = ({ internshipId, groupId, psId, psNumber, psTitle, psMentor: initialPsMentor,
                         internshipTitle, deptLabel, department, isGroup }) => {
    const [committee, setCommittee]   = useState(null);
    const [psMentor, setPsMentor]     = useState(initialPsMentor || null);
    const [loading, setLoading]       = useState(!isGroup); // GROUP cards use PS mentor, no committee fetch needed
    const [showModal, setShowModal]   = useState(false);

    const committeeUrl = groupId
        ? `/admin/internships/${internshipId}/committee?departmentGroupId=${groupId}`
        : `/admin/internships/${internshipId}/committee`;

    const evalUrl = groupId
        ? `/internships/${internshipId}/applications?departmentGroupId=${groupId}`
        : `/internships/${internshipId}/applications`;

    useEffect(() => {
        if (isGroup) {
            // GROUP: mentor is per-PS, already loaded
            setLoading(false);
            return;
        }
        api.get(committeeUrl)
            .then(res => setCommittee(res.data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [committeeUrl, isGroup]);

    // For GROUP internships, mentor comes from PS; for SINGLE from committee
    const mentorSet  = isGroup
        ? !!psMentor?.id
        : !!(committee?.membersData?.mentorId);
    const prtiSet    = !!(committee?.membersData?.prtiMemberId);
    const isComplete = isGroup ? mentorSet : (mentorSet && prtiSet);
    const mentorName = isGroup
        ? (psMentor?.name || psMentor?.email || '—')
        : (committee?.membersData?.mentorName || '—');

    return (
        <>
            <div className="admin-card !p-0 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest">
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined">{isGroup ? 'hub' : 'corporate_fare'}</span>
                        </div>
                        {loading ? (
                            <Loader2 size={14} className="animate-spin text-outline/30" />
                        ) : isComplete ? (
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-[8px] font-bold rounded uppercase tracking-wider border border-emerald-500/20">
                                Established
                            </span>
                        ) : (
                            <span className="px-2 py-1 bg-amber-500/10 text-amber-600 text-[8px] font-bold rounded uppercase tracking-wider border border-amber-500/20">
                                Pending Members
                            </span>
                        )}
                    </div>
                    <h3 className="text-sm font-bold text-primary leading-tight">{internshipTitle}</h3>
                    <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-1 truncate" title={deptLabel}>{deptLabel}</p>
                    {isGroup && (
                        <span className="mt-1.5 inline-block text-[9px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                            PS-{psNumber} · GROUP
                        </span>
                    )}
                </div>

                {/* Members */}
                <div className="p-6 space-y-3 flex-1">
                    <MemberRow
                        label={isGroup ? `Mentor (PS-${psNumber})` : 'Assigned Mentor'}
                        name={mentorName}
                        icon="person"
                        active={mentorSet}
                    />
                    {!isGroup && (
                        <MemberRow
                            label="PRTI Member"
                            name={committee?.membersData?.prtiMemberName || '—'}
                            icon="shield"
                            active={prtiSet}
                        />
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-container-high text-primary text-[10px] font-bold rounded-lg hover:bg-surface-variant transition-colors"
                        >
                            <Edit size={13} /> Manage
                        </button>
                        <Link
                            to={evalUrl}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">rate_review</span> Evaluate
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-surface-container-high/30 border-t border-outline-variant/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-sm">event</span>
                        <span className="text-[10px] font-bold text-outline">
                            {committee?.interviewDate
                                ? new Date(committee.interviewDate).toLocaleDateString('en-IN')
                                : 'No interview set'}
                        </span>
                    </div>
                    {committee?.meetLink && (
                        <a
                            href={committee.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                            Join <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                    )}
                </div>
            </div>

            {showModal && (
                <CommitteeModal
                    internshipId={internshipId}
                    groupId={groupId}
                    psId={psId}
                    isGroup={isGroup}
                    psMentor={psMentor}
                    internshipTitle={internshipTitle}
                    deptLabel={deptLabel}
                    department={department}
                    onClose={() => {
                        setShowModal(false);
                        if (isGroup) {
                            // Refresh PS mentor from API
                            api.get(`/admin/hod/ps-applications`).then(res => {
                                const allGroups = res.data.data || [];
                                const updatedPs = allGroups.flatMap(g => g.problemStatements).find(p => p.id === psId);
                                if (updatedPs?.mentor) setPsMentor(updatedPs.mentor);
                            }).catch(() => {});
                        } else {
                            setLoading(true);
                            api.get(committeeUrl).then(r => setCommittee(r.data.data)).finally(() => setLoading(false));
                        }
                    }}
                />
            )}
        </>
    );
};

const MemberRow = ({ label, name, icon, active }) => (
    <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-outline/30'}`}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
        <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-outline">{label}</p>
            <p className={`text-[11px] font-bold ${active ? 'text-primary' : 'text-outline/40 italic'}`}>{name}</p>
        </div>
    </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────
const HodCommittees = () => {
    const [cards, setCards]     = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // SINGLE internships
            const singleRes = await api.get('/admin/internships');
            const singleCards = (singleRes.data.data || [])
                .filter(i => i.isActive && i.internshipMode !== 'GROUP')
                .map(i => ({
                    key:             i.id,
                    internshipId:    i.id,
                    groupId:         null,
                    internshipTitle: i.title,
                    deptLabel:       i.department,
                    department:      i.department,
                    isGroup:         false
                }));

            // GROUP: one card per PROBLEM STATEMENT (not per dept group)
            const groupRes = await api.get('/admin/hod/ps-applications');
            const psCards = (groupRes.data.data || []).flatMap(g =>
                g.problemStatements.map(ps => ({
                    key:             `ps-${ps.id}`,
                    internshipId:    g.internshipId,
                    groupId:         g.id,
                    psId:            ps.id,
                    psNumber:        ps.problemStatementNumber,
                    psTitle:         ps.title,
                    psMentor:        ps.mentor,
                    internshipTitle: g.internship?.title || 'Unknown',
                    deptLabel:       `PS-${ps.problemStatementNumber}: ${ps.title}`,
                    department:      g.department,
                    isGroup:         true
                }))
            );

            setCards([...singleCards, ...psCards]);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Committee Oversight</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Institutional Selection Boards</h2>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map(c => (
                    <CommitteeCard key={c.key} {...c} />
                ))}
                {cards.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-surface-container-low rounded-xl border border-outline-variant/10">
                        <Users size={48} className="mx-auto text-outline/20 mb-4" />
                        <p className="text-outline font-bold text-xs uppercase tracking-widest">No active committees found</p>
                        <p className="text-outline/50 text-xs mt-1 font-medium">
                            Committees are created when PRTI adds your department to an internship.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HodCommittees;
