import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInternshipForm from './pages/admin/CreateInternship';
import AdminApplicationReview from './pages/admin/AdminApplicationReview';
import AdminRejected from './pages/admin/AdminRejected';
import AdminRegister from './pages/admin/AdminRegister';

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

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') {
        // If a student somehow lands here, redirect to student portal (port 5173) or just show error
        return <div className="p-10 text-center">Unauthorized. This is the Admin Portal.</div>;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Admin Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<AdminRegister />} />

          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/new" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><CreateInternshipForm /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/:id/applications" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminApplicationReview /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/rejected" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminRejected /></AdminLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
