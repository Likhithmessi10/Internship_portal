import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    const menuItems = [
        { label: 'Dashboard', icon: 'dashboard', path: user?.role === 'ADMIN' ? '/admin/dashboard' : `/${user?.role?.toLowerCase()}/dashboard` },
        { label: 'Intern Management', icon: 'group', path: '/admin/interns' }, // Temporary path
        { label: 'Applications', icon: 'description', path: '/internships/past' },
        { label: 'Committees', icon: 'account_tree', path: '/committees' },
        { label: 'Meetings', icon: 'event_available', path: '/meetings' },
        { label: 'Reports', icon: 'assessment', path: '/reports' },
    ];

    return (
        <aside className="h-screen w-64 fixed left-0 top-0 border-r-0 bg-slate-100 dark:bg-slate-900 font-inter antialiased tracking-tight flex flex-col py-8 z-50">
            <div className="px-8 mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container shadow-lg">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-widest uppercase text-sky-950 dark:text-sky-50 leading-tight">AP Transco</h1>
                        <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Scholaris Prime Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center gap-4 h-12 transition-all duration-200 ${
                                isActive 
                                    ? 'text-sky-900 dark:text-sky-400 font-semibold border-l-4 border-sky-900 dark:border-sky-400 pl-4 bg-white/50 dark:bg-white/5 opacity-90' 
                                    : 'text-slate-500 dark:text-slate-400 pl-5 hover:text-sky-800 dark:hover:text-sky-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 mt-auto space-y-1">
                <button className="w-full bg-primary-container text-white py-3 rounded-lg flex items-center justify-center gap-2 mb-6 font-medium shadow-md hover:opacity-90 transition-all text-sm">
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>New Project</span>
                </button>
                <NavLink to="/settings" className="flex items-center gap-4 text-slate-500 dark:text-slate-400 pl-5 hover:text-sky-800 dark:hover:text-sky-200 h-12 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200">
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-sm">Settings</span>
                </NavLink>
                <NavLink to="/support" className="flex items-center gap-4 text-slate-500 dark:text-slate-400 pl-5 hover:text-sky-800 dark:hover:text-sky-200 h-12 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200">
                    <span className="material-symbols-outlined">contact_support</span>
                    <span className="text-sm">Support</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
