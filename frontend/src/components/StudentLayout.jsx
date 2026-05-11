import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LogOut, LayoutDashboard, Briefcase, User, 
    Moon, Sun, Globe, ChevronLeft, ChevronRight,
    Settings, ShieldCheck, Mail, Zap, ClipboardList
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const StudentLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage, t } = useLanguage();
    const [profile, setProfile] = React.useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
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

    const isHired = profile?.applications?.some(app => ['APPROVED', 'HIRED'].includes(app.status));

    const tabs = [
        { name: t('nav.dashboard'), path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: t('nav.apply'), path: '/student/internships', icon: <Briefcase size={20} /> },
        ...(isHired ? [{ name: 'Assignments', path: '/student/assignments', icon: <ClipboardList size={20} /> }] : []),
        { name: t('nav.profile'), path: '/student/profile/edit', icon: <User size={20} /> },
    ];

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Sidebar */}
            <aside 
                className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col sticky top-0 h-screen z-50`}
            >
                {/* Brand */}
                <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <Link to="/student/dashboard" className="flex items-center gap-3 group">
                        <div className="relative shrink-0">
                            <img src="/logo.png" alt="APTRANSCO Logo" className="h-10 w-10 bg-white rounded-xl p-1 shadow-md" />
                            {!isSidebarCollapsed && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <h1 className="font-rajdhani font-black text-xl tracking-tight text-indigo-900 dark:text-white leading-none">APTRANSCO</h1>
                                <span className="text-[10px] font-bold tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Student Portal</span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Sidebar Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
                    {!isSidebarCollapsed && (
                        <p className="px-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4">Main Menu</p>
                    )}
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        return (
                            <Link
                                key={tab.name}
                                to={tab.path}
                                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative
                                    ${isActive 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                            >
                                <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform shrink-0`}>
                                    {tab.icon}
                                </div>
                                {!isSidebarCollapsed && (
                                    <span className={`text-sm font-bold uppercase tracking-wide animate-in fade-in slide-in-from-left-2 duration-300`}>
                                        {tab.name}
                                    </span>
                                )}
                                {isActive && isSidebarCollapsed && (
                                    <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Sidebar Footer - Profile */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    {!isSidebarCollapsed ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
                                {profile?.fullName?.charAt(0) || user?.email?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-indigo-900 dark:text-white truncate">
                                    {profile?.fullName || user?.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Applicant</p>
                            </div>
                            <button 
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <button 
                                onClick={toggleTheme}
                                className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
                                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button 
                                onClick={toggleLanguage}
                                className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
                                title="Switch Language"
                            >
                                <Globe size={20} />
                            </button>
                            <button 
                                onClick={logout}
                                className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}

                    {!isSidebarCollapsed && (
                        <div className="mt-4 flex items-center gap-2 px-2">
                            <button
                                onClick={toggleTheme}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
                            </button>
                            <button
                                onClick={toggleLanguage}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                title="Switch Language"
                            >
                                <Globe size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'en' ? 'తెలుగు' : 'EN'}</span>
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-md text-slate-400 hover:text-indigo-600 transition-all z-50"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 h-screen ${location.pathname.includes('/profile') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {/* Minimal Header for Mobile */}
                <header className="lg:hidden h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                    <button className="p-2 text-slate-500">
                        <LayoutDashboard size={24} />
                    </button>
                </header>

                <main className={`flex-1 w-full p-6 lg:p-10 ${location.pathname.includes('/profile') ? 'overflow-hidden' : ''}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
