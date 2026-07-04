import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { DevicesPage } from './pages/DevicesPage';
import { ControlPage } from './pages/ControlPage';
import { AlertsPage } from './pages/AlertsPage';
import { AuditPage } from './pages/AuditPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Cần đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="telemetry" element={<TelemetryPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="control" element={<ControlPage />} />
          <Route path="alerts" element={<AlertsPage />} />
        </Route>
      </Route>

      {/* Cần vai trò ADMIN trở lên */}
      <Route element={<ProtectedRoute minRole="ADMIN" />}>
        <Route element={<Layout />}>
          <Route path="audit" element={<AuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
