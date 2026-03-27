import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Zap, Sun, Moon, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/student/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
            {/* Theme Toggle Top Right */}
            <button 
                onClick={toggleTheme} 
                className="absolute top-6 right-6 p-2 px-4 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700 transition-all font-bold text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 z-50"
            >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            <div className="max-w-5xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 dark:border-slate-700 transition-colors duration-200">
                
                {/* Left Side: Branding */}
                <div className="md:w-1/2 bg-[#00266b] dark:bg-[#090e17] p-10 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0044bb] dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4A017] dark:bg-yellow-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="relative z-10 flex items-center gap-4 mb-12">
                        <img src="/logo.png" alt="Logo" className="w-12 h-12 bg-white rounded-full p-1 shadow-lg" />
                        <div>
                            <h2 className="font-rajdhani font-bold text-2xl tracking-wide text-white">APTRANSCO</h2>
                            <p className="text-xs font-bold tracking-widest text-[#D4A017] uppercase">Student Portal</p>
                        </div>
                    </div>

                    <div className="relative z-10 mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                            <Zap className="text-[#D4A017] w-6 h-6" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black font-rajdhani leading-tight mb-4 text-white">
                            Power Your <br /> Future Here.
                        </h1>
                        <p className="text-[#aac4e8] dark:text-slate-400 text-sm lg:text-base md:max-w-md font-medium">
                            Log in to track your internship journey with the Transmission Corporation of Andhra Pradesh Limited.
                        </p>
                    </div>

                    <div className="relative z-10 hidden md:block">
                        <p className="text-xs text-[#aac4e8] dark:text-slate-500 font-semibold tracking-wider">SECURE GOVT. OF AP PORTAL</p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-1/2 p-10 lg:p-14 flex flex-col justify-center bg-white dark:bg-slate-800 relative transition-colors duration-200">
                    <div className="max-w-sm w-full mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-rajdhani flex items-center gap-2">
                                Welcome Back <span className="text-2xl">👋</span>
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 font-medium">Please enter your credentials to continue.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 shadow-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="student@aptransco.in"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#003087] dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LogIn className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-[#003087] dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#D4A017] dark:bg-yellow-500 hover:bg-[#b88c14] dark:hover:bg-yellow-600 text-[#00266b] dark:text-slate-900 font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {loading && <div className="animate-spin w-4 h-4 border-2 border-[#00266b]/60 border-t-transparent rounded-full"></div>}
                                {loading ? 'Authenticating...' : 'Secure Login'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3">
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                                Don't have an APTRANSCO training account?
                            </p>
                            <Link to="/student/register" className="text-sm font-bold text-[#003087] dark:text-blue-400 hover:text-[#00266b] transition-colors uppercase tracking-wide">
                                Create new account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
