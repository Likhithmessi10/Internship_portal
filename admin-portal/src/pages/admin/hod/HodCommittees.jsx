import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { 
    Users, Shield, Briefcase, ChevronRight, 
    Video, Calendar, Info, CheckCircle, Clock
} from 'lucide-react';

const HodCommittees = () => {
    const { user } = useAuth();
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/internships');
            const data = res?.data?.data || [];
            // HodDashboard filters internships by department, we do the same here if not already handled by backend
            setInternships(data.filter(i => i.isActive));
        } catch (err) {
            console.error('Failed to fetch internships for committees');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
             <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
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
                {internships.map(int => (
                    <CommitteeCard key={int.id} internship={int} />
                ))}
                {internships.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-surface-container-low rounded-xl border border-outline-variant/10">
                        <Users size={48} className="mx-auto text-outline/20 mb-4" />
                        <p className="text-outline font-bold text-xs uppercase tracking-widest">No active committees found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CommitteeCard = ({ internship }) => {
    const [committee, setCommittee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommittee = async () => {
            try {
                const res = await api.get(`/admin/internships/${internship.id}/committee`);
                setCommittee(res.data.data);
            } catch (err) {
                console.error('Failed to fetch committee details');
            } finally {
                setLoading(false);
            }
        };
        fetchCommittee();
    }, [internship.id]);

    const isComplete = committee?.hod && committee?.mentor && committee?.prtiMember;

    return (
        <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col">
            <div className="p-6 border-b border-outline-variant/10 bg-white">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">groups</span>
                    </div>
                    {isComplete ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[8px] font-bold rounded uppercase tracking-wider border border-green-200">Established</span>
                    ) : (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[8px] font-bold rounded uppercase tracking-wider border border-amber-200">Pending Members</span>
                    )}
                </div>
                <h3 className="text-sm font-bold text-primary truncate" title={internship.title}>{internship.title}</h3>
                <p className="text-[10px] text-outline font-medium uppercase tracking-tighter mt-1">Ref ID: {internship.id.slice(-6)}</p>
            </div>

            <div className="p-6 space-y-4 flex-1">
                <MemberRow label="HOD (Dept)" name={committee?.hod?.name || 'Pending assignment'} icon="shield_person" active={!!committee?.hod} />
                <MemberRow label="Assigned Mentor" name={committee?.mentor?.name || 'Pending assignment'} icon="person" active={!!committee?.mentor} />
                <MemberRow label="PRTI Member" name={committee?.prtiMember?.name || 'Pending selection'} icon="verified_user" active={!!committee?.prtiMember} />
            </div>

            <div className="px-6 py-4 bg-surface-container-high/30 border-t border-outline-variant/10 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-sm">event</span>
                    <span className="text-[10px] font-bold text-outline">{committee?.meetingDate ? new Date(committee.meetingDate).toLocaleDateString() : 'No interview set'}</span>
                 </div>
                 {committee?.meetingLink && (
                    <a href={committee.meetingLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                        Join Meeting <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                 )}
            </div>
        </div>
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

export default HodCommittees;
