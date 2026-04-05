import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import CrmPage from './pages/CrmPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Loader from './components/common/Loader';
import { useAppContext } from './context/AppContext';

function ProtectedRoute({ children }) {
  const { authReady, isAuthenticated } = useAppContext();

  if (!authReady) return <Loader label="Checking session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

function PublicOnlyRoute({ children }) {
  const { authReady, isAuthenticated } = useAppContext();

  if (!authReady) return <Loader label="Checking session..." />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <PublicOnlyRoute>
            <AuthLayout />
          </PublicOnlyRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/crm" element={<CrmPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
