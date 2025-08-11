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

// Función principal que se comunica con OpenAI y devuelve la respuesta en tiempo real
export async function* getOpenAIStream(
    config: AIPersonalityConfig,
    history: ChatMessage[],
    userMessage: ChatMessage
): AsyncGenerator<{ text: () => string }> {
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("La clave de API de OpenAI (VITE_OPENAI_API_KEY) no está configurada.");
    }

    // 1. Formatear el historial de chat para la API de OpenAI
    const messages = history
        .filter(m => m.id !== 'initial-message')
        .map(msg => ({
            role: msg.sender === Sender.User ? 'user' : 'assistant',
            content: msg.text,
        }));

    // 2. Preparar el mensaje actual del usuario (puede incluir una imagen)
    let userContent: any;
    if (userMessage.fileInfo && userMessage.fileData && userMessage.fileInfo.type.startsWith('image/')) {
        const base64Image = await fileToBase64(userMessage.fileData);
        userContent = [
            { type: "text", text: userMessage.text },
            { type: "image_url", image_url: { url: base64Image } },
        ];
    } else {
        userContent = userMessage.text;
    }
    
    messages.push({ role: 'user', content: userContent });

    // 3. Realizar la petición a la API de OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: "system", content: config.systemInstruction },
                ...messages
            ],
            stream: true, // ¡Clave para recibir respuestas en tiempo real!
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de OpenAI: ${errorData.error?.message || response.statusText}`);
    }

    // 4. Procesar la respuesta que llega por partes (streaming)
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo leer la respuesta del servidor.');
    
    const decoder = new TextDecoder();
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
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                    yield { text: () => content };
                }
            } catch (error) {
                console.error("Error al procesar un chunk del stream:", error);
            }
        }
    }
}