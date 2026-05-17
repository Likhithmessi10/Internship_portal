import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Home, Sun, Moon, Eye, EyeOff } from 'lucide-react';

const AdminLogin = ({ forcedRole }) => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [searchParams] = useSearchParams();
    const targetRole = forcedRole || searchParams.get('role');

    const roleNames = { 'ADMIN': 'Super Admin', 'CE_PRTI': 'PRTI', 'HOD': 'HOD', 'MENTOR': 'Mentor' };
    const roleDisplay = targetRole ? roleNames[targetRole] : 'Admin';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 sm:p-12 font-inter relative">
            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-5 right-5 p-2 px-3 rounded-full bg-surface-container-low border border-outline-variant/20 text-outline hover:text-primary transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
                {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
                {isDarkMode ? 'Light' : 'Dark'}
            </button>

            <div className="w-full max-w-[480px]">
                <div className="text-center mb-12">
                    <div className="text-primary font-bold text-xs uppercase tracking-[0.3em] mb-4">Institutional Portal</div>
                    <h1 className="text-4xl font-extrabold text-primary tracking-tighter uppercase mb-2">APTRANSCO</h1>
                    <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
                </div>

                <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-10 shadow-sm relative">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-primary tracking-tight">{roleDisplay} Access</h2>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider mt-1">Authorized Management Login</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-lg text-[10px] font-bold uppercase tracking-widest border border-error/10 text-center">
                            Error: {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2.5">
                                Institutional Email
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="name@aptransco.gov.in"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-surface-container border border-outline-variant/30 text-primary placeholder:text-outline/40 rounded-lg px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2.5">
                                Security Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-surface-container border border-outline-variant/30 text-primary placeholder:text-outline/40 rounded-lg px-4 py-3 pr-10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary transition-colors">
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-on-primary font-bold py-4 rounded-lg transition-all hover:opacity-95 shadow-md active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] mt-6"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Validating…</>
                            ) : (
                                'Enter Dashboard'
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center font-bold">
                        <p className="text-[10px] text-outline uppercase tracking-widest mb-2">Role assigned by PRTI Admin</p>
                        <Link to="/" className="text-[10px] text-primary uppercase tracking-widest underline hover:no-underline flex items-center justify-center gap-1">
                            <Home size={12} /> All Roles
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-12 text-[10px] font-bold text-outline uppercase tracking-[0.2em] opacity-50">
                    &copy; {new Date().getFullYear()} Transco Systems
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
