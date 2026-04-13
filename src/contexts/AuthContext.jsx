import { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/integrations/api/client";
const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchProfile = async () => {
    try {
      const response = await apiClient.getMe();
      if (response.user) {
        const userData = response.user;
        setUser({
          id: userData.id,
          email: userData.email,
          role: userData.role
        });
        setProfile({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        });
      }
    } catch {
      setUser(null);
      setProfile(null);
      apiClient.clearToken();
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      apiClient.setToken(token);
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);
  const signUp = async (email, password, name, role) => {
    const response = await apiClient.signup(email, password, name, role);
    if (response.user) {
      setUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      });
      setProfile({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role
      });
    }
  };
  const signIn = async (email, password) => {
    const response = await apiClient.signin(email, password);
    if (response.user) {
      setUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      });
      setProfile({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role
      });
    }
  };
  const signOut = async () => {
    apiClient.clearToken();
    setUser(null);
    setProfile(null);
  };
  return <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>;
}
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
export {
  AuthProvider,
  useAuth
};
