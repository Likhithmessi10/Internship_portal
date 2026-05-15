import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
    Briefcase, Users, CheckCircle, ChevronRight, Star, Activity, AlertCircle, Clock, UserPlus, Trash2, Lock, MapPin, BookOpen, Phone, Mail
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import StatsDetailModal from '../../../components/ui/StatsDetailModal';
import CreateMentorModal from './CreateMentorModal';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <div className={`glass-card bg-white/50 dark:bg-indigo-950/40 border-l-4 ${color} dark:border-white/5 premium-shadow rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300 group`}>
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 group-hover:scale-110 transition-transform shadow-sm">
                {React.createElement(Icon, { size: 24, className: "text-indigo-600 dark:text-indigo-400" })}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-indigo-400/60">{label}</span>
            </div>
        </div>
        <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 leading-none">{value}</p>
        {subtext && <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">{subtext}</p>}
    </div>
);

const HodDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const dept = user?.department?.toUpperCase().trim() || '';
    const [internships, setInternships] = useState([]);
    const [hiredInterns, setHiredInterns] = useState([]);
    const [applications, setApplications] = useState([]);
    const [pendingSubmissions, setPendingSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStat, setSelectedStat] = useState(null);
    const [showCreateMentor, setShowCreateMentor] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [deleteMentorTarget, setDeleteMentorTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchMentors = useCallback(async () => {
        try {
            const res = await api.get('/admin/users?role=MENTOR');
            setMentors(res.data.data || []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Get all internships first
                const intRes = await api.get('/admin/internships');

                // Filter internships belonging to HOD department
                const allInts = intRes.data.data || [];

                // Include GROUP internships where HOD's dept is one of the department groups
                const filteredInts = user?.role === 'ADMIN'
                    ? allInts
                    : allInts.filter(i =>
                        i.department?.toUpperCase().trim() === dept ||
                        (i.internshipMode === 'GROUP' && i.departmentGroups?.some(g => g.department?.toUpperCase().trim() === dept))
                    );

                const liveInts = filteredInts.filter(i => i.isActive && (!i.applicationDeadline || new Date(i.applicationDeadline) >= new Date()));

                // Fetch applications for each internship in the department
                const appsPromises = liveInts.map(internship =>
                    api.get(`/admin/internships/${internship.id}/applications`)
                );
                const appsResults = await Promise.allSettled(appsPromises);
                const allApps = appsResults
                    .filter(result => result.status === 'fulfilled')
                    .flatMap(result => result.value.data.data || []);

                // Fetch all interns and filter (HODs can only see their department's interns)
                try {
                    const internsRes = await api.get('/admin/interns/all');
                    const allInterns = internsRes.data.data || [];
                    const filteredInterns = allInterns.filter(i =>
                        i.internship?.department?.toUpperCase().trim() === dept
                    );
                    setHiredInterns(filteredInterns);
                } catch (err) {
                    // HODs might not have permission to fetch all interns, that's OK
                    setHiredInterns([]);
                }

                setInternships(liveInts);
                setApplications(allApps);

                // Fetch pending GROUP internship problem-statement requests
                try {
                    const psRes = await api.get('/admin/hod/pending-group-submissions');
                    setPendingSubmissions(psRes.data.data || []);
                } catch {
                    // non-fatal — HOD may have no pending items
                }
            } catch (err) {
                console.error('Failed to fetch HOD dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        fetchMentors();
    }, [user, fetchMentors]);


    const handleDeleteConfirm = async () => {
        if (!deletePassword) { setDeleteError('Enter your password to confirm.'); return; }
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await api.delete(`/admin/internships/${deleteTarget.id}`, { data: { password: deletePassword } });
            setInternships(prev => prev.filter(i => i.id !== deleteTarget.id));
            setDeleteTarget(null);
            setDeletePassword('');
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Deletion failed.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const totalApplications = internships.reduce((s, i) => s + (i.applicationsCount || 0), 0);
    const totalAllocated = internships.reduce((s, i) => {
        const rolesTotal = i.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0;
        return s + (i.openingsCount || rolesTotal);
    }, 0);
    const totalHired = internships.reduce((s, i) => s + (i.hiredCount || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            {/* Stitch-style Header Section */}
            <section className="flex justify-between items-end mb-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.1em] text-outline uppercase mb-1 block">Departmental Oversight</span>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">{user?.department} Dashboard</h2>
                </div>
                <div className="flex gap-4 items-center text-right">
                    <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Academic Year</p>
                        <p className="text-sm font-bold text-primary">{new Date().getFullYear() - 1} - {new Date().getFullYear()}</p>
                    </div>
                </div>
            </section>

            {/* Pending problem-statement submissions banner */}
            {pendingSubmissions.length > 0 && (
                <section className="animate-in fade-in duration-300">
                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <Clock size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-amber-800">
                                    {pendingSubmissions.length} pending problem statement{pendingSubmissions.length > 1 ? 's' : ''} required
                                </p>
                                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                                    PRTI has requested your department's problem statements for:{' '}
                                    {pendingSubmissions.map(g => g.internship?.title).join(', ')}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/hod/problem-statements"
                            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors shadow-sm"
                        >
                            Submit Now <ChevronRight size={14} />
                        </Link>
                    </div>
                </section>
            )}

            {/* Stats */}
            {/* Bento Grid Stats */}
            <section className="grid grid-cols-12 gap-6">
                <button
                    onClick={() => setSelectedStat({ title: 'Active Programs', type: 'PROGRAMS', data: internships })}
                    className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all text-left group"
                >
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Active Programs</span>
                    <div className="text-4xl font-extrabold text-primary mt-2 group-hover:scale-110 transition-transform origin-left">{internships.length}</div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded w-fit uppercase">
                        <Activity size={12} /> Live Status
                    </div>
                </button>

                <button
                    onClick={() => setSelectedStat({ title: 'Application Pool', type: 'APPLICATIONS', data: applications })}
                    className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all text-left group"
                >
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Pool Size</span>
                    <div className="text-4xl font-extrabold text-primary mt-2 group-hover:scale-110 transition-transform origin-left">{totalApplications}</div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-outline uppercase">
                        <Users size={12} /> Cumulative Applicants
                    </div>
                </button>

                <button
                    onClick={() => setSelectedStat({ title: 'Hired Interns', type: 'INTERNS', data: hiredInterns })}
                    className="col-span-12 lg:col-span-4 bg-primary-container p-6 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                >
                    <span className="text-[10px] font-bold text-on-primary-container uppercase tracking-widest opacity-80">Hiring Quota</span>
                    <div className="flex items-end justify-between mt-2 text-white group-hover:translate-x-1 transition-transform">
                        <div className="text-4xl font-extrabold">{totalHired}</div>
                        <div className="text-xl font-medium opacity-50 mb-1">/ {totalAllocated}</div>
                    </div>
                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-white h-full transition-all duration-1000" style={{ width: `${totalAllocated > 0 ? (totalHired / totalAllocated) * 100 : 0}%` }}></div>
                    </div>
                </button>
            </section>

            {/* Internship Table */}
            {/* Internship Table - Stitch Style */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Departmental Programs</h3>
                        <p className="text-[10px] text-outline font-medium mt-0.5">Recruitment overview for {user?.department}</p>
                    </div>
                    <div className="flex gap-2 text-outline">
                        <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">filter_list</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-high/30">
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">Program</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Applications</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Quota Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {internships.map(int => {
                                // For GROUP internships, scope counts to HOD's dept group only
                                const myGroup = int.internshipMode === 'GROUP'
                                    ? int.departmentGroups?.find(g => g.department?.toUpperCase().trim() === dept)
                                    : null;
                                const effectiveOpenings = myGroup
                                    ? (myGroup.openings || myGroup.fields?.reduce((s, f) => s + (f.vacancies || 0), 0) || 0)
                                    : (int.openingsCount || (int.rolesData?.reduce((acc, r) => acc + (parseInt(r.openings) || 0), 0) || 0));
                                const displayApps = myGroup ? (myGroup.applicationsCount ?? int.applicationsCount) : int.applicationsCount;
                                const isFilled = int.hiredCount >= effectiveOpenings && effectiveOpenings > 0;
                                return (
                                    <tr key={int.id} className="hover:bg-surface-container-high/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-primary">{int.title}</p>
                                                    <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-0.5">{int.location}</p>
                                                    {int.batch && (
                                                        <p className="text-[9px] text-primary/60 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[10px]">folder</span> {int.batch.title}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-sm font-bold text-primary">{displayApps}</span>
                                                <span className="text-[9px] text-outline font-bold uppercase tracking-tighter">Pool Size</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold text-primary">{int.hiredCount}</span>
                                                    <span className="text-[10px] text-outline">/ {effectiveOpenings}</span>
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-tighter ${isFilled ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {isFilled ? 'FULFILLED' : 'OPEN'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/hod/applications`}
                                                    className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
                                                >
                                                    Review Pool <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                </Link>
                                                <button
                                                    onClick={() => { setDeleteTarget({ id: int.id, title: int.title }); setDeletePassword(''); setDeleteError(''); }}
                                                    className="p-2 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Delete internship"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedStat && (
                <StatsDetailModal
                    title={selectedStat.title}
                    type={selectedStat.type}
                    data={selectedStat.data}
                    onClose={() => setSelectedStat(null)}
                />
            )}

            {/* Mentors section */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Department Mentors</h3>
                        <p className="text-[10px] text-outline font-medium mt-0.5">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''} registered under {user?.department}</p>
                    </div>
                    <button onClick={() => setShowCreateMentor(true)}
                        className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/50 dark:text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
                        <UserPlus size={14} /> Add Mentor
                    </button>
                </div>
                {mentors.length === 0 ? (
                    <div className="py-12 text-center">
                        <Users size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No mentors yet</p>
                        <p className="text-xs text-slate-400 mt-1">Create a mentor account to get started</p>
                    </div>
                ) : (
                    <div className="divide-y divide-outline-variant/5">
                        {mentors.map(m => (
                            <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-high/40 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-black text-emerald-700 dark:text-emerald-400 text-sm shrink-0">
                                        {m.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary">{m.name}</p>
                                        <p className="text-[10px] text-outline font-medium">{m.designation || 'Mentor'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 flex-wrap">
                                    {m.mentorField && (
                                        <span className="flex items-center gap-1"><BookOpen size={11} className="text-indigo-400" />{m.mentorField}</span>
                                    )}
                                    {m.mentorLocation && (
                                        <span className="flex items-center gap-1"><MapPin size={11} className="text-rose-400" />{m.mentorLocation}</span>
                                    )}
                                    <span className="flex items-center gap-1"><Mail size={11} className="text-slate-400" />{m.email}</span>
                                    {m.phone && <span className="flex items-center gap-1"><Phone size={11} className="text-slate-400" />{m.phone}</span>}
                                </div>
                                <button onClick={() => setDeleteMentorTarget(m)}
                                    className="p-2 rounded-lg border border-red-200 dark:border-red-800 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors shrink-0"
                                    title="Remove mentor">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreateMentor && (
                <CreateMentorModal onClose={(success) => {
                    setShowCreateMentor(false);
                    if (success) { fetchMentors(); alert('Mentor credentials created successfully!'); }
                }} />
            )}

            {/* Delete mentor confirmation */}
            {deleteMentorTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
                        <div className="px-6 py-5 border-b border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 flex items-center gap-3">
                            <Trash2 size={18} className="text-red-500 shrink-0" />
                            <div>
                                <p className="text-sm font-black text-red-700 dark:text-red-400">Remove Mentor</p>
                                <p className="text-[11px] text-red-500 font-medium">{deleteMentorTarget.name}</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">This will permanently delete the mentor account. Any applications they are assigned to will retain the record but lose the mentor link.</p>
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={async () => {
                                        try {
                                            await api.delete(`/admin/users/${deleteMentorTarget.id}`);
                                            setDeleteMentorTarget(null);
                                            fetchMentors();
                                        } catch (err) {
                                            alert(err.response?.data?.message || 'Failed to delete mentor');
                                        }
                                    }}
                                    className="flex-1 py-2.5 bg-red-600 text-white text-xs font-black uppercase rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Remove
                                </button>
                                <button onClick={() => setDeleteMentorTarget(null)}
                                    className="px-4 py-2.5 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
                        <div className="px-6 py-5 border-b border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 flex items-center gap-3">
                            <Trash2 size={18} className="text-red-500 shrink-0" />
                            <div>
                                <p className="text-sm font-black text-red-700 dark:text-red-400">Delete Internship</p>
                                <p className="text-[11px] text-red-500 dark:text-red-500 font-medium truncate max-w-[260px]">{deleteTarget.title}</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                This will permanently delete the internship and all its data. Enter your password to confirm.
                            </p>
                            {deleteError && (
                                <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
                                    {deleteError}
                                </p>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-400 flex items-center gap-1.5">
                                    <Lock size={10} /> Your Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleDeleteConfirm()}
                                    autoFocus
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-800"
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading || !deletePassword}
                                    className="flex-1 py-2.5 bg-red-600 text-white text-xs font-black uppercase rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors"
                                >
                                    {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
                                </button>
                                <button
                                    onClick={() => { setDeleteTarget(null); setDeletePassword(''); setDeleteError(''); }}
                                    className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HodDashboard;
