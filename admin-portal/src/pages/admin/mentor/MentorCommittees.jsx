import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { Users, Building2, ClipboardList, Calendar, Briefcase, CheckCircle } from 'lucide-react';

const MentorCommittees = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading]         = useState(true);

    useEffect(() => {
        api.get('/admin/meetings/my')
            .then(res => setAssignments(res.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user.id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Committees</h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">Your mentor assignments and problem statements</p>
            </div>

            {assignments.length === 0 ? (
                <div className="admin-card p-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8 flex items-center justify-center mx-auto mb-6">
                        <Building2 size={40} className="text-slate-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No Committee Assignments</h3>
                    <p className="text-slate-500 dark:text-gray-400">You are not assigned to any committees or problem statements yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {assignments.map(item => (
                        item._type === 'PS_ASSIGNMENT'
                            ? <PsAssignmentCard key={item.id} item={item} user={user} />
                            : <CommitteeCard key={item.id} committee={item} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Card for GROUP PS-level mentor assignment ─────────────────────────────────
const PsAssignmentCard = ({ item, user }) => (
    <div className="admin-card">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                    <ClipboardList size={26} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            PS-{item.psNumber}: {item.psTitle}
                        </h3>
                        <span className="inline-block text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">GROUP</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                        {item.internship?.title} · <span className="font-semibold text-slate-700 dark:text-white">{item.department}</span>
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Stat icon={<Briefcase size={15} className="text-slate-400" />} label="Department" value={item.department} />
            <Stat icon={<Users size={15} className="text-indigo-400" />} label="Vacancies" value={`${item.vacancies} seat${item.vacancies !== 1 ? 's' : ''}`} />
            <Stat icon={<CheckCircle size={15} className="text-emerald-500" />} label="Applications" value={`${item.applicationsCount} applied`} />
        </div>

        {/* You as mentor */}
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Your Role — Mentor</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name || user.email}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
        </div>

        <div className="border-t border-slate-100 dark:border-border/50 pt-4 flex justify-end">
            <Link
                to={`/internships/${item.internship?.id}/applications?departmentGroupId=${item.departmentGroup?.id}`}
                className="px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
                <Users size={15} /> View Applications
            </Link>
        </div>
    </div>
);

// ── Card for SINGLE internship committee ──────────────────────────────────────
const CommitteeCard = ({ committee, user }) => (
    <div className="admin-card">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Users size={28} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {committee.internship?.title || 'Committee'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                        Department: {committee.internship?.department || 'N/A'}
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MemberBox label="HOD (Member 1)" name={committee.hodId ? 'HOD' : null} email={null} />
            <MemberBox label="Mentor (Member 2) — You" name={user.name || 'You'} email={user.email} highlight />
            <MemberBox label="PRTI Rep (Member 3)" name={committee.prtiMemberId ? 'PRTI Member' : null} email={null} />
        </div>

        <div className="border-t border-slate-100 dark:border-border/50 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
                {committee.interviewDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                        <Calendar size={15} />
                        <span>{new Date(committee.interviewDate).toLocaleString()}</span>
                    </div>
                )}
                {committee.meetLink && (
                    <a href={committee.meetLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        Join Meeting
                    </a>
                )}
            </div>
            <Link
                to={`/internships/${committee.internship?.id}/applications`}
                className="px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
                <Users size={15} /> Start Evaluation
            </Link>
        </div>
    </div>
);

const Stat = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const MemberBox = ({ label, name, email, highlight }) => (
    <div className={`border rounded-xl p-4 ${highlight
        ? 'border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5'
        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'}`}>
        <p className={`text-xs font-semibold uppercase mb-2 ${highlight ? 'text-indigo-500' : 'text-slate-400 dark:text-gray-400'}`}>{label}</p>
        {name ? (
            <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
                {email && <p className="text-xs text-slate-400 mt-0.5">{email}</p>}
            </div>
        ) : (
            <p className="text-sm text-slate-400 dark:text-gray-500">Not assigned</p>
        )}
    </div>
);

export default MentorCommittees;
