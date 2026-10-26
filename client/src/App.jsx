import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AcademicManagement from './pages/admin/AcademicManagement';
import ExamOversight from './pages/admin/ExamOversight';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogsPage from './pages/admin/AuditLogsPage';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SyllabusManagement from './pages/teacher/SyllabusManagement';
import SyllabusDetails from './pages/teacher/SyllabusDetails';
import AIQuestionGenerator from './pages/teacher/AIQuestionGenerator';
import QuestionBank from './pages/teacher/QuestionBank';
import ExamBuilder from './pages/teacher/ExamBuilder';
import TeacherExams from './pages/teacher/TeacherExams';
import GradingReview from './pages/teacher/GradingReview';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExams from './pages/student/StudentExams';
import ExamInstructions from './pages/student/ExamInstructions';
import ExamPlayer from './pages/student/ExamPlayer';
import StudentResults from './pages/student/StudentResults';
import ResultDetails from './pages/student/ResultDetails';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to respective dashboard
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
};

// Portal Layout Wrapper with Sidebar & Navbar
const PortalLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

// Index Redirect Component
const IndexRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AdminDashboard /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><UserManagement /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AcademicManagement /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exams"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><ExamOversight /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><SystemSettings /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AuditLogsPage /></PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><TeacherDashboard /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/syllabuses"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><SyllabusManagement /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/syllabuses/:id"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><SyllabusDetails /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/ai-generator"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><AIQuestionGenerator /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/questions"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><QuestionBank /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/create-exam"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><ExamBuilder /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/exams"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><TeacherExams /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/exams/:examId/grading"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <PortalLayout><GradingReview /></PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <PortalLayout><StudentDashboard /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <PortalLayout><StudentExams /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams/:id/instructions"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <PortalLayout><ExamInstructions /></PortalLayout>
                </ProtectedRoute>
              }
            />
            {/* Distraction-Free Exam Player (No sidebar) */}
            <Route
              path="/student/player/:attemptId"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <ExamPlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <PortalLayout><StudentResults /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results/:resultId"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <PortalLayout><ResultDetails /></PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
