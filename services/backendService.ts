import {
  GoogleGenerativeAI,
  GenerateContentResult,
  SystemInstruction,
} from "@google/generative-ai";
import { fileToGenerativePart } from "./geminiService";

function getGoogleAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "La clave de API de Gemini (VITE_GEMINI_API_KEY) no está configurada.",
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function analyzeFileWithBackend(
  prompt: string,
  file: File,
  systemInstruction: SystemInstruction,
): Promise<GenerateContentResult> {
  try {
    const genAI = getGoogleAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: systemInstruction,
    });

    // función auxiliar para convertir el archivo
    const filePart = await fileToGenerativePart(file);

    const fullPrompt =
      prompt ||
      "Analiza esta imagen con cuidado. Si contiene ejercicios matemáticos, identifica exactamente qué ejercicio y inciso me están pidiendo resolver. Lee bien los números de ejercicio. Si es un problema de matemáticas, resuélvelo paso a paso usando las fórmulas correctas. Para matrices 3x3 calcula el determinante usando cofactores o regla de Sarrus.";

    // Generate content in streaming with the prompt and the file
    return model.generateContentStream([fullPrompt, filePart]);
  } catch (error) {
    console.error("Error al analizar el archivo:", error);

    let errorMessage = "Error desconocido al procesar el archivo.";
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage =
          "Error de configuración: Clave de API no válida o no configurada.";
      } else if (error.message.includes("quota")) {
        errorMessage =
          "Error de cuota: Se ha excedido el límite de la API de Gemini.";
      } else if (
        error.message.includes("400") ||
        error.message.includes("Malformed") ||
        error.message.includes("UNSUPPORTED_FILE_FORMAT")
      ) {
        errorMessage =
          "Formato de archivo no soportado o el archivo puede estar corrupto.";
      } else {
        errorMessage = `Error al procesar el archivo: ${error.message}`;
      }
    }
    throw new Error(errorMessage);
  }
}
