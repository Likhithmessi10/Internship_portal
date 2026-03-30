import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useSearchParams, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { Home } from 'lucide-react';
import departmentsData from '../../data/departments.json';

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
                setDepartments(res.data.data?.departments || departmentsData.departments);
            } catch (err) {
                console.error('Failed to fetch departments:', err);
                // Fallback to departments.json if API fails
                setDepartments(departmentsData.departments);
            }
        };
        fetchConfig();
    }, [user, navigate]);

    if (!targetRole) {
        return <Navigate to="/" replace />;
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
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 sm:p-12 font-inter">
            {/* Background elements omitted for clean Stitch look */}

            <div className="w-full max-w-[480px]">
                <div className="text-center mb-12">
                    <div className="text-primary font-bold text-xs uppercase tracking-[0.3em] mb-4">Institutional Portal</div>
                    <h1 className="text-4xl font-extrabold text-primary tracking-tighter uppercase mb-2">APTRANSCO</h1>
                    <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
                </div>


                <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-10 shadow-sm relative">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-primary tracking-tight">{roleDisplay} Registration</h2>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider mt-1">Institutional Access Enrollment</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-lg text-[10px] font-bold uppercase tracking-widest border border-error/10 text-center">
                            Error: {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Enter Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white border border-outline-variant/20 text-primary placeholder:text-outline/30 rounded-lg px-4 py-3 text-xs font-bold focus:outline-primary transition-all shadow-sm"
                            />
                        </div>
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
                                className="w-full bg-white border border-outline-variant/20 text-primary placeholder:text-outline/30 rounded-lg px-4 py-3 text-xs font-bold focus:outline-primary transition-all shadow-sm"
                            />
                        </div>
                        {role !== 'CE_PRTI' && role !== 'ADMIN' && (
                            <div>
                                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2.5">
                                    Department
                                </label>
                                <select
                                    className="w-full bg-white border border-outline-variant/20 text-primary font-bold rounded-lg px-4 py-3 text-xs focus:outline-primary shadow-sm"
                                    value={department}
                                    onChange={e => setDepartment(e.target.value)}
                                    required
                                >
                                    <option value="">Choose Unit</option>
                                    {departments.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white border border-outline-variant/20 text-primary placeholder:text-outline/30 rounded-lg px-4 py-3 text-xs font-bold focus:outline-primary transition-all shadow-sm"
                            />
                            <div className="mt-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
                                <p className="text-[9px] font-bold text-primary/70 uppercase tracking-wider mb-1">Password Requirements:</p>
                                <ul className="text-[9px] text-outline space-y-0.5">
                                    <li className="flex items-center gap-1.5">
                                        <span className={`w-1 h-1 rounded-full ${password.length >= 6 ? 'bg-emerald-500' : 'bg-outline'}`}></span>
                                        Minimum 6 characters
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <span className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-outline'}`}></span>
                                        8+ characters recommended
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2.5">
                                Confirm Security Key
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-white border border-outline-variant/20 text-primary placeholder:text-outline/30 rounded-lg px-4 py-3 text-xs font-bold focus:outline-primary transition-all shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white font-bold py-4 rounded-lg transition-all hover:opacity-95 shadow-md active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] mt-6"
                        >
                            {loading ? (
                                <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Processing</>
                            ) : (
                                'Complete Enrollment'
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest">
                            Authorized personnel only
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <Link to="/" className="text-[10px] text-primary uppercase tracking-widest underline hover:no-underline flex items-center gap-1">
                                <Home size={12} /> All Roles
                            </Link>
                            <span className="text-outline/40">•</span>
                            <Link to="/login" className="text-[10px] text-primary uppercase tracking-widest underline hover:no-underline">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRegister;
