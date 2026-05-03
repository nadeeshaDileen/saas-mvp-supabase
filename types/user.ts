export interface AuthSession {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
  } | null;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Profile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  shippingAddress: ShippingAddress | null;
  role: "customer" | "store_owner";
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string;
  phone?: string;
  shippingAddress?: ShippingAddress | null;
}

export interface ApiError {
  message: string;
  code?: string;
}
