export interface ModelInfo {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "groq";
  description?: string;
}

export const SUPPORTED_MODELS: ModelInfo[] = [
  // OpenAI
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable model, optimized for speed",
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "Faster and more capable than GPT-4",
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "Fast and cost-effective",
  },
  // Anthropic
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Balanced performance and speed",
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Most powerful Claude model",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    description: "Fastest and most affordable",
  },
  // Google
  {
    id: "google/gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Advanced reasoning capabilities",
  },
  {
    id: "google/gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Fast and efficient",
  },
  // Groq
  {
    id: "groq/llama-3.1-70b",
    name: "Llama 3.1 70B",
    provider: "groq",
    description: "High-performance open model",
  },
  {
    id: "groq/mixtral-8x7b",
    name: "Mixtral 8x7B",
    provider: "groq",
    description: "Mixture of experts model",
  },
];

export const DEFAULT_MODEL = "openai/gpt-4o";

export function getModelById(id: string): ModelInfo | undefined {
  return SUPPORTED_MODELS.find((model) => model.id === id);
}

export function getModelsByProvider(
  provider: ModelInfo["provider"]
): ModelInfo[] {
  return SUPPORTED_MODELS.filter((model) => model.provider === provider);
}

export function isValidModelId(id: string): boolean {
  return SUPPORTED_MODELS.some((model) => model.id === id);
}
