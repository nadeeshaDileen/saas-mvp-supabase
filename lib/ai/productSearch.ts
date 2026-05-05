import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { Product } from "@/types/store";

/**
 * Search products based on AI-extracted criteria
 */
export interface SearchCriteria {
  category?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  keywords?: string;
  limit?: number;
}

export async function searchProducts(criteria: SearchCriteria): Promise<Product[]> {
  const supabase = getSupabaseServiceClient();
  
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active");

  // Apply category filter
  if (criteria.category) {
    query = query.ilike("category", criteria.category);
  }

  // Apply price filters
  if (criteria.minPrice !== undefined) {
    query = query.gte("base_price", criteria.minPrice);
  }
  if (criteria.maxPrice !== undefined) {
    query = query.lte("base_price", criteria.maxPrice);
  }

  // Apply keyword search (name or description)
  if (criteria.keywords) {
    query = query.or(
      `name.ilike.%${criteria.keywords}%,description.ilike.%${criteria.keywords}%`
    );
  }

  // Apply color filter (search in name or description)
  if (criteria.color) {
    query = query.or(
      `name.ilike.%${criteria.color}%,description.ilike.%${criteria.color}%`
    );
  }

  // Limit results
  query = query.limit(criteria.limit || 6);

  const { data, error } = await query;

  if (error) {
    console.error("Product search error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    basePrice: row.base_price,
    category: row.category,
    status: row.status,
    images: row.images || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Extract search criteria from user message using simple keyword matching
 * (AI will help interpret the message, this is a fallback)
 */
export function extractSearchCriteria(message: string): SearchCriteria {
  const lowerMessage = message.toLowerCase();
  const criteria: SearchCriteria = {};

  // Extract category
  if (lowerMessage.includes("men") || lowerMessage.includes("men's")) {
    criteria.category = "MEN";
  } else if (lowerMessage.includes("women") || lowerMessage.includes("women's")) {
    criteria.category = "WOMEN";
  } else if (lowerMessage.includes("kid") || lowerMessage.includes("children")) {
    criteria.category = "KIDS";
  } else if (lowerMessage.includes("accessories") || lowerMessage.includes("accessory")) {
    criteria.category = "ACCESSORIES";
  } else if (lowerMessage.includes("shoe") || lowerMessage.includes("footwear")) {
    criteria.category = "FOOTWEAR";
  } else if (lowerMessage.includes("sale") || lowerMessage.includes("discount")) {
    criteria.category = "SALE";
  }

  // Extract price range
  const priceMatch = lowerMessage.match(/under\s+\$?(\d+)/i);
  if (priceMatch) {
    criteria.maxPrice = parseInt(priceMatch[1]);
  }

  const minPriceMatch = lowerMessage.match(/over\s+\$?(\d+)/i);
  if (minPriceMatch) {
    criteria.minPrice = parseInt(minPriceMatch[1]);
  }

  // Extract color
  const colors = ["black", "white", "red", "blue", "green", "yellow", "pink", "purple", "gray", "brown", "beige", "navy"];
  for (const color of colors) {
    if (lowerMessage.includes(color)) {
      criteria.color = color;
      break;
    }
  }

  // Extract keywords (clothing types)
  const keywords = ["shirt", "t-shirt", "tshirt", "dress", "pants", "jeans", "jacket", "coat", "sweater", "hoodie", "shorts", "skirt"];
  for (const keyword of keywords) {
    if (lowerMessage.includes(keyword)) {
      criteria.keywords = keyword;
      break;
    }
  }

  return criteria;
}

/**
 * Format products for display in chat
 */
export function formatProductsForChat(products: Product[]): string {
  if (products.length === 0) {
    return "I couldn't find any products matching that description. Could you try different keywords or browse our categories?";
  }

  return `I found ${products.length} ${products.length === 1 ? "product" : "products"} for you! 🛍️`;
}
