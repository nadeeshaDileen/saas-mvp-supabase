export interface AuthSession {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
  } | null;
}

export interface Profile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: "customer" | "store_owner";
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}
