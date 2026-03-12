import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Mail, AlertCircle, Zap } from 'lucide-react';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            await register(email, password, 'STUDENT');
            navigate('/student/profile/edit'); // Redirect to profile setup initially
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse border border-gray-100">
                
                {/* Right Side: Branding (Reversed for variation) */}
                <div className="md:w-1/2 bg-indigo-900 p-10 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10 flex items-center gap-4 mb-12 justify-end">
                        <div className="text-right">
                            <h2 className="font-rajdhani font-bold text-2xl tracking-wide">APTRANSCO</h2>
                            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Internship Program</p>
                        </div>
                        <img src="/logo.png" alt="Logo" className="w-12 h-12 bg-white rounded-full p-1 shadow-lg" />
                    </div>

                    <div className="relative z-10 mb-8 text-right">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6 float-right">
                            <UserPlus className="text-emerald-400 w-6 h-6" />
                        </div>
                        <div className="clear-both"></div>
                        <h1 className="text-4xl lg:text-5xl font-black font-rajdhani leading-tight mb-4 text-right">
                            Start Your <br /> Journey.
                        </h1>
                        <p className="text-indigo-200 text-sm lg:text-base font-medium ml-auto md:max-w-md">
                            Join thousands of engineering students training at the cutting edge of AP's power grid infrastructure.
                        </p>
                    </div>

                    <div className="relative z-10 hidden md:block text-right">
                        <p className="text-xs text-indigo-300 font-semibold tracking-wider">STATE TRANSMISSION UTILITY</p>
                    </div>
                </div>

                {/* Left Side: Form */}
                <div className="md:w-1/2 p-10 lg:p-14 flex flex-col justify-center bg-white relative">
                    <div className="max-w-sm w-full mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-gray-900 font-rajdhani">
                                Create an Account
                            </h2>
                            <p className="text-gray-500 text-sm mt-1 font-medium">Please fill in your details to register as a student.</p>
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
                                        <Mail className="h-4 w-4 text-gray-400" />
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
                                        <Lock className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        className="input-field pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        className="input-field pl-10"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {loading && <div className="animate-spin w-4 h-4 border-2 border-white/60 border-t-white rounded-full"></div>}
                                {loading ? 'Creating Account...' : 'Register Now'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center justify-center gap-3">
                            <p className="text-sm text-gray-500 font-medium">
                                Already have an account?
                            </p>
                            <Link to="/login" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wide">
                                Proceed to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
