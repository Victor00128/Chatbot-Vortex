// prompt base del asistente

export const VORTEX_MASTER_PROMPT = `Eres un asistente virtual.
Responde de forma clara y breve.
No inventes información. Si no sabes algo, dilo.
Responde en el mismo idioma que usa el usuario.
Formato de respuesta:
- Usa texto plano, sin markdown (nada de #, **, *, -)
- Para listas usa numeros: 1. 2. 3.
- La unica excepcion son bloques de codigo con triple backtick cuando el usuario pida codigo
- Para codigo inline usa backticks simples
Si el usuario pide codigo, dalo completo y funcional.
Si pregunta conceptos, explica sin codigo a menos que lo pida.`;

// contexto extra segun el tipo de pregunta
const extraCoding = '\nEl usuario pregunta sobre programacion. Si pide codigo, aplica buenas practicas.';
const extraMath = '\nEl usuario pregunta sobre matematicas. Resuelve paso a paso.';
const extraAnalysis = '\nEl usuario pide un analisis. Descompon el tema y evalua desde varios angulos.';

// detecta tipo y agrega contexto
export function getEnhancedSystemPrompt(userMessage: string, _history?: string): string {
  let prompt = VORTEX_MASTER_PROMPT;
  const msg = userMessage.toLowerCase();

  const codingWords = ['código', 'codigo', 'programar', 'función', 'funcion', 'bug', 'error', 'react', 'python', 'javascript', 'typescript', 'html', 'css', 'sql', 'api', 'crea', 'genera', 'implementa', 'code', 'function', 'class', 'component', 'script', 'node', 'npm', 'git', 'docker'];
  const mathWords = ['calcula', 'resuelve', 'ecuación', 'ecuacion', 'integral', 'derivada', 'probabilidad', 'math', 'cuánto es', 'cuanto es'];
  const analysisWords = ['analiza', 'explica', 'compara', 'evalúa', 'por qué', 'cómo funciona', 'diferencias', 'ventajas'];

  if (codingWords.some(w => msg.includes(w))) prompt += extraCoding;
  if (mathWords.some(w => msg.includes(w))) prompt += extraMath;
  if (analysisWords.some(w => msg.includes(w))) prompt += extraAnalysis;

  return prompt;
}

export interface AIParameters {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
}

// ajusta parametros segun tipo de pregunta
export function getOptimalParameters(userMessage: string): AIParameters {
  const msg = userMessage.toLowerCase();

  if (['código', 'codigo', 'bug', 'error', 'crea', 'genera', 'code', 'function'].some(w => msg.includes(w))) {
    return { temperature: 0.3, topP: 0.85, topK: 40, maxTokens: 8192 };
  }
  if (['calcula', 'resuelve', 'ecuación', 'math', 'cuánto'].some(w => msg.includes(w))) {
    return { temperature: 0.1, topP: 0.8, topK: 30, maxTokens: 4096 };
  }
  if (['cuento', 'historia', 'poema', 'creativo', 'imagina'].some(w => msg.includes(w))) {
    return { temperature: 0.9, topP: 0.95, topK: 60, maxTokens: 8192 };
  }

  return { temperature: 0.7, topP: 0.9, topK: 50, maxTokens: 4096 };
}
