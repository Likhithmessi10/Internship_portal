import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, XCircle, LogOut, History, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage, t } = useLanguage();
    const location = useLocation();

    const tabs = [
        { name: t('nav.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: t('nav.past'), path: '/internships/past', icon: <History size={18} /> },
        { name: t('nav.rejected'), path: '/rejected', icon: <XCircle size={18} /> },
    ];

    return (
        <div className="flex flex-col w-full">
            {/* Top Navbar */}
            <nav className="glass-navbar border-b-4 border-amber-500 shadow-xl dark:border-amber-600/50 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Brand */}
                        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition group">
                            <div className="relative">
                                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-indigo-100 dark:border-white/5 flex items-center justify-center group-hover:rotate-6 transition-transform">
                                    <span className="font-rajdhani font-black text-lg text-indigo-600 dark:text-indigo-400">AP</span>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                            </div>
                            <div>
                                <span className="font-rajdhani font-black text-2xl tracking-tight hidden sm:block text-indigo-900 dark:text-white leading-none">APTRANSCO</span>
                                <span className="text-[10px] font-black tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase hidden sm:block">Admin Hub</span>
                            </div>
                        </Link>

                        {/* Right Menu */}
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-1 glass-card p-1 rounded-2xl bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5">
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
                                    title="Toggle Theme"
                                >
                                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                                <button
                                    onClick={toggleLanguage}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-[10px] tracking-widest ${lang === 'te' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
                                    title="Toggle Language"
                                >
                                    <Globe size={16} /> {lang === 'en' ? 'ENGLISH' : 'తెలుగు'}
                                </button>
                            </div>

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg hover:shadow-red-500/20 active:scale-95 text-[10px] font-black uppercase tracking-widest"
                            >
                                <LogOut size={16} /> <span className="hidden xl:inline">{t('nav.logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sub Nav / Tabs */}
            {user && ['ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'].includes(user.role) && (
                <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 shadow-sm sticky top-[80px] z-40 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => {
                            if (tab.name === t('nav.past') && !['ADMIN', 'CE_PRTI'].includes(user.role)) return null;
                            if (tab.name === t('nav.rejected') && !['ADMIN', 'CE_PRTI'].includes(user.role)) return null;
                            
                            const isActive = location.pathname === tab.path || (tab.path === '/dashboard' && location.pathname.startsWith('/internships/new'));
                            return (
                                <Link
                                    key={tab.name}
                                    to={tab.path}
                                    className={`px-6 py-3 border-b-2 text-[10px] uppercase tracking-[0.2em] font-rajdhani transition-all flex items-center gap-2 whitespace-nowrap 
                                    ${isActive
                                        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 font-black'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                >
                                    {tab.icon && React.cloneElement(tab.icon, { size: 14 })} {tab.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
