import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import './LoginPage.css';

// Tài khoản seed local (LocalDevSeed.java) — mật khẩu 'changeme'. Chỉ để demo.
const SEED_USERS = ['admin', 'manager', 'operator', 'tech', 'user'];

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('changeme');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">🏢</div>
        <h1 className="login-title">IoT Office Dashboard</h1>
        <p className="login-sub">
          Giám sát & điều khiển hệ thống văn phòng thông minh
        </p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            Tên đăng nhập
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            Mật khẩu
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? <span className="spinner" /> : 'Đăng nhập'}
          </button>
        </form>

        <div className="seed-hint">
          Tài khoản demo (mật khẩu <code>changeme</code>) — bấm để điền nhanh:
          <div style={{ marginTop: 6 }}>
            {SEED_USERS.map((u) => (
              <span
                key={u}
                className="seed-chip"
                onClick={() => {
                  setUsername(u);
                  setPassword('changeme');
                }}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
