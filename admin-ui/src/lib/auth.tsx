import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api } from "@/lib/api";
import { initials } from "@/lib/utils";

type AuthContextValue = {
  token: string | null;
  adminName: string;
  adminInitials: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  handleAuthError: (error: unknown) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("c2r_admin_token"));
  const [adminName, setAdminName] = useState(
    () => localStorage.getItem("c2r_admin_name") || "Admin",
  );
  const [loading, setLoading] = useState(!!localStorage.getItem("c2r_admin_token"));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .stats()
      .then(() => setLoading(false))
      .catch(() => {
        localStorage.removeItem("c2r_admin_token");
        localStorage.removeItem("c2r_admin_name");
        setToken(null);
        setLoading(false);
      });
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem("c2r_admin_token");
    localStorage.removeItem("c2r_admin_name");
    setToken(null);
    setAdminName("Admin");
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    const name = data.admin?.name || email.split("@")[0] || "Admin";
    localStorage.setItem("c2r_admin_token", data.token);
    localStorage.setItem("c2r_admin_name", name);
    setToken(data.token);
    setAdminName(name);
  }, []);

  const handleAuthError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return true;
      }
      return false;
    },
    [logout],
  );

  const value = useMemo(
    () => ({
      token,
      adminName,
      adminInitials: initials(adminName),
      loading,
      login,
      logout,
      handleAuthError,
    }),
    [token, adminName, loading, login, logout, handleAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
