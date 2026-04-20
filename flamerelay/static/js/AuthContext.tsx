import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from './api';

interface AuthUser {
  username: string;
  name: string;
  is_superuser: boolean;
  admin_url: string | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  username: string;
  name: string;
  isSuperuser: boolean;
  adminUrl: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  username: '',
  name: '',
  isSuperuser: false,
  adminUrl: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/users/me/');
      if (resp.ok) {
        setUser((await resp.json()) as AuthUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        username: user?.username ?? '',
        name: user?.name ?? '',
        isSuperuser: user?.is_superuser ?? false,
        adminUrl: user?.admin_url ?? null,
        loading,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
