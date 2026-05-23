import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, clearToken, setToken, type RegisterPayload } from '@/api/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, matKhau: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const user = await authApi.me();
        if (mounted) {
          setState({ user, isLoading: false, error: null });
        }
      } catch (err) {
        clearToken();
        if (mounted) {
          setState({ user: null, isLoading: false, error: null });
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, matKhau: string) => {
    try {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const { token, user } = await authApi.login(email, matKhau);
      setToken(token);
      setState({ user, isLoading: false, error: null });
      
      const origin = location.state?.from?.pathname;
      if (origin) {
        navigate(origin);
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/');
      }
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.',
      }));
      throw err;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const { token, user } = await authApi.register(payload);
      setToken(token);
      setState({ user, isLoading: false, error: null });
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err.message || 'Đăng ký thất bại. Vui lòng thử lại.',
      }));
      throw err;
    }
  };

  const logout = () => {
    clearToken();
    setState({ user: null, isLoading: false, error: null });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
