import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasRole } from './roles';
import type { Role } from '../api/types';

/** Chặn route nếu chưa đăng nhập, hoặc role chưa đủ mức yêu cầu. */
export function ProtectedRoute({ minRole }: { minRole?: Role }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (minRole && !hasRole(role, minRole)) {
    return (
      <div className="empty">
        <h2>Không đủ quyền truy cập</h2>
        <p className="muted">
          Trang này yêu cầu vai trò cao hơn vai trò hiện tại của bạn.
        </p>
      </div>
    );
  }
  return <Outlet />;
}
