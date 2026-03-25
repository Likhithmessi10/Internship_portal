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
import AdminPastInternships from './pages/admin/AdminPastInternships';

const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
    <Navbar />
    <main className="pt-8 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {children}
    </main>
    <footer className="border-t border-black/5 dark:border-white/5 py-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-slate-600">
      © {new Date().getFullYear()} APTRANSCO · Admin Portal · System Integrated
    </footer>
  </div>
);

const APTRANSCO_ROLES = ['ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'];

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  if (!APTRANSCO_ROLES.includes(user.role)) {
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
            <ProtectedRoute allowedRoles={APTRANSCO_ROLES}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/new" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI']}>
              <AdminLayout><CreateInternshipForm /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/:id/applications" element={
            <ProtectedRoute allowedRoles={APTRANSCO_ROLES}>
              <AdminLayout><AdminApplicationReview /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/rejected" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI']}>
              <AdminLayout><AdminRejected /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/past" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI']}>
              <AdminLayout><AdminPastInternships /></AdminLayout>
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
