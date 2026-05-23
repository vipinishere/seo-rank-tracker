import type { AxiosInstance } from "axios";
import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type Props = {
  children: ReactNode;
};

interface User {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  email: string;
  dialCode?: string;
  mobile?: string;
  profileImage?: string;
  isVerified: boolean;
  country: string;
  status: string;
  plan: string;
  analysisCount?: number;
  lastAnalysisDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  api: AxiosInstance;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    firstname: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9001";

const AppContext = createContext<AppContextType | undefined>(undefined);

export default function AppProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Axios instance with auth header
  const api = axios.create({
    baseURL: BACKEND_URL,
  });

  // Update headers when token changes

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Function for auth

  const loadUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/users/me");
      console.log(data);
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/login`, {
        email,
        password,
      });
      if (res.data.success) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem("token", res.data.accessToken);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (error: unknown) {
      let message = "Login failed";
      if (axios.isAxiosError(error) && error.response) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - accessing possible message from response data
        message = error.response.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message || message;
      }
      return {
        success: false,
        message,
      };
    }
  };

  const register = async (
    firstname: string,
    email: string,
    password: string,
  ) => {
    try {
      const otp = await axios.post(`${BACKEND_URL}/auth/send-code`, {
        email,
        type: "register",
      });

      console.log(otp);
      const res = await axios.post(`${BACKEND_URL}/auth/register`, {
        firstname,
        email,
        password,
        emailVerificationCode: "000000",
      });

      console.log(res);

      if (res.data.success) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem("token", res.data.accessToken);
        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (error: unknown) {
      let message = "Register failed";
      if (axios.isAxiosError(error) && error.response) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - accessing possible message from response data
        message = error.response.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message || message;
      }
      return {
        success: false,
        message,
      };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };
  const value = { user, token, loading, api, login, register, logout };
  return <AppContext.Provider value={value}> {children} </AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
