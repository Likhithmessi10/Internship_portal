import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center">
            <Link to="/" className="text-xl font-bold tracking-tight">APTRANSCO Portal</Link>
            <nav className="flex gap-4 items-center">
                <Link to="/" className="hover:text-blue-200">Home</Link>

                {user ? (
                    <>
                        <span className="text-sm bg-blue-800 px-2 py-1 rounded">Role: {user.role}</span>
                        {user.role === 'ADMIN' ? (
                            <Link to="/admin/dashboard" className="hover:text-blue-200">Dashboard</Link>
                        ) : (
                            <Link to="/student/dashboard" className="hover:text-blue-200">Dashboard</Link>
                        )}
                        <button onClick={logout} className="ml-4 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="hover:text-blue-200">Login</Link>
                        <Link to="/register" className="bg-white text-primary px-3 py-1 rounded font-semibold hover:bg-gray-100 transition-colors">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Navbar;
