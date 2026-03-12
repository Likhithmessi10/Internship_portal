import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Briefcase, User, GitCommit } from 'lucide-react';

const StudentLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const tabs = [
        { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Internships', path: '/student/internships', icon: <Briefcase size={18} /> },
        { name: 'My Profile', path: '/student/profile/edit', icon: <User size={18} /> },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {/* Navbar */}
            <nav className="bg-indigo-900 text-white shadow-xl sticky top-0 z-40 border-b-4 border-amber-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Brand */}
                        <Link to="/student/dashboard" className="flex items-center gap-4 hover:opacity-90 transition">
                            <img src="/logo.png" alt="APTRANSCO Logo" className="h-10 w-10 bg-white rounded-full p-1" />
                            <div>
                                <span className="font-rajdhani font-bold text-xl tracking-wide hidden sm:block">APTRANSCO</span>
                                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase hidden sm:block">Student Portal</span>
                            </div>
                        </Link>

                        {/* Right Menu */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3 mr-2 bg-indigo-800/50 rounded-full pl-3 pr-4 py-1.5 border border-indigo-700">
                                <div className="text-right">
                                    <p className="text-xs font-bold leading-tight">{user?.email?.split('@')[0] || 'Student'}</p>
                                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest leading-tight">Applicant</p>
                                </div>
                            </div>
                            <button 
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-800 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sub Nav / Tabs for Students */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        return (
                            <Link
                                key={tab.name}
                                to={tab.path}
                                className={`px-6 py-4 border-b-2 text-sm uppercase tracking-wider font-rajdhani transition-all flex items-center gap-2 whitespace-nowrap 
                                ${isActive ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 font-bold' : 'border-transparent text-gray-500 font-medium hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                {tab.icon} {tab.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto relative">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 text-gray-400 py-6 text-center text-xs">
                © {new Date().getFullYear()} APTRANSCO · Student Portal
            </footer>
        </div>
    );
};

export default StudentLayout;
