import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import {
    Moon, Sun, Globe, LogOut, ChevronLeft, ChevronRight,
    LayoutDashboard, FolderOpen, Settings2, GraduationCap,
    FileText, CheckSquare, Users, Calendar, BarChart3,
    Search, PlusCircle, ClipboardList, UserCheck,
    Building2, ChevronDown, Lock, BookOpen
} from 'lucide-react';
import { MONETARY_ENABLED } from '../config/features';

// ── Per-role nav config ───────────────────────────────────────────────────────
// Items/sections marked  monetary:true  are hidden when MONETARY_ENABLED=false.
const NAV = {
    CE_PRTI: [
        {
            section: 'Overview',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, path: '/prti/dashboard' },
            ]
        },
        {
            section: 'Programs',
            items: [
                { label: 'Master Programs', icon: FolderOpen, path: '/prti/batches' },
                { label: 'Dept & Fields',   icon: Settings2,  path: '/prti/dept-config' },
            ]
        },
        {
            section: 'Interns',
            items: [
                { label: 'Applications',     icon: FileText,      path: '/hod/applications' },
                { label: 'Learning Interns', icon: GraduationCap, path: '/prti/learning-interns' },
                { label: 'Work Logs',        icon: BookOpen,      path: '/prti/work-logs' },
                { label: 'Selection',        icon: CheckSquare,   path: '/hod/selection', highlight: true, monetary: true },
            ]
        },
        {
            section: 'Coordination',
            items: [
                { label: 'Problem Statements', icon: ClipboardList, path: '/hod/problem-statements', monetary: true },
                { label: 'Committees',         icon: Users,         path: '/hod/committees',          monetary: true },
                { label: 'Meetings',           icon: Calendar,      path: '/prti/meetings',      monetary: true },
            ]
        },
        {
            section: 'System',
            items: [
                { label: 'Reports',          icon: BarChart3, path: '/prti/reports' },
                { label: 'Candidate Search', icon: Search,    path: '/admin/search' },
            ]
        },
    ],
    HOD: [
        {
            section: 'Overview',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, path: '/hod/dashboard' },
            ]
        },
        {
            section: 'Programs',
            items: [
                { label: 'Master Programs', icon: FolderOpen, path: '/prti/batches' },
            ]
        },
        {
            section: 'My Department',
            items: [
                { label: 'Applications',       icon: FileText,      path: '/hod/applications' },
                { label: 'Field Configuration', icon: Settings2,    path: '/hod/field-config' },
                { label: 'Problem Statements', icon: ClipboardList, path: '/hod/problem-statements', monetary: true },
                { label: 'Selection',          icon: CheckSquare,   path: '/hod/selection', highlight: true, monetary: true },
            ]
        },
        {
            section: 'Coordination',
            items: [
                { label: 'Committees', icon: Users,    path: '/hod/committees', monetary: true },
                { label: 'Meetings',   icon: Calendar, path: '/hod/meetings',   monetary: true },
            ]
        },
        {
            section: 'System',
            items: [
                { label: 'Reports',          icon: BarChart3, path: '/hod/reports' },
                { label: 'Candidate Search', icon: Search,    path: '/admin/search' },
            ]
        },
    ],
    MENTOR: [
        {
            section: 'Overview',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, path: '/mentor/dashboard' },
            ]
        },
        {
            section: 'My Work',
            items: [
                { label: 'My Interns',  icon: UserCheck, path: '/mentor/applications' },
                { label: 'Committees',  icon: Users,     path: '/mentor/committees', monetary: true },
                { label: 'Meetings',    icon: Calendar,  path: '/mentor/meetings',  monetary: true },
                { label: 'Reports',     icon: BarChart3, path: '/mentor/reports' },
            ]
        },
    ],
    ADMIN: [
        {
            section: 'Overview',
            items: [
                { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
            ]
        },
        {
            section: 'Programs',
            items: [
                { label: 'Master Programs', icon: FolderOpen, path: '/prti/batches' },
                { label: 'Dept & Fields',   icon: Settings2,  path: '/prti/dept-config' },
            ]
        },
        {
            section: 'Interns',
            items: [
                { label: 'Applications',     icon: FileText,      path: '/hod/applications' },
                { label: 'Learning Interns', icon: GraduationCap, path: '/prti/learning-interns' },
                { label: 'Selection',        icon: CheckSquare,   path: '/hod/selection', highlight: true, monetary: true },
            ]
        },
        {
            section: 'Coordination',
            items: [
                { label: 'Committees', icon: Users,    path: '/hod/committees', monetary: true },
                { label: 'Meetings',   icon: Calendar, path: '/prti/meetings' },
            ]
        },
        {
            section: 'System',
            items: [
                { label: 'Reports',          icon: BarChart3, path: '/prti/reports' },
                { label: 'Candidate Search', icon: Search,    path: '/admin/search' },
            ]
        },
    ],
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ isCollapsed, onToggle }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, toggleLanguage } = useLanguage();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    const [changePassOpen, setChangePassOpen] = useState(false);
    const [cpForm, setCpForm]   = useState({ current: '', next: '', confirm: '' });
    const [cpError, setCpError] = useState('');
    const [cpOk, setCpOk]       = useState(false);

    const handleChangePass = async (e) => {
        e.preventDefault();
        setCpError('');
        if (cpForm.next !== cpForm.confirm) { setCpError('Passwords do not match.'); return; }
        try {
            await api.put('/auth/reset-password', { currentPassword: cpForm.current, newPassword: cpForm.next });
            setCpOk(true);
            setTimeout(() => { setChangePassOpen(false); setCpOk(false); setCpForm({ current: '', next: '', confirm: '' }); }, 1500);
        } catch (err) {
            setCpError(err.response?.data?.message || 'Failed to change password.');
        }
    };

    const role = user?.role || 'HOD';
    const sections = (NAV[role] || NAV.HOD)
        .map(s => ({ ...s, items: s.items.filter(i => MONETARY_ENABLED || !i.monetary) }))
        .filter(s => s.items.length > 0);

    const canCreateInternship = ['ADMIN', 'CE_PRTI', 'HOD'].includes(role);

    const displayName = user?.name || user?.email?.split('@')[0] || 'User';
    const roleLabel = {
        ADMIN: 'Super Admin',
        CE_PRTI: 'CE · PRTI',
        HOD: user?.department ? `HOD · ${user.department}` : 'HOD',
        MENTOR: user?.department ? `Mentor · ${user.department}` : 'Mentor',
        COMMITTEE_MEMBER: 'Committee',
    }[role] || role;

    return (
    <>
        <aside className={`fixed left-0 top-0 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-60'}`}>

            {/* Collapse toggle */}
            <button
                onClick={() => onToggle(!isCollapsed)}
                className="absolute -right-3 top-5 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'justify-center px-2' : ''}`}>
                <img src="/logo.png" alt="AP TRANSCO" className="w-9 h-9 object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0" />
                {!isCollapsed && (
                    <div>
                        <p className="text-[11px] font-black tracking-widest uppercase text-slate-800 dark:text-slate-100 leading-tight">AP Transco</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Internship Portal</p>
                    </div>
                )}
            </div>

            {/* Nav sections */}
            <nav className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin">
                {sections.map((section) => (
                    <div key={section.section} className={`${isCollapsed ? 'px-1' : 'px-3'}`}>
                        {/* Section label */}
                        {!isCollapsed && (
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 px-2 pt-4 pb-1.5 first:pt-1">
                                {section.section}
                            </p>
                        )}
                        {isCollapsed && (
                            <div className="border-t border-slate-100 dark:border-slate-800 my-2 first:hidden" />
                        )}

                        {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    title={isCollapsed ? item.label : undefined}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-xl transition-all duration-150 mb-0.5
                                        ${isCollapsed ? 'h-10 w-10 justify-center mx-auto' : 'px-3 py-2.5'}
                                        ${isActive
                                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                            : item.highlight
                                                ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
                                        }`
                                    }
                                >
                                    <Icon size={16} className="flex-shrink-0" />
                                    {!isCollapsed && (
                                        <span className="text-[13px] font-semibold">{item.label}</span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Bottom area */}
            <div className={`border-t border-slate-100 dark:border-slate-800 p-3 space-y-2 ${isCollapsed ? 'px-1' : ''}`}>
                {/* New Internship button */}
                {canCreateInternship && (
                    <button
                        onClick={() => navigate('/internships/new')}
                        title={isCollapsed ? 'New Internship' : undefined}
                        className={`w-full flex items-center gap-2 bg-primary text-white rounded-xl font-semibold text-[12px] shadow-sm hover:bg-primary/90 transition-all
                            ${isCollapsed ? 'h-10 justify-center' : 'px-3 py-2.5'}`}
                    >
                        <PlusCircle size={15} className="flex-shrink-0" />
                        {!isCollapsed && 'New Internship'}
                    </button>
                )}

                {/* User profile */}
                {!isCollapsed ? (
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(v => !v)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user?.photoUrl
                                    ? <img src={user.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                                    : <span className="text-sm font-black text-primary">{displayName.charAt(0).toUpperCase()}</span>
                                }
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{roleLabel}</p>
                            </div>
                            <ChevronDown size={13} className={`text-slate-400 flex-shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {profileOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50">
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{displayName}</p>
                                    <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1">
                                    <button onClick={toggleTheme} title={isDarkMode ? 'Light mode' : 'Dark mode'}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold transition-colors">
                                        {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
                                        {isDarkMode ? 'Light' : 'Dark'}
                                    </button>
                                    <button onClick={toggleLanguage}
                                        title={lang === 'en' ? 'Switch to Telugu' : 'Switch to English'}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold transition-colors">
                                        <Globe size={13} />
                                        {lang === 'en' ? 'తెలుగు' : 'English'}
                                    </button>
                                </div>
                                <NavLink to="/profile"
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors no-underline">
                                    <Building2 size={13} /> My Profile
                                </NavLink>
                                <button onClick={() => { setChangePassOpen(true); setProfileOpen(false); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                                    <Lock size={13} /> Change Password
                                </button>
                                <button onClick={logout}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[11px] font-semibold text-red-500 transition-colors">
                                    <LogOut size={13} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={logout} title="Sign Out"
                        className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors">
                        <LogOut size={16} />
                    </button>
                )}
            </div>
        </aside>

        {/* Change Password Modal */}
        {changePassOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Lock size={16} className="text-primary" />
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100">Change Password</p>
                        </div>
                        <button onClick={() => setChangePassOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">✕</button>
                    </div>
                    <form onSubmit={handleChangePass} className="px-6 py-5 space-y-4">
                        {cpError && <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">{cpError}</p>}
                        {cpOk   && <p className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg">Password changed ✓</p>}
                        {[
                            { key: 'current', label: 'Current Password' },
                            { key: 'next',    label: 'New Password' },
                            { key: 'confirm', label: 'Confirm New Password' },
                        ].map(({ key, label }) => (
                            <div key={key} className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-400">{label}</label>
                                <input type="password" required value={cpForm[key]}
                                    onChange={e => setCpForm(p => ({ ...p, [key]: e.target.value }))}
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                        ))}
                        <button type="submit"
                            className="w-full py-2.5 bg-primary text-white text-xs font-black uppercase rounded-xl hover:bg-primary/90 transition-colors">
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        )}
    </>
    );
};

export default Sidebar;
