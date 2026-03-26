import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useSearchParams, Navigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminRegister = () => {
    const { registerAdmin, user } = useAuth();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const targetRole = searchParams.get('role');

    const roleNames = { 'ADMIN': 'Super Admin', 'CE_PRTI': 'PRTI', 'HOD': 'HOD', 'MENTOR': 'Mentor' };
    const roleDisplay = targetRole ? roleNames[targetRole] : 'Admin';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState(targetRole || 'CE_PRTI');
    const [department, setDepartment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        if (user?.role) {
            if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
            else if (user.role === 'CE_PRTI') navigate('/prti/dashboard', { replace: true });
            else if (user.role === 'HOD') navigate('/hod/dashboard', { replace: true });
            else if (user.role === 'MENTOR') navigate('/mentor/dashboard', { replace: true });
            else navigate('/dashboard', { replace: true });
        }

        const fetchConfig = async () => {
            try {
                const res = await api.get('/admin/config');
                setDepartments(res.data.data.departments || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchConfig();
    }, [user, navigate]);

    if (!targetRole) {
        return <Navigate to="/landing" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await registerAdmin(email, password, role, name, department);
            if (role === 'ADMIN') navigate('/admin/dashboard');
            else if (role === 'CE_PRTI') navigate('/prti/dashboard');
            else if (role === 'HOD') navigate('/hod/dashboard');
            else if (role === 'MENTOR') navigate('/mentor/dashboard');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="relative w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img src="/logo.png" alt="APTRANSCO Logo" className="h-24 object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-gray-900 dark:text-white font-extrabold text-3xl tracking-tight mb-2">APTRANSCO</h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-widest">Administrator Portal</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl">
                    <h2 className="text-gray-900 dark:text-white font-bold text-xl mb-1 text-center">{roleDisplay} Registration</h2>
                    <p className="text-gray-400 dark:text-slate-500 text-sm mb-7 text-center">Create a new administrative account</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center justify-center text-center gap-2">
                             ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="name@aptransco.gov.in"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                        {role !== 'CE_PRTI' && role !== 'ADMIN' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">
                                    Department
                                </label>
                                <select 
                                    className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white font-bold rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                    value={department} 
                                    onChange={e => setDepartment(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Department --</option>
                                    {departments.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center gap-2 text-sm mt-4"
                        >
                            {loading ? (
                                <><span className="animate-spin w-4 h-4 border-2 border-white/60 border-t-white rounded-full" /> Registering...</>
                            ) : (
                                'Register Admin Account →'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminRegister;
