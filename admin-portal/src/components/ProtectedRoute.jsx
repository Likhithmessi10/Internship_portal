import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user) {
        // Determine which role-based login to redirect to based on the route
        const path = location.pathname;
        let redirectPath = '/login';

        // Check if this is a PRTI route
        if (path.includes('/prti/')) {
            redirectPath = '/login?role=CE_PRTI';
        }
        // Check if this is a HOD route
        else if (path.includes('/hod/')) {
            redirectPath = '/login?role=HOD';
        }
        // Check if this is a Mentor route
        else if (path.includes('/mentor/')) {
            redirectPath = '/login?role=MENTOR';
        }
        // Check if this is an Admin route
        else if (path.includes('/admin/')) {
            redirectPath = '/login?role=ADMIN';
        }

        // Redirect to login with role parameter, preserving the intended destination
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />; // Unauthorized
    }

    return children;
};

export default ProtectedRoute;
