import { GoogleGenerativeAI, GenerateContentResult, SystemInstruction } from "@google/generative-ai";
import { fileToGenerativePart } from "./geminiService";

function getGoogleAI() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("La clave de API de Gemini (VITE_GEMINI_API_KEY) no está configurada.");
    }
    return new GoogleGenerativeAI(apiKey);
}

export async function analyzeFileWithBackend(
    prompt: string, 
    file: File, 
    systemInstruction: SystemInstruction
): Promise<GenerateContentResult> {
    try {
        const genAI = getGoogleAI();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest",
            systemInstruction: systemInstruction,
        });

        // Use the robust helper function to convert the file
        const filePart = await fileToGenerativePart(file);
        
        const fullPrompt = prompt || "Analiza este archivo y describe su contenido detalladamente.";

        // Generate content in streaming with the prompt and the file
        return model.generateContentStream([fullPrompt, filePart]);

    } catch (error) {
        console.error('Error al analizar el archivo:', error);
        
        let errorMessage = 'Error desconocido al procesar el archivo.';
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                errorMessage = 'Error de configuración: Clave de API no válida o no configurada.';
            } else if (error.message.includes('quota')) {
                errorMessage = 'Error de cuota: Se ha excedido el límite de la API de Gemini.';
            } else if (error.message.includes('400') || error.message.includes('Malformed') || error.message.includes('UNSUPPORTED_FILE_FORMAT')) {
                 errorMessage = 'Formato de archivo no soportado o el archivo puede estar corrupto.';
            } else {
                errorMessage = `Error al procesar el archivo: ${error.message}`;
            }
        }
        throw new Error(errorMessage);
    }
}