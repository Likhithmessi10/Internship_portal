import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Moon, Sun, Globe, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggle }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage } = useLanguage();
    const location = useLocation();

    const isAdmin = user?.role === 'ADMIN';
    const isHOD = user?.role === 'HOD';
    const isPRTI = user?.role === 'CE_PRTI';
    const isMentor = user?.role === 'MENTOR';

    // Get user display name - prioritize name field, fallback to email prefix
    const getDisplayName = () => {
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0];
        return 'User';
    };

    const displayName = getDisplayName();

    const menuItems = [
        {
            label: 'Dashboard',
            icon: 'dashboard',
            path: isAdmin ? '/admin/dashboard' : (isPRTI ? '/prti/dashboard' : `/${user?.role?.toLowerCase()}/dashboard`)
        },
        ...(!isPRTI ? [{ 
            label: 'Applications', 
            icon: 'description', 
            path: isHOD ? '/hod/applications' : (isMentor ? '/mentor/applications' : '/internships/past') 
        }] : []),
        // PRTI Committee Evaluation (special for PRTI members)
        ...(isPRTI ? [{
            label: 'Committee Evaluation',
            icon: 'fact_check',
            path: '/prti/committee',
            highlight: true
        }] : []),
        {
            label: 'Committees',
            icon: 'account_tree',
            path: isHOD ? '/hod/committees' : (isMentor ? '/mentor/committees' : '/committees')
        },
        {
            label: 'Meetings',
            icon: 'event_available',
            path: isPRTI ? '/prti/meetings' : (isHOD ? '/hod/meetings' : (isMentor ? '/mentor/meetings' : '/meetings'))
        },
        {
            label: 'Reports',
            icon: 'assessment',
            path: isPRTI ? '/prti/reports' : (isHOD ? '/hod/reports' : (isMentor ? '/mentor/reports' : '/reports'))
        },
    ];

    return (
        <aside className={`fixed left-0 top-0 h-screen border-r border-outline/10 bg-slate-100 dark:bg-slate-900 font-inter antialiased tracking-tight flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Toggle Button */}
            <button
                onClick={() => onToggle(!isCollapsed)}
                className="absolute -right-3 top-4 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`px-6 py-6 ${isCollapsed ? 'px-4' : ''}`}>
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="AP TRANSCO" className="w-14 h-16 object-contain flex-shrink-0 rounded-lg border border-outline/20 shadow-sm" />
                    {!isCollapsed && (
                        <div className="pl-1">
                            <h1 className="text-base font-black tracking-widest uppercase text-sky-950 dark:text-sky-50 leading-tight">AP Transco</h1>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Internship Portal</p>
                        </div>
                    )}
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 h-12 transition-all duration-200 rounded-lg ${isActive
                                    ? 'text-sky-900 dark:text-sky-400 font-semibold border-l-4 border-sky-900 dark:border-sky-400 pl-4 bg-white/50 dark:bg-white/5 opacity-90'
                                    : 'text-slate-500 dark:text-slate-400 pl-5 hover:text-sky-800 dark:hover:text-sky-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                                } ${isCollapsed ? 'justify-center px-2' : ''}`
                            }
                            title={isCollapsed ? item.label : ''}
                        >
                            <span className="material-symbols-outlined flex-shrink-0">{item.icon}</span>
                            {!isCollapsed && <span className="text-sm">{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            <div className={`px-4 py-4 ${isCollapsed ? 'px-2' : ''}`}>
                {(isAdmin || isPRTI || isHOD) && (
                    <NavLink
                        to="/internships/new"
                        className={`bg-primary-container text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium shadow-md hover:opacity-90 transition-all text-sm no-underline hover:text-white ${isCollapsed ? 'px-2' : ''}`}
                        title={isCollapsed ? 'New Internship' : ''}
                    >
                        <span className="material-symbols-outlined text-sm flex-shrink-0">add_circle</span>
                        {!isCollapsed && <span>New Internship</span>}
                    </NavLink>
                )}

                {/* Theme, Language, and User Profile Section */}
                <div className={`pt-4 border-t border-outline/20 ${isCollapsed ? 'hidden' : ''}`}>
                    {/* User Profile with Theme and Language Toggle */}
                    <div className="relative group mt-3">
                        <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user?.photoUrl ? (
                                    <img src={user.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-black text-primary">{displayName.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-primary truncate">{displayName}</p>
                                <p className="text-[8px] text-outline font-bold uppercase tracking-tight truncate">{user?.role?.replace('_', ' ') || 'Role'}</p>
                            </div>
                            {/* Theme and Language Toggle */}
                            <div className="flex items-center gap-1">
                                <button onClick={toggleTheme} className="p-2 text-outline hover:bg-surface-container-high rounded-lg transition-colors" title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                                    {isDarkMode ? <Sun size={16} className="text-on-surface" /> : <Moon size={16} className="text-outline" />}
                                </button>
                                <button onClick={toggleLanguage} className="p-2 text-outline hover:bg-surface-container-high rounded-lg transition-colors flex items-center gap-1" title="Toggle Language">
                                    <Globe size={14} className="text-outline" />
                                    <span className="text-[9px] font-bold uppercase">{lang === 'en' ? 'EN' : 'TE'}</span>
                                </button>
                            </div>
                        </div>
                        {/* Dropdown Menu */}
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-outline-variant/10 p-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all transform scale-95 group-hover:scale-100">
                            <div className="px-4 py-3 border-b border-outline-variant/10 mb-2">
                                <p className="text-sm font-bold text-primary">{displayName}</p>
                                <p className="text-[9px] text-outline font-medium truncate">{user?.email}</p>
                            </div>
                            <NavLink to="/profile" className="w-full text-left px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl flex items-center gap-2 transition-colors no-underline">
                                <span className="material-symbols-outlined text-base">account_circle</span>
                                My Profile
                            </NavLink>
                            <button onClick={logout} className="w-full text-left px-4 py-2.5 text-xs font-bold text-error hover:bg-error/5 rounded-xl flex items-center gap-2 transition-colors">
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>


            </div>
        </aside>
    );
};

export default Sidebar;
