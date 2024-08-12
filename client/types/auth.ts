// types/Auth.ts

import { User } from "./user";

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
