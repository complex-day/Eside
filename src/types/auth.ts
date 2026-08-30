export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSessionUser {
  id: string;
  email?: string;
  username?: string;
}

export interface AuthState {
  user: AuthSessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
