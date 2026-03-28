import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminLanding from './pages/admin/AdminLanding';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInternshipForm from './pages/admin/CreateInternship';
import AdminApplicationReview from './pages/admin/AdminApplicationReview';
import AdminRejected from './pages/admin/AdminRejected';
import AdminRegister from './pages/admin/AdminRegister';
import AdminPastInternships from './pages/admin/AdminPastInternships';

import PrtiDashboard from './pages/admin/prti/PrtiDashboard';
import PrtiInterns from './pages/admin/prti/PrtiInterns';
import PrtiMeetings from './pages/admin/prti/PrtiMeetings';
import PrtiReports from './pages/admin/prti/PrtiReports';
import PrtiPermissions from './pages/admin/prti/PrtiPermissions';
import PrtiHealth from './pages/admin/prti/PrtiHealth';
import PrtiAuditLogs from './pages/admin/prti/PrtiAuditLogs';
import PRTICommitteeDashboard from './pages/admin/prti/PRTICommitteeDashboard';
import HodDashboard from './pages/admin/hod/HodDashboard';
import HodApplications from './pages/admin/hod/HodApplications';
import HodCommittees from './pages/admin/hod/HodCommittees';
import HodMeetings from './pages/admin/hod/HodMeetings';
import MentorDashboard from './pages/admin/mentor/MentorDashboard';

const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-surface dark:bg-slate-950 transition-colors duration-500 font-inter">
    <Sidebar />
    <Navbar />
    <main className="ml-64 pt-24 px-8 pb-12 min-h-screen">
      {children}
    </main>
  </div>
);

const APTRANSCO_ROLES = ['ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'];

// Root redirection is handled by AdminLanding directly.

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Admin Routes */}
          <Route path="/" element={<AdminLanding />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<AdminRegister />} />

          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/dashboard" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/interns" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiInterns /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/meetings" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiMeetings /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/reports" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiReports /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/permissions" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiPermissions /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/health" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiHealth /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/audit-logs" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiAuditLogs /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/committee" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'COMMITTEE_MEMBER', 'ADMIN']}>
              <AdminLayout><PRTICommitteeDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/hod/dashboard" element={
            <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
              <AdminLayout><HodDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/hod/applications" element={
            <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
              <AdminLayout><HodApplications /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/hod/committees" element={
            <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
              <AdminLayout><HodCommittees /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/hod/meetings" element={
            <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
              <AdminLayout><HodMeetings /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/mentor/dashboard" element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <AdminLayout><MentorDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/new" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI']}>
              <AdminLayout><CreateInternshipForm /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/:id/applications" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER']}>
              <AdminLayout><AdminApplicationReview /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/rejected" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HOD']}>
              <AdminLayout><AdminRejected /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/past" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
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
