/**
 * TypeScript types for AI Shopping Assistant chat feature
 */

export interface ChatConversation {
  id: string;
  userId: string | null;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageMetadata {
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: Array<{ url: string; order: number }>;
  }>;
  searchCriteria?: {
    category?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    keywords?: string;
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: ChatMessageMetadata;
  createdAt: string;
}

export interface ChatContextData {
  userProfile?: {
    name: string;
    email: string;
    role: string;
  };
  recentOrders?: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      productName: string;
      quantity: number;
    }>;
  }>;
  productResults?: Array<{
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    category: string;
    description: string;
    images: Array<{ url: string; order: number }>;
  }>;
}
