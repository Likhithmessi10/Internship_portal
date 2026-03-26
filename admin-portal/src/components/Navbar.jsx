import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Bell, HelpCircle, Moon, Sun, Globe } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage } = useLanguage();

    return (
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/20 dark:border-slate-800/20 h-16 flex justify-between items-center px-8 shadow-sm dark:shadow-none">
            <div className="flex items-center flex-1">
                <div className="relative w-96 group focus-within:ring-2 focus-within:ring-sky-500/20 rounded-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        className="w-full bg-surface-container-low border-none rounded-lg pl-10 py-2 text-sm focus:ring-0 placeholder:text-slate-400 dark:bg-slate-900/50" 
                        placeholder="Search research, interns, or logs..." 
                        type="text"
                    />
                </div>
                <nav className="ml-10 flex gap-8">
                    <button className="text-sky-900 dark:text-sky-400 border-b-2 border-sky-900 dark:border-sky-400 pb-2 font-inter text-sm font-medium">Overview</button>
                    <button className="text-slate-500 dark:text-slate-400 pb-2 hover:text-sky-700 dark:hover:text-sky-300 transition-colors font-inter text-sm font-medium">Analytics</button>
                    <button className="text-slate-500 dark:text-slate-400 pb-2 hover:text-sky-700 dark:hover:text-sky-300 transition-colors font-inter text-sm font-medium">Archives</button>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={toggleLanguage} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1">
                    <Globe size={18} />
                    <span className="text-[10px] font-bold uppercase">{lang === 'en' ? 'EN' : 'TE'}</span>
                </button>
                
                <div className="h-8 w-[1px] bg-slate-200 mx-2 dark:bg-slate-800"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-on-surface">{user?.name || 'Admin User'}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tight">{user?.role?.replace('_', ' ') || 'Role'}</p>
                    </div>
                    <div className="relative group">
                        <img 
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary-container/20 cursor-pointer" 
                            src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=003366&color=fff`}
                            alt="Profile"
                        />
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all">
                            <button onClick={logout} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-2">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
export default Navbar;
