import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Zap } from 'lucide-react';

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                
                {/* Left Side: Branding */}
                <div className="md:w-1/2 bg-indigo-900 p-10 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="relative z-10 flex items-center gap-4 mb-12">
                        <img src="/logo.png" alt="Logo" className="w-12 h-12 bg-white rounded-full p-1 shadow-lg" />
                        <div>
                            <h2 className="font-rajdhani font-bold text-2xl tracking-wide">APTRANSCO</h2>
                            <p className="text-xs font-bold tracking-widest text-amber-400 uppercase">Student Portal</p>
                        </div>
                    </div>

                    <div className="relative z-10 mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                            <Zap className="text-amber-400 w-6 h-6" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black font-rajdhani leading-tight mb-4">
                            Power Your <br /> Future Here.
                        </h1>
                        <p className="text-indigo-200 text-sm lg:text-base md:max-w-md font-medium">
                            Log in to track your internship journey with the Transmission Corporation of Andhra Pradesh Limited.
                        </p>
                    </div>

                    <div className="relative z-10 hidden md:block">
                        <p className="text-xs text-indigo-300 font-semibold tracking-wider">SECURE GOVT. OF AP PORTAL</p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-1/2 p-10 lg:p-14 flex flex-col justify-center bg-white relative">
                    <div className="max-w-sm w-full mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-gray-900 font-rajdhani flex items-center gap-2">
                                Welcome Back <span className="text-2xl">👋</span>
                            </h2>
                            <p className="text-gray-500 text-sm mt-1 font-medium">Please enter your credentials to continue.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 shadow-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="student@aptransco.in"
                                        className="input-field pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LogIn className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="input-field pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {loading && <div className="animate-spin w-4 h-4 border-2 border-white/60 border-t-white rounded-full"></div>}
                                {loading ? 'Authenticating...' : 'Secure Login'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center justify-center gap-3">
                            <p className="text-sm text-gray-500 font-medium">
                                Don't have an APTRANSCO training account?
                            </p>
                            <Link to="/register" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wide">
                                Create new account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Assuming AlertCircle wasn't imported initially, let's fix it by adding it directly
import { AlertCircle } from 'lucide-react';

export default Login;
