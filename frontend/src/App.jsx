import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import StudentLayout from './components/StudentLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInternshipForm from './pages/admin/CreateInternship';
import AdminApplicationReview from './pages/admin/AdminApplicationReview';
import AdminRejected from './pages/admin/AdminRejected';
import AdminPastInternships from './pages/admin/AdminPastInternships';

// Student Pages
import Login from './pages/student/Login';
import Register from './pages/student/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfileForm from './pages/student/StudentProfileForm';
import InternshipList from './pages/student/InternshipList'; // Reuse or revamp for students
import InternshipApplication from './pages/student/InternshipApplication';
import LandingPage from './pages/LandingPage';

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
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
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
          <Route path="/admin/internships/past" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout><AdminPastInternships /></AdminLayout>
            </ProtectedRoute>
          } />

          {/* Protected Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentLayout><StudentDashboard /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/profile/edit" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentLayout><StudentProfileForm /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/internships" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentLayout><InternshipList /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/internships/:id/apply" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentLayout><InternshipApplication /></StudentLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
