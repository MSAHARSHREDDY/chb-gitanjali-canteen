import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  isAdmin?: boolean;
  isTeacher?: boolean;
  isParent?: boolean;
  subscribedPlan?: string;
  planActive?: boolean;
  planDaysRemaining?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.email === "saharshreddym59@gmail.com") {
          parsedUser.isAdmin = true;
        }
        setUser(parsedUser);

        // Fetch latest user data from server asynchronously
        fetch('/api/user', {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
          .then(async res => {
            if (res.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setToken(null);
              toast.error('Your session has expired. Please log in again.');
              throw new Error('Session expired');
            }
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
          })
          .then(data => {
            if (data.user) {
              const latestUser = { ...data.user };
              if (latestUser.email === "saharshreddym59@gmail.com") {
                latestUser.isAdmin = true;
              }
              setUser(latestUser);
              localStorage.setItem('user', JSON.stringify(latestUser));
            }
          })
          .catch(err => {
            if (err.message !== 'Session expired') {
              console.error("Failed to sync user data:", err);
            }
          });
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, []);

  const login = (userData: User, jwtToken: string) => {
    const updatedUser = { ...userData };
    if (updatedUser.email === "saharshreddym59@gmail.com") {
      updatedUser.isAdmin = true;
    }
    setUser(updatedUser);
    setToken(jwtToken);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthModalOpen, openAuthModal, closeAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
