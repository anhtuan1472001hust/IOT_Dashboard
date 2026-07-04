import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasRole, ROLE_LABEL } from '../auth/roles';
import type { Role } from '../api/types';
import './Layout.css';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  minRole?: Role;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Giám sát',
    items: [
      { to: '/', label: 'Tổng quan', icon: '🗺️' },
      { to: '/telemetry', label: 'Biểu đồ & thống kê', icon: '📈' },
      { to: '/devices', label: 'Thiết bị', icon: '🔌' },
    ],
  },
  {
    section: 'Vận hành',
    items: [
      { to: '/control', label: 'Điều khiển', icon: '🎛️' },
      { to: '/alerts', label: 'Cảnh báo', icon: '🚨' },
    ],
  },
  {
    section: 'Bảo mật',
    items: [
      { to: '/audit', label: 'Nhật ký kiểm toán', icon: '📜', minRole: 'ADMIN' },
    ],
  },
];

const PAGE_TITLE: Record<string, string> = {
  '/': 'Tổng quan hệ thống',
  '/telemetry': 'Biểu đồ & thống kê',
  '/devices': 'Danh sách thiết bị',
  '/control': 'Điều khiển thiết bị',
  '/alerts': 'Cảnh báo & phát hiện bất thường',
  '/audit': 'Nhật ký kiểm toán',
};

export function Layout() {
  const { role, username, logout } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLE[location.pathname] ?? 'IoT Dashboard';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">🏢</div>
          <div>
            <div className="brand-name">IoT Office</div>
            <div className="brand-sub">Giám sát & Điều khiển</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((group) => {
            const visible = group.items.filter(
              (it) => !it.minRole || hasRole(role, it.minRole)
            );
            if (visible.length === 0) return null;
            return (
              <div key={group.section}>
                <div className="nav-section">{group.section}</div>
                {visible.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.to === '/'}
                    className={({ isActive }) =>
                      `nav-link${isActive ? ' active' : ''}`
                    }
                  >
                    <span className="nav-icon">{it.icon}</span>
                    {it.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="spacer" />
          <div className="user-chip">
            <span className="avatar">{username?.[0] ?? '?'}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{username}</div>
              <div className="dim" style={{ fontSize: 11 }}>
                {role ? ROLE_LABEL[role] : ''}
              </div>
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => logout()}>
            Đăng xuất
          </button>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
