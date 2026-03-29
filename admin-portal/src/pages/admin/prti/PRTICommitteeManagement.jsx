import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { Users, UserCheck, Edit2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import Select from '../../../components/ui/Select';

const PRTICommitteeManagement = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [internships, setInternships] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [selectedPRTIMember, setSelectedPRTIMember] = useState({});
    const [assignedCommittees, setAssignedCommittees] = useState({});

    const fetchInternships = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/internships');
            const internshipsWithCommittees = res.data.data || [];
            setInternships(internshipsWithCommittees);

            // Fetch committee details for each internship
            const assignedMap = {};
            await Promise.all(
                internshipsWithCommittees.map(async (internship) => {
                    try {
                        const committeeRes = await api.get(`/prti/committees/${internship.id}`);
                        const committeeData = committeeRes.data.data;
                        if (committeeData?.prtiMemberId) {
                            setSelectedPRTIMember(prev => ({
                                ...prev,
                                [internship.id]: committeeData.prtiMemberId
                            }));
                            // Track if current user is assigned to this committee
                            assignedMap[internship.id] = committeeData.prtiMemberId === user.id;
                        }
                    } catch (err) {
                        // Committee may not exist yet
                        assignedMap[internship.id] = false;
                    }
                })
            );
            setAssignedCommittees(assignedMap);
        } catch (err) {
            console.error('Failed to fetch internships', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableMembers = async () => {
        try {
            const res = await api.get('/prti/committees/members/available');
            setAvailableMembers(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch available members', err);
        }
    };

    useEffect(() => {
        fetchInternships();
        fetchAvailableMembers();
    }, []);

    const handleUpdatePRTIMember = async (internshipId) => {
        const prtiMemberId = selectedPRTIMember[internshipId];
        if (!prtiMemberId) {
            alert('Please select a PRTI representative');
            return;
        }

        setSaving(true);
        try {
            await api.put(`/prti/committees/${internshipId}/member`, { prtiMemberId });
            alert('PRTI representative updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update PRTI representative');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-outline">Loading Committees...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <section className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-outline uppercase mb-2 block">PRTI Administration</span>
                    <h2 className="text-5xl font-black text-primary tracking-tighter leading-none">
                        Committee <span className="text-outline-variant font-light">Management</span>
                    </h2>
                </div>
            </section>

            {/* Info Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <AlertCircle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-800 mb-1">Committee Structure</h3>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="p-3 bg-white rounded-lg border border-amber-100">
                                <p className="text-[9px] font-bold text-amber-700 uppercase">Member 1</p>
                                <p className="text-sm font-black text-amber-900">HOD (Permanent)</p>
                                <p className="text-[8px] text-amber-600 mt-1">Auto-assigned by department</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-amber-100">
                                <p className="text-[9px] font-bold text-amber-700 uppercase">Member 2</p>
                                <p className="text-sm font-black text-amber-900">Mentor (Assigned)</p>
                                <p className="text-[8px] text-amber-600 mt-1">Assigned by HOD</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-amber-100">
                                <p className="text-[9px] font-bold text-amber-700 uppercase">Member 3</p>
                                <p className="text-sm font-black text-amber-900">PRTI Representative</p>
                                <p className="text-[8px] text-amber-600 mt-1">Editable by PRTI member</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Committee List */}
            <div className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-xl shadow-primary/5 overflow-hidden">
                <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between">
                    <h3 className="text-xl font-black text-primary flex items-center gap-3">
                        <Users size={24} /> Internship Committees ({internships.length})
                    </h3>
                </div>

                <div className="divide-y divide-outline-variant/10">
                    {internships.map((internship) => (
                        <div key={internship.id} className="p-6 hover:bg-surface-container-low/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-primary">{internship.title}</h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] font-bold text-outline uppercase tracking-widest bg-surface-container-high px-3 py-1 rounded-full">
                                            {internship.department}
                                        </span>
                                        <span className="text-[10px] font-bold text-outline uppercase tracking-widest">
                                            {internship.applicationsCount || 0} Applications
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Committee Members Display */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-outline uppercase">HOD</p>
                                            <p className="text-xs font-black text-primary">Auto-assigned</p>
                                        </div>
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <CheckCircle size={18} className="text-emerald-600" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-outline uppercase">Mentor</p>
                                            <p className="text-xs font-black text-primary">HOD Assigned</p>
                                        </div>
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <UserCheck size={18} className="text-blue-600" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-outline uppercase">PRTI Rep</p>
                                            <div className="w-48">
                                                <Select
                                                    value={selectedPRTIMember[internship.id] || ''}
                                                    onChange={(value) => setSelectedPRTIMember(prev => ({ ...prev, [internship.id]: value }))}
                                                    options={[
                                                        { value: '', label: 'Select Member...' },
                                                        ...availableMembers.map(m => ({ value: m.id, label: m.name || m.email }))
                                                    ]}
                                                    size="sm"
                                                    disabled={!assignedCommittees[internship.id] && user.role !== 'ADMIN'}
                                                />
                                            </div>
                                            {!assignedCommittees[internship.id] && user.role !== 'ADMIN' && (
                                                <p className="text-[8px] text-error font-bold mt-1">
                                                    <AlertCircle size={8} className="inline" /> Not assigned to you
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleUpdatePRTIMember(internship.id)}
                                            disabled={saving || !selectedPRTIMember[internship.id] || (!assignedCommittees[internship.id] && user.role !== 'ADMIN')}
                                            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            title={!assignedCommittees[internship.id] && user.role !== 'ADMIN' ? 'Only assigned PRTI representative can edit' : ''}
                                        >
                                            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {internships.length === 0 && (
                    <div className="py-32 text-center">
                        <Users size={48} className="mx-auto text-outline/20 mb-4" />
                        <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-2">No internships found</h3>
                        <p className="text-outline/60 text-sm font-bold uppercase tracking-[0.2em]">Create an internship to manage its committee</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PRTICommitteeManagement;
