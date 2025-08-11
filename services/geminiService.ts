import { GoogleGenerativeAI, ChatSession, GenerativeModel, FunctionDeclarationsTool } from "@google/generative-ai";

// Definición de la herramienta de búsqueda en internet
export const internetSearchTool: FunctionDeclarationsTool = {
  functionDeclarations: [
    {
      name: "internetSearch",
      description: "Busca en internet información en tiempo real sobre un tema específico. Úsalo para eventos recientes, precios, resultados deportivos, etc.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "La consulta de búsqueda precisa para obtener la información."
          }
        },
        required: ["query"]
      }
    }
  ]
};

let genAI: GoogleGenerativeAI | undefined;

function getGoogleAI() {
    if (!genAI) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("La clave de API de Gemini (VITE_GEMINI_API_KEY) no está configurada.");
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

export function startChat(systemInstruction: string, model: string, history?: any[], tools?: FunctionDeclarationsTool[]): ChatSession {
    const genAI = getGoogleAI();
    const generativeModel: GenerativeModel = genAI.getGenerativeModel({ 
        model: model,
        systemInstruction: systemInstruction,
        tools: tools
    });
    
    // Convertir el historial al formato correcto si existe
    const formattedHistory = history ? history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts[0].text }]
    })) : [];
    
    const chatSession = generativeModel.startChat({
        history: formattedHistory,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
        },
    });
    
    return chatSession;
}

/**
 * Generates a single, non-streamed response from the AI.
 * Useful for background tasks like summarizing or analyzing text.
 * @param prompt The text prompt to send to the model.
 * @param model The model to use for generation (ignored, always uses gemini-1.5-flash).
 * @returns The generated text content.
 */
export async function generateContent(prompt: string, model: string): Promise<string> {
    const genAI = getGoogleAI();
    const generativeModel: GenerativeModel = genAI.getGenerativeModel({ 
        model: model
    });
    
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

/**
 * Converts a File object to a GoogleGenerativeAI.Part object.
 * @param file The file to convert.
 * @returns A promise that resolves with the Part object.
 */
export async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; }; }> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: {
      data,
      mimeType: file.type,
    },
  };
}
