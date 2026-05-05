/**
 * Context builder utility for AI Shopping Assistant
 * Builds personalized context for OpenAI requests based on user profile, orders, and product search
 */

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { searchProducts, extractSearchCriteria } from "@/lib/ai/productSearch";
import type { ChatContextData } from "@/types/chat";

/**
 * Build context for OpenAI request
 * @param userId - User ID for authenticated users, null for guests
 * @param sessionId - Session ID for all users
 * @param message - User's current message
 * @returns Formatted context string for OpenAI
 */
export async function buildContext(
  userId: string | null,
  sessionId: string,
  message: string
): Promise<string> {
  const supabase = getSupabaseServiceClient();
  const contextData: ChatContextData = {};

  // Build user profile context for authenticated users
  if (userId) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", userId)
        .single();

      if (profile) {
        contextData.userProfile = {
          name: profile.full_name || "Customer",
          email: profile.email || "",
          role: profile.role || "customer",
        };
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }

    // Build recent orders context for authenticated users
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: orders } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          created_at,
          order_items (
            product_name,
            quantity
          )
        `)
        .eq("user_id", userId)
        .gte("created_at", ninetyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(3);

      if (orders && orders.length > 0) {
        contextData.recentOrders = orders.map((order) => ({
          id: order.id,
          status: order.status,
          totalAmount: order.total_amount,
          createdAt: order.created_at,
          items: (order.order_items || []).map((item: any) => ({
            productName: item.product_name,
            quantity: item.quantity,
          })),
        }));
      }
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    }
  }

  // Extract search criteria and search for products if applicable
  const searchCriteria = extractSearchCriteria(message);
  const hasSearchIntent =
    searchCriteria.category ||
    searchCriteria.color ||
    searchCriteria.keywords ||
    searchCriteria.minPrice !== undefined ||
    searchCriteria.maxPrice !== undefined;

  if (hasSearchIntent) {
    try {
      const products = await searchProducts({ ...searchCriteria, limit: 6 });
      if (products.length > 0) {
        contextData.productResults = products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
          category: product.category,
          description: product.description,
          images: product.images,
        }));
      }
    } catch (error) {
      console.error("Error searching products:", error);
    }
  }

  // Format context as structured text
  return formatContext(contextData, message);
}

/**
 * Format context data as structured text for OpenAI
 * @param contextData - Context data object
 * @param message - User's current message
 * @returns Formatted context string
 */
function formatContext(contextData: ChatContextData, message: string): string {
  const sections: string[] = [];

  // User profile section
  if (contextData.userProfile) {
    sections.push(
      `User Profile:\n- Name: ${contextData.userProfile.name}\n- Email: ${contextData.userProfile.email}`
    );
  }

  // Recent orders section
  if (contextData.recentOrders && contextData.recentOrders.length > 0) {
    const ordersText = contextData.recentOrders
      .map((order) => {
        const itemsText = order.items
          .map((item) => `${item.productName} (x${item.quantity})`)
          .join(", ");
        return `- Order #${order.id.slice(0, 8)}: ${itemsText}, $${order.totalAmount.toFixed(2)}, Status: ${order.status}`;
      })
      .join("\n");
    sections.push(`Recent Orders:\n${ordersText}`);
  }

  // Product search results section
  if (contextData.productResults && contextData.productResults.length > 0) {
    const productsText = contextData.productResults
      .map((product) => {
        const imageUrl = product.images[0]?.url || "No image";
        return `- ${product.name}: $${product.basePrice.toFixed(2)}, Category: ${product.category}, Slug: ${product.slug}`;
      })
      .join("\n");
    sections.push(`Product Search Results:\n${productsText}`);
  }

  // Current request section
  sections.push(`Current Request:\n${message}`);

  // Join all sections with double newlines
  const fullContext = sections.join("\n\n");

  // Ensure context stays within token budget (approximately 2000 tokens = 8000 characters)
  if (fullContext.length > 8000) {
    return fullContext.substring(0, 8000) + "...[truncated]";
  }

  return fullContext;
}
