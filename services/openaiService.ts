import { ChatMessage, Sender, AIPersonalityConfig } from '../types';

// Convierte un archivo a formato base64, que es lo que OpenAI necesita para imágenes.
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

// Definimos un tipo para la salida del generador, que puede ser texto o una llamada a herramienta.
export type OpenAIStreamOutput =
  | { type: 'text'; value: string }
  | { type: 'tool_call'; value: { id: string; function: { name: string; arguments: string; } }[] };

// Función principal que se comunica con OpenAI y devuelve la respuesta en tiempo real
export async function* getOpenAIStream(
    config: AIPersonalityConfig,
    history: ChatMessage[],
    userMessage: ChatMessage,
    tools?: any[], // Parámetro para las herramientas
    toolResult?: any[] // BUG FIX: Aceptar un array de resultados de herramientas
): AsyncGenerator<OpenAIStreamOutput> {
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("La clave de API de OpenAI (VITE_OPENAI_API_KEY) no está configurada.");

    // 1. Formatear el historial de chat para la API de OpenAI
    const messages: any[] = history
        .filter(m => m.id !== 'initial-message')
        .map(msg => ({
            role: msg.sender === Sender.User ? 'user' : 'assistant',
            content: msg.text,
        }));

    // Añadimos el mensaje del usuario
    let userContent: any;
    if (userMessage.fileInfo && userMessage.fileData && userMessage.fileInfo.type.startsWith('image/')) {
        const base64Image = await fileToBase64(userMessage.fileData);
        userContent = [{ type: "text", text: userMessage.text }, { type: "image_url", image_url: { url: base64Image } }];
    } else {
        userContent = userMessage.text;
    }
    messages.push({ role: 'user', content: userContent });

    // Si hay un resultado de herramienta, lo añadimos al historial
    if (toolResult && toolResult.length > 0) {
        messages.push(...toolResult); // BUG FIX: Añadir todos los resultados usando spread
    }

    // 2. Construir el cuerpo de la petición
    const body: any = {
        model: config.model,
        messages: [{ role: "system", content: config.systemInstruction }, ...messages],
        stream: true,
    };

    // Añadir herramientas si están disponibles
    if (tools && tools.length > 0) {
        body.tools = tools;
        body.tool_choice = "auto";
    }

    // 3. Realizar la petición a la API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de OpenAI: ${errorData.error?.message || response.statusText}`);
    }

    // 4. Procesar la respuesta que llega por partes (streaming)
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo leer la respuesta del servidor.');
    
    const decoder = new TextDecoder();
    let toolCalls: any[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

        for (const line of lines) {
            const jsonStr = line.replace('data: ', '');
            if (jsonStr === '[DONE]') continue;

            try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices[0]?.delta;

                if (delta?.content) {
                    yield { type: 'text', value: delta.content };
                }

                if (delta?.tool_calls) {
                    // Acumulamos los fragmentos de la llamada a la herramienta
                    delta.tool_calls.forEach((toolCall: any) => {
                        if (toolCalls[toolCall.index]) {
                            toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                        } else {
                            toolCalls[toolCall.index] = { ...toolCall };
                        }
                    });
                }
            } catch (error) {
                console.error("Error al procesar un chunk del stream de OpenAI:", error);
            }
        }
    }

    // Si se acumularon llamadas a herramientas, las emitimos al final
    if (toolCalls.length > 0) {
        yield { type: 'tool_call', value: toolCalls };
    }
}