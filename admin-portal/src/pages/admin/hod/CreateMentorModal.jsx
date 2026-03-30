import React, { useState } from 'react';
import api from '../../../utils/api';
import { UserPlus, X, Send, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const CreateMentorModal = ({ onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/admin/register', {
                ...formData,
                role: 'MENTOR',
                department: user.department // Guarantee it is bound to HOD's department
            });
            onClose(true); // Signal success
        } catch (err) {
            console.error('Failed to create mentor:', err);
            setError(err.response?.data?.message || 'Failed to create mentor. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <UserPlus size={24} /> Create Mentor
                        </h3>
                        <p className="text-[10px] text-white/80 uppercase font-black mt-1 tracking-widest">
                            {user.department} Department
                        </p>
                    </div>
                    <button onClick={() => onClose(false)} className="hover:bg-white/20 p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-semibold text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" />
                                <input 
                                    required
                                    type="text"
                                    placeholder="e.g., Dr. A. Sharma"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" />
                                <input 
                                    required
                                    type="email"
                                    placeholder="mentor@aptransco.gov.in"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Temporary Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" />
                                <input 
                                    required
                                    type="text" // using text so HOD can easily see and share the initial password securely over other bounds
                                    placeholder="e.g., SecurePass@123"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'CREATING MENTOR...' : (
                            <>
                                <Send size={20} /> GENERATE CREDENTIALS
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateMentorModal;
