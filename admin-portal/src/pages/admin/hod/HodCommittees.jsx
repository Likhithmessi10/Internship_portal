import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { 
    Users, Shield, Briefcase, ChevronRight, 
    Video, Calendar, Info, CheckCircle, Clock, Edit
} from 'lucide-react';

const HodCommittees = () => {
    const { user } = useAuth();
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [showModal, setShowModal] = useState(false);

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

    const handleManage = (internship) => {
        setSelectedInternship(internship);
        setShowModal(true);
    };

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
                    <CommitteeCard key={int.id} internship={int} onManage={() => handleManage(int)} />
                ))}
                {internships.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-surface-container-low rounded-xl border border-outline-variant/10">
                        <Users size={48} className="mx-auto text-outline/20 mb-4" />
                        <p className="text-outline font-bold text-xs uppercase tracking-widest">No active committees found</p>
                    </div>
                )}
            </div>

            {showModal && selectedInternship && (
                <CommitteeModal 
                    internship={selectedInternship} 
                    onClose={() => { setShowModal(false); fetchData(); }} 
                />
            )}
        </div>
    );
};

const CommitteeCard = ({ internship, onManage }) => {
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

    const isComplete = committee?.membersData?.mentorId || committee?.mentor; // Simplified check

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
                <MemberRow label="Assigned Mentor" name={committee?.membersData?.mentorName || 'Pending assignment'} icon="person" active={!!committee?.membersData?.mentorId} />
                <button 
                    onClick={onManage}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Edit size={14} /> MANAGE COMMITTEE
                </button>
            </div>

            <div className="px-6 py-4 bg-surface-container-high/30 border-t border-outline-variant/10 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-sm">event</span>
                    <span className="text-[10px] font-bold text-outline">{committee?.interviewDate ? new Date(committee.interviewDate).toLocaleDateString() : 'No interview set'}</span>
                 </div>
                 {committee?.meetLink && (
                    <a href={committee.meetLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                        Join Meeting <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                 )}
            </div>
        </div>
    );
};

const CommitteeModal = ({ internship, onClose }) => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        interviewDate: '',
        meetLink: '',
        mentorId: ''
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [mentorsRes, committeeRes] = await Promise.all([
                    api.get(`/admin/users?role=MENTOR&department=${encodeURIComponent(internship.department)}`),
                    api.get(`/admin/internships/${internship.id}/committee`)
                ]);
                setMentors(mentorsRes.data.data);
                if (committeeRes.data.data) {
                    const c = committeeRes.data.data;
                    setFormData({
                        interviewDate: c.interviewDate ? new Date(c.interviewDate).toISOString().split('T')[0] : '',
                        meetLink: c.meetLink || '',
                        mentorId: c.membersData?.mentorId || ''
                    });
                }
            } catch (err) {
                console.error('Failed to load modal data');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [internship.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const selectedMentor = mentors.find(m => m.id === formData.mentorId);
            await api.put(`/admin/internships/${internship.id}/committee`, {
                interviewDate: formData.interviewDate,
                meetLink: formData.meetLink,
                membersData: {
                    mentorId: formData.mentorId,
                    mentorName: selectedMentor?.name || ''
                }
            });
            onClose();
        } catch (err) {
            console.error('Failed to update committee');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-primary text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <Users size={20} /> Manage Committee
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Assigned Mentor</label>
                        <select 
                            required
                            value={formData.mentorId}
                            onChange={(e) => setFormData({...formData, mentorId: e.target.value})}
                            className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Select a Mentor</option>
                            {mentors.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Interview Date</label>
                        <input 
                            type="date"
                            value={formData.interviewDate}
                            onChange={(e) => setFormData({...formData, interviewDate: e.target.value})}
                            className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Meeting Link</label>
                        <input 
                            type="url"
                            placeholder="https://teams.microsoft.com/..."
                            value={formData.meetLink}
                            onChange={(e) => setFormData({...formData, meetLink: e.target.value})}
                            className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <button 
                        disabled={saving}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? 'SAVING...' : 'SAVE COMMITTEE DETAILS'}
                    </button>
                </form>
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
