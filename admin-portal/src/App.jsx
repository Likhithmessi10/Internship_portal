import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useState } from 'react';
import { MONETARY_ENABLED } from './config/features';

// Admin Pages
import AdminLanding from './pages/admin/AdminLanding';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInternshipForm from './pages/admin/CreateInternship';
import AdminApplicationReview from './pages/admin/AdminApplicationReview';
import AdminRejected from './pages/admin/AdminRejected';
import AdminRegister from './pages/admin/AdminRegister';
import AdminPastInternships from './pages/admin/AdminPastInternships';
import CandidateSearch from './pages/admin/CandidateSearch';

import PrtiDashboard from './pages/admin/prti/PrtiDashboard';
import PrtiInterns from './pages/admin/prti/PrtiInterns';
import PrtiMeetings from './pages/admin/prti/PrtiMeetings';
import PrtiReports from './pages/admin/prti/PrtiReports';
import PrtiPermissions from './pages/admin/prti/PrtiPermissions';
import PrtiHealth from './pages/admin/prti/PrtiHealth';
import PrtiAuditLogs from './pages/admin/prti/PrtiAuditLogs';
import PRTICommitteeDashboard from './pages/admin/prti/PRTICommitteeDashboard';
import PRTICommitteeManagement from './pages/admin/prti/PRTICommitteeManagement';
import PrtiBatches from './pages/admin/prti/PrtiBatches';
import PrtiBatchDetail from './pages/admin/prti/PrtiBatchDetail';
import PrtiDeptFieldConfig from './pages/admin/prti/PrtiDeptFieldConfig';
import PrtiLearningInterns from './pages/admin/prti/PrtiLearningInterns';
import PrtiWorkLogs from './pages/admin/prti/PrtiWorkLogs';
import HodDashboard from './pages/admin/hod/HodDashboard';
import HodApplications from './pages/admin/hod/HodApplications';
import HodFieldConfig from './pages/admin/hod/HodFieldConfig';
import HodCommittees from './pages/admin/hod/HodCommittees';
import HodMeetings from './pages/admin/hod/HodMeetings';
import HodSelection from './pages/admin/hod/HodSelection';
import HodProblemStatements from './pages/admin/hod/HodProblemStatements';
import HodReports from './pages/admin/hod/HodReports';
import MentorDashboard from './pages/admin/mentor/MentorDashboard';
import MentorApplications from './pages/admin/mentor/MentorApplications';
import MentorCommittees from './pages/admin/mentor/MentorCommittees';
import MentorMeetings from './pages/admin/mentor/MentorMeetings';
import MentorReports from './pages/admin/mentor/MentorReports';
import Profile from './pages/admin/Profile';

const AdminLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 transition-colors duration-500 font-inter">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={setIsSidebarCollapsed} />
      <main className={`px-8 py-8 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-24' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

// Redirects to role dashboard when a monetary-only route is accessed while MONETARY_ENABLED=false
const MonetaryRoute = ({ children, allowedRoles, fallback }) => {
  if (!MONETARY_ENABLED) return <Navigate to={fallback || '/login'} replace />;
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          {/* Public Admin Routes (Role-Specific) */}
          <Route path="/" element={<AdminLanding />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/prti/login" element={<AdminLogin forcedRole="CE_PRTI" />} />
          <Route path="/prti/register" element={<AdminRegister forcedRole="CE_PRTI" />} />
          <Route path="/hod/login" element={<AdminLogin forcedRole="HOD" />} />
          <Route path="/hod/register" element={<AdminRegister forcedRole="HOD" />} />
          <Route path="/mentor/login" element={<AdminLogin forcedRole="MENTOR" />} />
          <Route path="/mentor/register" element={<AdminRegister forcedRole="MENTOR" />} />
          <Route path="/super-admin/login" element={<AdminLogin forcedRole="ADMIN" />} />
          <Route path="/super-admin/register" element={<AdminRegister forcedRole="ADMIN" />} />

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
            <MonetaryRoute allowedRoles={['CE_PRTI', 'ADMIN']} fallback="/prti/dashboard">
              <PrtiMeetings />
            </MonetaryRoute>
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
          <Route path="/prti/batches" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN', 'HOD']}>
              <AdminLayout><PrtiBatches /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/batches/:id" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN', 'HOD']}>
              <AdminLayout><PrtiBatchDetail /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/dept-config" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiDeptFieldConfig /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/learning-interns" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiLearningInterns /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/work-logs" element={
            <ProtectedRoute allowedRoles={['CE_PRTI', 'ADMIN']}>
              <AdminLayout><PrtiWorkLogs /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/prti/committee" element={
            <MonetaryRoute allowedRoles={['CE_PRTI', 'COMMITTEE_MEMBER', 'ADMIN', 'HOD', 'MENTOR']} fallback="/prti/dashboard">
              <PRTICommitteeDashboard />
            </MonetaryRoute>
          } />
          <Route path="/prti/committees/manage" element={
            <MonetaryRoute allowedRoles={['CE_PRTI', 'ADMIN']} fallback="/prti/dashboard">
              <PRTICommitteeManagement />
            </MonetaryRoute>
          } />
          <Route path="/hod/dashboard" element={
            <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
              <AdminLayout><HodDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/hod/applications" element={
            <ProtectedRoute allowedRoles={['HOD', 'CE_PRTI', 'ADMIN']}>
              <AdminLayout><HodApplications /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/hod/committees" element={
            <MonetaryRoute allowedRoles={['HOD', 'ADMIN', 'CE_PRTI']} fallback="/hod/dashboard">
              <HodCommittees />
            </MonetaryRoute>
          } />
          <Route path="/committees" element={
            <MonetaryRoute allowedRoles={['ADMIN', 'CE_PRTI']} fallback="/prti/dashboard">
              <HodCommittees />
            </MonetaryRoute>
          } />
          <Route path="/hod/selection" element={
            <MonetaryRoute allowedRoles={['HOD', 'CE_PRTI', 'ADMIN']} fallback="/hod/dashboard">
              <HodSelection />
            </MonetaryRoute>
          } />
          <Route path="/hod/meetings" element={
            <MonetaryRoute allowedRoles={['HOD', 'CE_PRTI', 'ADMIN']} fallback="/hod/dashboard">
              <HodMeetings />
            </MonetaryRoute>
          } />
          <Route path="/hod/field-config" element={
            <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
              <AdminLayout><HodFieldConfig /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/hod/problem-statements" element={
            <MonetaryRoute allowedRoles={['HOD', 'ADMIN', 'CE_PRTI']} fallback="/hod/dashboard">
              <HodProblemStatements />
            </MonetaryRoute>
          } />
          <Route path="/hod/reports" element={
            <ProtectedRoute allowedRoles={['HOD', 'ADMIN', 'CE_PRTI']}>
              <AdminLayout><HodReports /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/mentor/dashboard" element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <AdminLayout><MentorDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/mentor/applications" element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <AdminLayout><MentorApplications /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/mentor/committees" element={
            <MonetaryRoute allowedRoles={['MENTOR', 'ADMIN']} fallback="/mentor/dashboard">
              <MentorCommittees />
            </MonetaryRoute>
          } />
          <Route path="/mentor/meetings" element={
            <MonetaryRoute allowedRoles={['MENTOR', 'ADMIN']} fallback="/mentor/dashboard">
              <MentorMeetings />
            </MonetaryRoute>
          } />
          <Route path="/mentor/reports" element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <AdminLayout><MentorReports /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/new" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI', 'HOD']}>
              <AdminLayout><CreateInternshipForm /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/internships/:id/applications" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER']}>
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
          <Route path="/admin/search" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI', 'HOD']}>
              <AdminLayout><CandidateSearch /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER']}>
              <AdminLayout><Profile /></AdminLayout>
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
