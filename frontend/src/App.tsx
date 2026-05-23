import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Layout } from '@/components/layout/Layout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';

// Placeholder cho các trang
import { Survey } from '@/pages/user/Survey';
import { Result } from '@/pages/user/Result';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminDetail } from '@/pages/admin/Detail';
import { AdminQuestions } from '@/pages/admin/Questions';
import { AdminAppendixIII } from '@/pages/admin/AppendixIII';
import { AdminScoreConfig } from '@/pages/admin/ScoreConfig';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: ('user'|'admin')[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
}

// Redirect tương thích từ route singular cũ sang plural mới
function RedirectAssessmentDetail() {
  const { id } = useParams();
  return <Navigate to={`/admin/assessments/${id ?? ''}`} replace />;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Có thể làm màn splash screen
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} /> : <Register />} />

      {/* User Routes - dùng Layout chuẩn cho người dùng */}
      <Route element={<Layout />}>
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Survey />
          </ProtectedRoute>
        } />
        <Route path="/result" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Result />
          </ProtectedRoute>
        } />
      </Route>

      {/* Admin Routes - dùng AdminLayout (sidebar quản trị) */}
      <Route element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/assessments" element={<AdminDashboard />} />
        <Route path="/admin/assessments/:id" element={<AdminDetail />} />
        {/* Tương thích ngược cho link cũ /admin/assessment/:id */}
        <Route path="/admin/assessment/:id" element={<RedirectAssessmentDetail />} />
        <Route path="/admin/questions" element={<AdminQuestions />} />
        <Route path="/admin/appendix" element={<AdminAppendixIII />} />
        <Route path="/admin/score-config" element={<AdminScoreConfig />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
