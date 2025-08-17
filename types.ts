export enum Sender {
  User = "user",
  AI = "ai",
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  imageUrl?: string;
  fileInfo?: { name: string; type: string; size: number };
  fileData?: File; // Añadido para poder pasar el archivo real a los servicios
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
  personality: AIPersonality;
  userProfile?: string;
  summary?: ConversationSummary;
}

export interface ConversationSummary {
  id: string;
  conversationId: string;
  summary: string;
  messageCount: number;
  lastUpdated: number;
  version: number;
  topics?: string[];
}

export type AIPersonality = "flash" | "developer";

export const PERSONALITY_ORDER: AIPersonality[] = ["flash", "developer"];

export interface AIPersonalityConfig {
  name: string;
  provider: "google" | "openai"; // Ahora la app conoce dos proveedores
  model: string;
  type: "chat" | "image" | "rag";
  systemInstruction: string;
  welcomeMessage: string;
}

const flashSystemInstruction =
  "Eres un asistente rápido y útil. Responde de forma clara y directa. Para matemáticas usa LaTeX entre $ o $$. Cuando incluyas código usa bloques markdown con el lenguaje. Si buscas algo en internet, menciona las fuentes al final.";

export const PERSONALITIES: Record<AIPersonality, AIPersonalityConfig> = {
  flash: {
    name: "Modelo Flash",
    provider: "google",
    model: "gemini-1.5-flash",
    type: "chat",
    systemInstruction: flashSystemInstruction,
    welcomeMessage: "Hola! ¿En qué te ayudo?",
  },
  developer: {
    name: "Modelo Desarrollador",
    provider: "openai",
    model: "gpt-4o-mini",
    type: "chat",
    systemInstruction:
      "Eres un programador con experiencia. Ayuda con código, debugging y arquitectura. Usa markdown para el código y sé directo en las respuestas.",
    welcomeMessage: "Hey! ¿Qué vamos a programar?",
  },
};
