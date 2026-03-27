import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    Users, Shield, UserCheck, Search, 
    ArrowRight, ChevronRight, Filter, AlertCircle,
    CheckCircle2
} from 'lucide-react';

const PrtiPermissions = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState(null);

    const roles = ['HOD', 'COMMITTEE_MEMBER', 'MENTOR', 'CE_PRTI', 'ADMIN'];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch all staff (non-STUDENT roles)
            const res = await api.get('/admin/users');
            setUsers(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        setUpdating(userId);
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            // Refresh local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error('Role update failed', err);
            alert(err.response?.data?.message || 'Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-1 block">Security & Access Control</span>
                    <h2 className="text-4xl font-extrabold text-primary tracking-tight">Role Permissions</h2>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find administrative staff..."
                            className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-80 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-surface-container-low/50">
                            <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest">Name & Context</th>
                            <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest">Department</th>
                            <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest">Access Protocol</th>
                            <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-primary/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-sm group-hover:scale-110 transition-transform">
                                            {user.name?.[0] || <Users size={18} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-primary group-hover:underline underline-offset-4 cursor-pointer">{user.name}</div>
                                            <div className="text-[10px] text-outline font-bold mt-0.5">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[10px] font-black text-outline uppercase tracking-widest bg-surface-container-high px-3 py-1 rounded-full">{user.department || 'GENERAL'}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <Shield size={14} className={user.role === 'ADMIN' ? 'text-amber-500' : 'text-indigo-500'} />
                                        <div className="relative group/select">
                                            <select 
                                                className={`appearance-none bg-transparent text-[11px] font-bold uppercase tracking-widest pr-8 focus:outline-none cursor-pointer ${user.role === 'ADMIN' ? 'text-amber-600' : 'text-indigo-600'}`}
                                                value={user.role}
                                                onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                                disabled={updating === user.id}
                                            >
                                                {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                            </select>
                                            <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-outline pointer-events-none group-hover/select:translate-x-1 transition-transform" size={12} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 rounded-xl text-outline hover:bg-surface-container-high hover:text-primary transition-all shadow-md active:scale-95 group/btn">
                                        {updating === user.id ? (
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <UserCheck size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                    <div className="py-24 text-center">
                        <Users size={56} className="mx-auto text-outline/20 mb-6" />
                        <p className="text-outline font-black text-sm uppercase tracking-[0.4em] italic mb-2">Protocol Failure</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-40">No staff members found matching your search parameters</p>
                    </div>
                )}
            </div>

            <footer className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-row items-center gap-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                    <Shield className="text-white" size={24} />
                </div>
                <div>
                    <h5 className="text-xs font-black text-primary uppercase tracking-widest mb-1">Hierarchy Synchronization</h5>
                    <p className="text-[10px] text-outline font-bold leading-relaxed max-w-2xl uppercase tracking-tighter opacity-60 italic">
                        All role modifications are logged in the master audit logs. Higher-level administrative access permits modification of PRTI staff and Department Heads. System credentials must be verified before changes propagate.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PrtiPermissions;
