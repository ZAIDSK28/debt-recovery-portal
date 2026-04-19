// src/context/AuthContext.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthStorage,
  getStoredUser,
  PENDING_OTP_KEY,
  setAuthStorage,
} from "@/api/axiosInstance";
import { loginApi, resendOtpApi, verifyOtpApi, type LoginInput } from "@/api/auth.api";
import type { LoginResponse, LoginSuccessResponse, User } from "@/types";

type LoginResult =
  | { status: "otp" }
  | { status: "authenticated"; user: User };

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDRA: boolean;
  isLoading: boolean;
  pendingOtpUsername: string | null;
  login: (payload: LoginInput) => Promise<LoginResult>;
  verifyOtp: (otp: string) => Promise<User>;
  resendOtp: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseStoredUser(): User | null {
  const raw = getStoredUser();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function isLoginSuccessResponse(response: LoginResponse): response is LoginSuccessResponse {
  return "access" in response && "refresh" in response && "user" in response;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingOtpUsername, setPendingOtpUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoredUser = parseStoredUser();
    const restoredPendingOtp = localStorage.getItem(PENDING_OTP_KEY);

    setUser(restoredUser);
    setPendingOtpUsername(restoredPendingOtp);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: LoginInput): Promise<LoginResult> => {
    clearAuthStorage();
    setUser(null);
    setPendingOtpUsername(null);

    const response = await loginApi(payload);

    if (!isLoginSuccessResponse(response)) {
      localStorage.setItem(PENDING_OTP_KEY, payload.username);
      setPendingOtpUsername(payload.username);
      return { status: "otp" };
    }

    setAuthStorage(response.access, response.refresh, JSON.stringify(response.user));
    localStorage.removeItem(PENDING_OTP_KEY);
    setPendingOtpUsername(null);
    setUser(response.user);

    return { status: "authenticated", user: response.user };
  }, []);

  const verifyOtp = useCallback(
    async (otp: string): Promise<User> => {
      if (!pendingOtpUsername) {
        throw new Error("No pending OTP verification found.");
      }

      const response = await verifyOtpApi({
        username: pendingOtpUsername,
        otp,
      });

      setAuthStorage(response.access, response.refresh, JSON.stringify(response.user));
      localStorage.removeItem(PENDING_OTP_KEY);
      setPendingOtpUsername(null);
      setUser(response.user);

      return response.user;
    },
    [pendingOtpUsername]
  );

  const resendOtp = useCallback(async () => {
    if (!pendingOtpUsername) {
      throw new Error("No pending OTP verification found.");
    }

    await resendOtpApi(pendingOtpUsername);
  }, [pendingOtpUsername]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setPendingOtpUsername(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isDRA: user?.role === "dra",
      isLoading,
      pendingOtpUsername,
      login,
      verifyOtp,
      resendOtp,
      logout,
    }),
    [user, isLoading, pendingOtpUsername, login, verifyOtp, resendOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}