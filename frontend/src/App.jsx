import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInternshipForm from './pages/admin/CreateInternship';
import AdminApplicationReview from './pages/admin/AdminApplicationReview';
import AdminRejected from './pages/admin/AdminRejected';

const AdminLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <main className="flex-grow p-6 lg:p-8">
      {children}
    </main>
    <footer className="bg-white border-t border-gray-100 text-gray-400 py-4 text-center text-xs">
      © {new Date().getFullYear()} APTRANSCO · Admin Portal · Confidential
    </footer>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root — redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AdminLogin />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/internships/new" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><CreateInternshipForm /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/internships/:id/applications" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminApplicationReview /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/rejected" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminRejected /></AdminLayout>
            </ProtectedRoute>
          } />

          {/* All other paths → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
