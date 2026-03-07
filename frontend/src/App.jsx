import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfileForm from './pages/StudentProfileForm';
import InternshipList from './pages/InternshipList';
import InternshipApplication from './pages/InternshipApplication';

import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInternshipForm from './pages/admin/CreateInternship';
import AdminApplicationReview from './pages/admin/AdminApplicationReview';

const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow bg-background p-6">
      {children}
    </main>
    <footer className="bg-secondary text-gray-400 p-4 text-center text-sm">
      &copy; {new Date().getFullYear()} APTRANSCO. All rights reserved.
    </footer>
  </div>
);

const Home = () => (
  <div className="max-w-4xl mx-auto text-center mt-12 mb-12">
    <h2 className="text-4xl font-extrabold text-secondary mb-4">Launch Your Career with APTRANSCO</h2>
    <p className="text-lg text-muted mb-8">Apply for prestigious internships, get automatically evaluated, and track your application status in real-time.</p>
    <div className="flex gap-4 justify-center">
      <a href="/register" className="btn-primary text-lg px-8 py-3">Register Now</a>
      <a href="/login" className="btn-secondary text-lg px-8 py-3">Login to Dashboard</a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/profile/edit" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfileForm />
              </ProtectedRoute>
            } />


            {/* Shared Protected Routes */}
            <Route path="/internships" element={
              <ProtectedRoute>
                <InternshipList />
              </ProtectedRoute>
            } />
            <Route path="/internships/:id/apply" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <InternshipApplication />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/internships/new" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CreateInternshipForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/internships/:id/applications" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminApplicationReview />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
