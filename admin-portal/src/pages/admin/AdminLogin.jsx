import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already logged in as admin, redirect
    useEffect(() => {
        if (user?.role === 'ADMIN') navigate('/dashboard', { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const u = await login(email, password);
            if (u.role !== 'ADMIN') {
                setError('Access denied. Admin credentials required.');
                return;
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Background grid decoration */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="relative w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img src="/logo.png" alt="APTRANSCO Logo" className="h-24 object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-gray-900 dark:text-white font-extrabold text-3xl tracking-tight mb-2">APTRANSCO</h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-widest">Administrator Portal</p>
                </div>

                {/* Card */}
                <div className="glass-card bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5">
                        <img src="/logo.png" alt="APTRANSCO" className="h-16 w-16 object-contain" />
                    </div>
                    
                    <div className="text-center mt-6 mb-8">
                        <h2 className="text-gray-900 dark:text-white font-black text-2xl tracking-tighter uppercase font-rajdhani">Admin <span className="text-indigo-600 dark:text-indigo-400">Login</span></h2>
                        <p className="text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Authorized Access Only</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center justify-center text-center gap-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="admin@aptransco.gov.in"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <><span className="animate-spin w-4 h-4 border-2 border-white/60 border-t-white rounded-full" /> Verifying...</>
                            ) : (
                                'Enter Dashboard'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer note */}
                <p className="text-center text-gray-400 tracking-wide font-medium text-xs mt-8">
                    Students must apply via the <a href="/" className="text-indigo-500 hover:underline">public portal</a>.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
