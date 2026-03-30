import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Briefcase, User, GitCommit, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const StudentLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage, t } = useLanguage();
    const [profile, setProfile] = React.useState(null);
    const location = useLocation();

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (user?.role === 'STUDENT') {
                try {
                    const res = await api.get('/students/profile');
                    setProfile(res.data.data);
                } catch (error) {
                    console.log("No profile yet for layout", error);
                }
            }
        };
        fetchProfile();
    }, [user]);

    const tabs = [
        { name: t('nav.dashboard'), path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: t('nav.apply'), path: '/student/internships', icon: <Briefcase size={18} /> },
        { name: t('nav.profile'), path: '/student/profile/edit', icon: <User size={18} /> },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Unified Navbar */}
            <nav className="glass-navbar border-b-4 border-amber-500 shadow-xl dark:border-amber-600/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Brand */}
                        <Link to="/student/dashboard" className="flex items-center gap-4 hover:opacity-90 transition group">
                            <div className="relative">
                                <img src="/logo.png" alt="APTRANSCO Logo" className="h-12 w-12 bg-white rounded-2xl p-1.5 shadow-lg group-hover:rotate-6 transition-transform" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                            </div>
                            <div>
                                <span className="font-rajdhani font-black text-2xl tracking-tight hidden sm:block text-indigo-900 dark:text-white leading-none">APTRANSCO</span>
                                <span className="text-[10px] font-bold tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase hidden sm:block">Student Portal</span>
                            </div>
                        </Link>

                        {/* Center - Navigation Tabs */}
                        <div className="hidden md:flex items-center gap-2">
                            {tabs.map((tab) => {
                                const isActive = location.pathname === tab.path;
                                return (
                                    <Link
                                        key={tab.name}
                                        to={tab.path}
                                        className={`px-4 py-2 rounded-xl text-xs uppercase tracking-[0.15em] font-rajdhani transition-all flex items-center gap-2
                                        ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg font-black'
                                                : 'text-gray-600 dark:text-gray-400 font-bold hover:bg-indigo-50 dark:hover:bg-slate-800'}`}
                                    >
                                        {tab.icon} {tab.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Menu */}
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex items-center gap-1 glass-card p-1 rounded-2xl">
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
                                    title="Toggle Theme"
                                >
                                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                                <button
                                    onClick={toggleLanguage}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-xs ${lang === 'te' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
                                    title="Toggle Language"
                                >
                                    <Globe size={16} /> {lang === 'en' ? 'ENGLISH' : 'తెలుగు'}
                                </button>
                            </div>

                            <div className="hidden md:flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl pl-4 pr-5 py-2 border border-black/5 dark:border-white/5 backdrop-blur-md">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-inner font-bold text-xs uppercase overflow-hidden">
                                    {profile?.fullName?.charAt(0) || user?.email?.charAt(0)}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-indigo-900 dark:text-white leading-tight truncate max-w-[150px]">
                                        {profile?.fullName || user?.email?.split('@')[0] || t('nav.student')}
                                    </p>
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest leading-tight">{t('nav.applicant')}</p>
                                </div>
                            </div>

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg hover:shadow-red-500/20 active:scale-95 text-xs font-black uppercase tracking-wider"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('nav.logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Tabs */}
                <div className="md:hidden border-t border-amber-500/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => {
                            const isActive = location.pathname === tab.path;
                            return (
                                <Link
                                    key={tab.name}
                                    to={tab.path}
                                    className={`flex-1 px-4 py-3 border-b-2 text-[10px] uppercase tracking-[0.15em] font-rajdhani transition-all flex items-center justify-center gap-2 whitespace-nowrap
                                    ${isActive
                                            ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 font-black'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 font-bold hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                >
                                    {tab.icon} {tab.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto relative">
                {children}
            </main>

            <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-white/5 text-gray-400 dark:text-slate-500 py-6 text-center text-xs">
                © {new Date().getFullYear()} APTRANSCO · {t('nav.studentPortal')}
            </footer>
        </div>
    );
};

export default StudentLayout;
