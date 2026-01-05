import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import { DEFAULT_MODEL } from "../ai/models";

// Create Vercel AI Gateway provider
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function generateConversationTitle(
  userMessage: string,
  assistantMessage: string
): Promise<string> {
  try {
    const { text } = await generateText({
      model: gateway(DEFAULT_MODEL),
      messages: [
        {
          role: "system",
          content:
            "Generate a concise, descriptive title (3-5 words) for this conversation based on the user's question and assistant's response. Return only the title, nothing else.",
        },
        {
          role: "user",
          content: `User: ${userMessage}\n\nAssistant: ${assistantMessage.substring(
            0,
            200
          )}...`,
        },
      ],
      temperature: 0.7,
    });

    const title = text.trim() || "New Chat";
    // Clean up title - remove quotes if present
    return title.replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error("Error generating title:", error);
    // Fallback: use first few words of user message
    const words = userMessage.split(" ").slice(0, 4).join(" ");
    return words.length > 30
      ? words.substring(0, 30) + "..."
      : words || "New Chat";
  }
}
