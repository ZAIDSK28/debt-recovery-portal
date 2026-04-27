import {
  createContext,
  useCallback,
  useContext,
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
import {
  loginApi,
  resendOtpApi,
  verifyOtpApi,
  type LoginInput,
} from "@/api/auth.api";
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

  if (!raw || raw === "undefined" || raw === "null") {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function getStoredPendingOtp(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PENDING_OTP_KEY);
}

function isLoginSuccessResponse(
  response: LoginResponse
): response is LoginSuccessResponse {
  return "access" in response && "refresh" in response && "user" in response;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => parseStoredUser());
  const [pendingOtpUsername, setPendingOtpUsername] = useState<string | null>(
    () => getStoredPendingOtp()
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (payload: LoginInput): Promise<LoginResult> => {
    setIsLoading(true);

    try {
      const response = await loginApi(payload);

      if (!isLoginSuccessResponse(response)) {
        clearAuthStorage();

        if (typeof window !== "undefined") {
          localStorage.setItem(PENDING_OTP_KEY, payload.username);
        }

        setPendingOtpUsername(payload.username);
        setUser(null);

        return { status: "otp" };
      }

      setAuthStorage(
        response.access,
        response.refresh,
        JSON.stringify(response.user)
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem(PENDING_OTP_KEY);
      }

      setPendingOtpUsername(null);
      setUser(response.user);

      return { status: "authenticated", user: response.user };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (otp: string): Promise<User> => {
      if (!pendingOtpUsername) {
        throw new Error("No pending OTP verification found.");
      }

      setIsLoading(true);

      try {
        const response = await verifyOtpApi({
          username: pendingOtpUsername,
          otp,
        });

        setAuthStorage(
          response.access,
          response.refresh,
          JSON.stringify(response.user)
        );

        if (typeof window !== "undefined") {
          localStorage.removeItem(PENDING_OTP_KEY);
        }

        setPendingOtpUsername(null);
        setUser(response.user);

        return response.user;
      } finally {
        setIsLoading(false);
      }
    },
    [pendingOtpUsername]
  );

  const resendOtp = useCallback(async (): Promise<void> => {
    if (!pendingOtpUsername) {
      throw new Error("No pending OTP verification found.");
    }

    setIsLoading(true);

    try {
      await resendOtpApi(pendingOtpUsername);
    } finally {
      setIsLoading(false);
    }
  }, [pendingOtpUsername]);

  const logout = useCallback(() => {
    clearAuthStorage();

    if (typeof window !== "undefined") {
      localStorage.removeItem(PENDING_OTP_KEY);
    }

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