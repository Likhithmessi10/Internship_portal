import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, Moon, Sun, Globe, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage } = useLanguage();

    // Get user display name - prioritize name field, fallback to email prefix
    const getDisplayName = () => {
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0];
        return 'User';
    };

    const displayName = getDisplayName();

    return (
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/20 dark:border-slate-800/20 h-16 flex justify-between items-center px-8 shadow-sm dark:shadow-none">
            <div className="flex items-center flex-1">
                {/* Logo and Title */}
                <div className="flex items-center gap-3">
                    <img src="/aptransco-logo.svg" alt="AP TRANSCO" className="w-12 h-14 object-contain" />
                    <div className="pl-2 border-l border-outline/20">
                        <h1 className="text-sm font-black text-primary uppercase tracking-widest">AP TRANSCO</h1>
                        <p className="text-[9px] text-outline font-bold uppercase tracking-wider">Internship Portal</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 text-outline hover:bg-surface-container-high rounded-full transition-colors">
                    {isDarkMode ? <Sun size={20} className="text-on-surface" /> : <Moon size={20} className="text-outline" />}
                </button>
                <button onClick={toggleLanguage} className="p-2 text-outline hover:bg-surface-container-high rounded-full transition-colors flex items-center gap-1">
                    <Globe size={18} className="text-outline" />
                    <span className="text-[10px] font-bold uppercase text-outline">{lang === 'en' ? 'EN' : 'TE'}</span>
                </button>

                <div className="h-8 w-[1px] bg-outline/20 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-primary">{displayName}</p>
                        <p className="text-[9px] text-outline font-bold uppercase tracking-tight">{user?.role?.replace('_', ' ') || 'Role'}</p>
                    </div>
                    <div className="relative group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center cursor-pointer overflow-hidden">
                            {user?.photoUrl ? (
                                <img src={user.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-black text-primary">{displayName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-outline-variant/10 p-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all transform scale-95 group-hover:scale-100">
                            <div className="px-4 py-3 border-b border-outline-variant/10 mb-2">
                                <p className="text-sm font-bold text-primary">{displayName}</p>
                                <p className="text-[9px] text-outline font-medium">{user?.email}</p>
                            </div>
                            <button onClick={logout} className="w-full text-left px-4 py-2.5 text-xs font-bold text-error hover:bg-error/5 rounded-xl flex items-center gap-2 transition-colors">
                                <LogOut size={16} />
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
