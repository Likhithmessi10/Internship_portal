import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

const AdminLogin = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetRole = searchParams.get('role');

    const roleNames = { 'ADMIN': 'Super Admin', 'CE_PRTI': 'PRTI', 'HOD': 'HOD', 'MENTOR': 'Mentor' };
    const roleDisplay = targetRole ? roleNames[targetRole] : 'Admin';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const APTRANSCO_ROLES = ['ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'];

    useEffect(() => {
        if (user && APTRANSCO_ROLES.includes(user.role)) {
            if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
            else if (user.role === 'CE_PRTI') navigate('/prti/dashboard', { replace: true });
            else if (user.role === 'HOD') navigate('/hod/dashboard', { replace: true });
            else if (user.role === 'MENTOR') navigate('/mentor/dashboard', { replace: true });
            else navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const u = await login(email, password);
            if (!APTRANSCO_ROLES.includes(u.role)) {
                setError('Access denied. Authorized credentials required.');
                return;
            }
            if (u.role === 'ADMIN') navigate('/admin/dashboard');
            else if (u.role === 'CE_PRTI') navigate('/prti/dashboard');
            else if (u.role === 'HOD') navigate('/hod/dashboard');
            else if (u.role === 'MENTOR') navigate('/mentor/dashboard');
            else navigate('/dashboard');
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
                {/* Card */}
                <div className="glass-card bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[2.5rem] pt-16 px-10 pb-10 shadow-2xl relative mt-14">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5">
                        <img src="/logo.png" alt="APTRANSCO" className="h-16 w-16 object-contain" />
                    </div>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-gray-900 dark:text-white font-extrabold text-2xl tracking-tight mb-1">APTRANSCO</h1>
                        <p className="text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mb-3">Administrator Portal</p>
                        <h2 className="text-gray-900 dark:text-white font-black text-xl tracking-tighter uppercase font-rajdhani">{roleDisplay} <span className="text-indigo-600 dark:text-indigo-400">Login</span></h2>
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
                <div className="text-center mt-8 space-y-2 text-xs font-medium text-gray-400">
                    <p>New staff member? <Link to="/register" className="text-indigo-500 font-bold hover:underline">Create an account</Link></p>
                    <p>Students must apply via the <a href="/" className="text-indigo-500 hover:underline">public portal</a>.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
