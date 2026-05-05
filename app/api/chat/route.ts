/**
 * AI Shopping Assistant Chat API Route
 * Handles chat messages, OpenAI streaming, and conversation management
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { buildContext } from "@/lib/ai/contextBuilder";
import { extractSearchCriteria, searchProducts } from "@/lib/ai/productSearch";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChatRequest {
  message: string;
  conversationId?: string;
  sessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: ChatRequest = await request.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    if (!body.sessionId || typeof body.sessionId !== "string") {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Validate sessionId format (UUID)
    if (!UUID_REGEX.test(body.sessionId)) {
      return NextResponse.json(
        { error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    // Validate conversationId format if provided
    if (body.conversationId && !UUID_REGEX.test(body.conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID format" },
        { status: 400 }
      );
    }

    // Authenticate user (may be null for guests)
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || null;

    // Use service client for database operations
    const serviceSupabase = getSupabaseServiceClient();

    // Get or create conversation
    let conversationId = body.conversationId;

    if (conversationId) {
      // Validate conversation ownership
      const { data: conversation, error: convError } = await serviceSupabase
        .from("chat_conversations")
        .select("id, user_id, session_id")
        .eq("id", conversationId)
        .single();

      if (convError || !conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      // Check ownership: conversation belongs to user OR session
      const ownsConversation =
        (userId && conversation.user_id === userId) ||
        conversation.session_id === body.sessionId;

      if (!ownsConversation) {
        return NextResponse.json(
          { error: "Unauthorized access to conversation" },
          { status: 403 }
        );
      }
    } else {
      // Create new conversation
      const { data: newConversation, error: createError } =
        await serviceSupabase
          .from("chat_conversations")
          .insert({
            user_id: userId,
            session_id: body.sessionId,
          })
          .select()
          .single();

      if (createError || !newConversation) {
        console.error("Error creating conversation:", createError);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;
    }

    // Build context for personalized responses
    const context = await buildContext(userId, body.sessionId, body.message);

    // Load conversation history (last 20 messages)
    const { data: historyMessages } = await serviceSupabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Prepare messages array for OpenAI
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...(historyMessages || []).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: body.message },
    ];

    // Add context to the last user message if available
    if (context) {
      messages[messages.length - 1].content = `${context}\n\n${body.message}`;
    }

    // Extract search criteria for metadata
    const searchCriteria = extractSearchCriteria(body.message);
    const hasSearchIntent =
      searchCriteria.category ||
      searchCriteria.color ||
      searchCriteria.keywords ||
      searchCriteria.minPrice !== undefined ||
      searchCriteria.maxPrice !== undefined;

    // Search for products if search intent detected
    let productResults = null;
    if (hasSearchIntent) {
      try {
        const products = await searchProducts({ ...searchCriteria, limit: 6 });
        if (products.length > 0) {
          productResults = products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            basePrice: p.basePrice,
            images: p.images,
          }));
        }
      } catch (error) {
        console.error("Product search error:", error);
        // Continue without products (graceful degradation)
      }
    }

    // Save user message to database
    const { error: userMsgError } = await serviceSupabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: body.message,
        metadata: hasSearchIntent
          ? { searchCriteria, products: productResults }
          : null,
      });

    if (userMsgError) {
      console.error("Error saving user message:", userMsgError);
    }

    // Stream response from OpenAI with retry logic
    let attempt = 0;
    const maxRetries = 2;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      try {
        const result = streamText({
          model: openai("gpt-4o-mini"),
          messages,
          temperature: 0.7,
          async onFinish({ text }) {
            // Save assistant response to database
            await serviceSupabase.from("chat_messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: text,
              metadata: productResults ? { products: productResults } : null,
            });

            // Update conversation timestamp
            await serviceSupabase
              .from("chat_conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          },
        });

        // Return streaming response with conversation ID in headers
        return result.toTextStreamResponse({
          headers: {
            "X-Conversation-Id": conversationId,
          },
        });
      } catch (error: any) {
        lastError = error;
        attempt++;

        // Check if error is retryable (rate limit or timeout)
        const isRateLimitError =
          error?.status === 429 || error?.message?.includes("rate limit");
        const isTimeoutError =
          error?.message?.includes("timeout") ||
          error?.message?.includes("ETIMEDOUT");

        if ((isRateLimitError || isTimeoutError) && attempt <= maxRetries) {
          // Exponential backoff: 1s, 2s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.log(`Retrying OpenAI request (attempt ${attempt})...`);
          continue;
        }

        // Non-retryable error or max retries exceeded
        break;
      }
    }

    // If we get here, all retries failed
    console.error("OpenAI request failed after retries:", lastError);

    // Return user-friendly error message
    if (lastError?.message?.includes("rate limit")) {
      return NextResponse.json(
        {
          error:
            "I'm experiencing high demand right now. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    if (lastError?.message?.includes("timeout")) {
      return NextResponse.json(
        {
          error:
            "This is taking longer than expected. Please try again.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error:
          "I'm having trouble connecting right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);

    // Handle specific error types
    if (error?.message?.includes("JSON")) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error:
          "I'm having trouble connecting right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
