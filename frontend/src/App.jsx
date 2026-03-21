import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from './components/StudentLayout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Student Pages
import Login from './pages/student/Login';
import Register from './pages/student/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfileForm from './pages/student/StudentProfileForm';
import InternshipList from './pages/student/InternshipList';
import InternshipApplication from './pages/student/InternshipApplication';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student/register" element={<Register />} />

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
