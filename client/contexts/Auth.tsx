import axiosInstance from "@/servers/api";
import { AuthCredentials, AuthResponse } from "@/types/auth";
import { User } from "@/types/user";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  user: User | null;
  users: User[];
  fetchUsers: () => Promise<void>;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  deleteUser: (id: string) => Promise<void>;
  register: (credential: {
    username: string;
    password: string;
    role: string;
  }) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync("user");
        console.log(storedUser);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error loading user from SecureStore:", error);
      }
    };
    loadUser();
  }, []);

  const login = async (credentials: AuthCredentials) => {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      setUser(response.data.user);
      await SecureStore.setItemAsync(
        "user",
        JSON.stringify(response.data.user)
      );
      console.log(response.data);
      await SecureStore.setItemAsync("token", response.data.token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (credentials: {
    username: string;
    password: string;
    role: string;
  }) => {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/users",
        credentials
      );
      // setUser(response.data.user);
      await SecureStore.setItemAsync(
        "user",
        JSON.stringify(response.data.user)
      );
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get<User[]>("/users");
      setUsers(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      const filterUsers = users.filter((user) => user._id !== id);
      setUsers(filterUsers);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await SecureStore.deleteItemAsync("user");
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        fetchUsers,
        login,
        logout,
        register,
        deleteUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
