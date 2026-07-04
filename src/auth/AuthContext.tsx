import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as apiEndpoints from '../api/endpoints';
import { tokenStore } from '../api/tokenStore';
import type { Role } from '../api/types';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = tokenStore.get();
  const [role, setRole] = useState<Role | null>(initial.role);
  const [username, setUsername] = useState<string | null>(initial.username);
  const [authed, setAuthed] = useState<boolean>(tokenStore.isAuthenticated());

  const login = useCallback(async (user: string, password: string) => {
    const res = await apiEndpoints.login({ username: user, password });
    tokenStore.setSession({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      role: res.role,
      username: user,
    });
    setRole(res.role);
    setUsername(user);
    setAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    const rt = tokenStore.getRefreshToken();
    if (rt) {
      try {
        await apiEndpoints.logout(rt);
      } catch {
        // kể cả logout server lỗi, vẫn xoá phiên client
      }
    }
    tokenStore.clear();
    setRole(null);
    setUsername(null);
    setAuthed(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated: authed, role, username, login, logout }),
    [authed, role, username, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}
