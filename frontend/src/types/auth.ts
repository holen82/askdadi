/**
 * Authentication types and interfaces
 */

export interface User {
  email: string;
  name?: string;
  userId: string;
  provider: string;
  isAuthenticated: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthError {
  error: string;
  message: string;
}
