// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { SemesterProvider } from './contexts/SemesterContext'
import { ToastContainer, toast } from 'react-toastify'
import { Toaster } from 'react-hot-toast'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect } from 'react'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Curriculum from './pages/Curriculum'
import Calendar from './pages/Calendar'
import Subjects from './pages/Subjects'
import Attendance from './pages/Attendance'
import AcademicAssessment from './pages/AcademicAssessment'
import Schedule from './pages/Schedule'
import Evaluations from './pages/Evaluations'
import StudentAssessment from './pages/StudentAssessment'
import DashboardLayout from './layouts/DashboardLayout'
import UserManagement from './pages/UserManagement'
import SubjectManagement from './pages/SubjectManagement'
import ClassManagement from './pages/ClassManagement'
import SubjectDetail from './pages/SubjectDetail'
import StudentManagement from './pages/StudentManagement'
import AcademicYearManagement from './pages/AcademicYearManagement'


function App() {
  const { currentUser, userRole, logout } = useAuth()

  // Effect to listen for auth errors and display notifications
  useEffect(() => {
    const handleAuthError = (event) => {
      toast.error(event.detail.message || 'Authentication error. Please log in again.');
      // Optional: Auto logout
      logout();
    };

    // Listen for auth error events
    window.addEventListener('auth:error', handleAuthError);

    // Check token expiration on mount
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Try to decode the token
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expiration = tokenPayload.exp * 1000; // Convert to milliseconds
        const now = Date.now();

        if (expiration < now) {
          toast.error('Your session has expired. Please log in again.');
          logout();
        } else {
          // If token is about to expire in less than 5 minutes, show warning
          const fiveMinutes = 5 * 60 * 1000;
          if (expiration - now < fiveMinutes) {
            toast.warning('Your session will expire soon. Please refresh your token.');
          }
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    }

    return () => {
      window.removeEventListener('auth:error', handleAuthError);
    };
  }, [logout]);

  // Protected route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />
    }

    return children
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin', 'wali_kelas', 'orang_tua', 'kepala_sekolah']}>
            <SemesterProvider>
              <DashboardLayout />
            </SemesterProvider>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />

          {/* Common Routes */}
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="subjects" element={
            <ProtectedRoute>
              <SubjectManagement />
            </ProtectedRoute>
          } />
          <Route path="subjects/:subjectId" element={
            <ProtectedRoute>
              <SubjectDetail />
            </ProtectedRoute>
          } />

          {/* Parent & Teacher & Admin Routes */}
          <Route path="calendar" element={
            <ProtectedRoute allowedRoles={['orang_tua', 'wali_kelas', 'admin']}>
              <Calendar />
            </ProtectedRoute>
          } />

          <Route path="attendance" element={
            <ProtectedRoute allowedRoles={['orang_tua', 'wali_kelas', 'admin']}>
              <Attendance />
            </ProtectedRoute>
          } />

          <Route path="schedule" element={
            <ProtectedRoute allowedRoles={['orang_tua', 'wali_kelas', 'admin']}>
              <Schedule />
            </ProtectedRoute>
          } />

          <Route path="evaluation-notes" element={
            <ProtectedRoute allowedRoles={['orang_tua', 'wali_kelas', 'admin']}>
              <Evaluations />
            </ProtectedRoute>
          } />

          {/* Parent & Teacher Routes */}
          <Route path="academic-assessment" element={
            <ProtectedRoute allowedRoles={['orang_tua', 'wali_kelas']}>
              <AcademicAssessment />
            </ProtectedRoute>
          } />

          {/* Admin-only Routes */}
          <Route path="user-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="student-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StudentManagement />
            </ProtectedRoute>
          } />

          <Route path="academic-year" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AcademicYearManagement />
            </ProtectedRoute>
          } />

          {/* Principal-only Routes */}
          <Route path="student-assessment" element={
            <ProtectedRoute allowedRoles={['kepala_sekolah']}>
              <StudentAssessment />
            </ProtectedRoute>
          } />

          <Route path="classes" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassManagement />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
