import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface UserProfile {
  name: string;
  avatarUrl: string;
  bio: string;
}
interface AuthContextType {
  role: string | null;
  login: (role: string) => void;
  userProfile: UserProfile | null;
  fetchUserProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userProfile: null,
  fetchUserProfile: async () => {},
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const login = (newRole: string) => {
    localStorage.setItem("role", newRole);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.clear();
    setRole(null);
    setUserProfile(null);
  };
  const fetchUserProfile = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      const response = await axios.get(`${API_URL}/api/profile/${userId}`);
      setUserProfile(response.data);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  };
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole);
    fetchUserProfile();
  }, []);

  return (
    <AuthContext.Provider
      value={{ role, login, logout, userProfile, fetchUserProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
