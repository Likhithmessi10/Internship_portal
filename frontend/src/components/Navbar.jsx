import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Plus, XCircle, LogOut, History, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage, t } = useLanguage();
    const location = useLocation();

    const navLink = (to, icon, label) => (
        <Link to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                ${location.pathname === to
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
            {icon}{label}
        </Link>
    );

    return (
        <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* Brand */}
            <Link to="/admin/dashboard" className="flex items-center gap-2 font-black text-base text-indigo-700 tracking-tight">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">AP</span>
                APTRANSCO
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold">Admin</span>
            </Link>

            {/* Links */}
             {user?.role === 'ADMIN' && (
                <nav className="flex items-center gap-1">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors mr-1"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors mr-2"
                        title="Toggle Language"
                    >
                        <Globe size={12} /> {lang === 'en' ? 'EN' : 'TE'}
                    </button>

                    {navLink('/admin/dashboard', <LayoutDashboard size={14} />, t('nav.dashboard'))}
                    {navLink('/admin/internships/past', <History size={14} />, t('nav.past'))}
                    {navLink('/admin/rejected', <XCircle size={14} />, t('nav.rejected'))}
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 ml-3 px-3 py-1.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={14} /> {t('nav.logout')}
                    </button>
                </nav>
            )}
        </header>
    );
};

export default Navbar;
