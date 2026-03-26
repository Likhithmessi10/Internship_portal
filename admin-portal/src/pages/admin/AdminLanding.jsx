import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, Star, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RoleCard = ({ title, desc, role, icon: Icon, colorClass, textClass, borderClass }) => (
    <div className={`p-8 rounded-[2.5rem] border ${borderClass} bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform ${colorClass}`}></div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${colorClass} bg-opacity-10 ${textClass}`}>
             <Icon size={28} />
        </div>
        <h3 className="text-2xl font-black font-rajdhani text-gray-900 dark:text-white uppercase tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">{desc}</p>
        <div className="flex gap-3">
            <Link to={`/login?role=${role}`} className={`flex-1 text-center py-3 text-white ${colorClass} hover:opacity-90 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95`}>
                Login
            </Link>
            <Link to={`/register?role=${role}`} className={`flex-1 text-center py-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95`}>
                Register
            </Link>
        </div>
    </div>
);

const AdminLanding = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;
        if (user) {
            if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
            else if (user.role === 'CE_PRTI') navigate('/prti/dashboard', { replace: true });
            else if (user.role === 'HOD') navigate('/hod/dashboard', { replace: true });
            else if (user.role === 'MENTOR') navigate('/mentor/dashboard', { replace: true });
            else navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden transition-colors duration-500">
            {/* Background elements */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <div className="relative z-10 w-full max-w-7xl mx-auto">
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex p-4 rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-gray-100 dark:border-white/5 mb-8">
                        <img src="/logo.png" alt="APTRANSCO Logo" className="h-16 w-16 object-contain" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black font-rajdhani text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                        APTRANSCO <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Admin Hub</span>
                    </h1>
                    <p className="text-gray-500 font-bold tracking-[0.2em] uppercase text-xs">Select your administrative sector</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <RoleCard 
                        title="PRTI Level" desc="Manage active internships, configure committees, and oversee recruitment."
                        role="CE_PRTI" icon={Building2} colorClass="bg-indigo-600" textClass="text-indigo-600 dark:text-indigo-400" borderClass="border-indigo-100 dark:border-indigo-500/20" />
                    
                    <RoleCard 
                        title="Head of Dept" desc="Verify department applications, shortlist candidates, and assign mentors."
                        role="HOD" icon={Star} colorClass="bg-purple-600" textClass="text-purple-600 dark:text-purple-400" borderClass="border-purple-100 dark:border-purple-500/20" />
                    
                    <RoleCard 
                        title="Mentor" desc="Monitor intern attendance, assign tasks, and track performance."
                        role="MENTOR" icon={Users} colorClass="bg-sky-600" textClass="text-sky-600 dark:text-sky-400" borderClass="border-sky-100 dark:border-sky-500/20" />
                    
                    <RoleCard 
                        title="Super Admin" desc="System administration, global portal settings, and overall metrics."
                        role="ADMIN" icon={ShieldAlert} colorClass="bg-rose-600" textClass="text-rose-600 dark:text-rose-400" borderClass="border-rose-100 dark:border-rose-500/20" />
                </div>
            </div>
        </div>
    );
};

export default AdminLanding;
