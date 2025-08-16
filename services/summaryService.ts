import { generateContent } from './geminiService';
import { ChatMessage, Conversation, Sender } from '../types';

// Configuración del servicio de resumen
export const SUMMARY_CONFIG = {
  // Número de mensajes después del cual se genera un resumen
  MESSAGES_THRESHOLD: 10,
  // Número máximo de mensajes a incluir en el contexto reciente
  RECENT_MESSAGES_COUNT: 5,
  // Número máximo de caracteres para el resumen
  MAX_SUMMARY_LENGTH: 500
};

export interface ConversationSummary {
  id: string;
  conversationId: string;
  summary: string;
  messageCount: number;
  lastUpdated: number;
  version: number; // Para tracking de versiones del resumen
}

/**
 * Verifica si una conversación necesita un nuevo resumen
 */
export function needsSummary(conversation: Conversation, existingSummary?: ConversationSummary): boolean {
  const messageCount = conversation.messages.length;

  // Si no hay resumen y hay suficientes mensajes
  if (!existingSummary && messageCount >= SUMMARY_CONFIG.MESSAGES_THRESHOLD) {
    return true;
  }

  // Si hay resumen pero han pasado más mensajes desde la última actualización
  if (existingSummary && messageCount >= existingSummary.messageCount + SUMMARY_CONFIG.MESSAGES_THRESHOLD) {
    return true;
  }

  return false;
}

/**
 * Genera un resumen de la conversación usando IA
 */
export async function generateConversationSummary(
  conversation: Conversation,
  existingSummary?: ConversationSummary
): Promise<string> {

  // Obtener mensajes relevantes para el resumen
  const messagesToSummarize = getMessagesToSummarize(conversation, existingSummary);

  // Construir el prompt para el resumen
  const prompt = buildSummaryPrompt(messagesToSummarize, existingSummary, conversation.personality);

  try {
    // Usar Gemini Flash para generar el resumen (más económico)
    const summary = await generateContent(prompt, 'gemini-1.5-flash');

    // Limitar la longitud del resumen
    return summary.length > SUMMARY_CONFIG.MAX_SUMMARY_LENGTH
      ? summary.substring(0, SUMMARY_CONFIG.MAX_SUMMARY_LENGTH) + '...'
      : summary;

  } catch (error) {
    console.error('Error generando resumen de conversación:', error);
    throw new Error('No se pudo generar el resumen de la conversación');
  }
}

/**
 * Obtiene los mensajes que deben incluirse en el resumen
 */
function getMessagesToSummarize(
  conversation: Conversation,
  existingSummary?: ConversationSummary
): ChatMessage[] {

  if (!existingSummary) {
    // Si no hay resumen previo, incluir todos los mensajes excepto los más recientes
    return conversation.messages.slice(0, -SUMMARY_CONFIG.RECENT_MESSAGES_COUNT);
  }

  // Si hay resumen previo, incluir solo los mensajes nuevos desde el último resumen
  const startIndex = existingSummary.messageCount;
  const endIndex = conversation.messages.length - SUMMARY_CONFIG.RECENT_MESSAGES_COUNT;

  return conversation.messages.slice(startIndex, endIndex);
}

/**
 * Construye el prompt para generar el resumen
 */
function buildSummaryPrompt(
  messages: ChatMessage[],
  existingSummary?: ConversationSummary,
  personality: string
): string {

  let prompt = '';

  if (existingSummary) {
    prompt += `Resumen previo de la conversación:\n${existingSummary.summary}\n\n`;
    prompt += `Actualiza este resumen con los siguientes mensajes adicionales:\n\n`;
  } else {
    prompt += `Crea un resumen conciso y útil de la siguiente conversación. El resumen debe capturar los temas principales, decisiones importantes, y cualquier contexto que sea útil para futuras interacciones.\n\n`;
  }

  // Agregar los mensajes
  messages.forEach((message, index) => {
    const sender = message.sender === Sender.User ? 'Usuario' : 'Asistente';
    const content = message.text.substring(0, 200) + (message.text.length > 200 ? '...' : '');
    prompt += `${sender}: ${content}\n`;
  });

  prompt += `\n`;

  if (existingSummary) {
    prompt += `Proporciona un resumen actualizado que integre la información previa con los nuevos mensajes. `;
  } else {
    prompt += `Proporciona un resumen que capture los puntos clave, temas discutidos, y cualquier información importante que el asistente debería recordar. `;
  }

  prompt += `Mantén el resumen conciso pero informativo (máximo ${SUMMARY_CONFIG.MAX_SUMMARY_LENGTH} caracteres). `;
  prompt += `El asistente está configurado con personalidad "${personality}".`;

  return prompt;
}

/**
 * Crea un nuevo objeto de resumen
 */
export function createConversationSummary(
  conversationId: string,
  summary: string,
  messageCount: number,
  existingSummary?: ConversationSummary
): ConversationSummary {

  return {
    id: `summary_${conversationId}_${Date.now()}`,
    conversationId,
    summary,
    messageCount,
    lastUpdated: Date.now(),
    version: existingSummary ? existingSummary.version + 1 : 1
  };
}

/**
 * Obtiene el contexto enriquecido para una conversación (resumen + mensajes recientes)
 */
export function getEnrichedContext(
  conversation: Conversation,
  summary?: ConversationSummary
): ChatMessage[] {

  if (!summary || conversation.messages.length <= SUMMARY_CONFIG.RECENT_MESSAGES_COUNT) {
    return conversation.messages;
  }

  // Crear un mensaje virtual con el resumen
  const summaryMessage: ChatMessage = {
    id: `summary_${summary.id}`,
    sender: Sender.AI,
    text: `[CONTEXTO PREVIO]: ${summary.summary}`
  };

  // Obtener los mensajes recientes
  const recentMessages = conversation.messages.slice(-SUMMARY_CONFIG.RECENT_MESSAGES_COUNT);

  // Combinar resumen con mensajes recientes
  return [summaryMessage, ...recentMessages];
}

/**
 * Genera un system instruction enriquecido con el resumen de la conversación
 */
export function getEnrichedSystemInstruction(
  originalInstruction: string,
  summary?: ConversationSummary
): string {

  if (!summary) {
    return originalInstruction;
  }

  const contextAddition = `\n\nCONTEXTO DE LA CONVERSACIÓN PREVIA:\n${summary.summary}\n\nUsa este contexto para mantener coherencia y continuidad en la conversación actual. Refiere a temas previos cuando sea relevante, pero no repitas información innecesariamente.`;

  return originalInstruction + contextAddition;
}

/**
 * Función utilitaria para limpiar resúmenes antiguos (puede usarse para mantenimiento)
 */
export function shouldCleanupSummary(summary: ConversationSummary): boolean {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return summary.lastUpdated < oneWeekAgo;
}

/**
 * Extrae temas principales del resumen para búsqueda/indexación
 */
export function extractTopics(summary: string): string[] {
  // Implementación simple - puede mejorarse con NLP más avanzado
  const words = summary.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['este', 'esta', 'sobre', 'para', 'como', 'donde', 'cuando', 'quien', 'porque'].includes(word));

  // Contar frecuencia y devolver las palabras más comunes
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}
