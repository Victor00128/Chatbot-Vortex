# Vortex Chat

Un chat con IA que hice usando React. Tiene dos modelos diferentes y funciona bastante bien.

## Qué hace

- Chat con Gemini (rápido) y GPT-4 (para código)
- Puedes subir imágenes y PDFs
- Guarda el historial en el navegador
- Respuestas en streaming
- Memoria a corto plazo (recuerda conversaciones anteriores)

## Como instalarlo

Necesitas Node.js instalado.

```bash
git clone https://github.com/Victor00128/Chatbot-Vortex.git
cd Chatbot-Vortex
npm install
```

Crea un archivo `.env.local` con tus API keys:

```
VITE_GEMINI_API_KEY=tu_key_aqui
VITE_OPENAI_API_KEY=tu_key_aqui
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

Consigue las keys en:
- Gemini: https://aistudio.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys
- Supabase: https://supabase.com/dashboard (crea proyecto y ve a Settings > API)

Ejecuta:

```bash
npm run dev
```

Abre http://localhost:5173

## Tecnologías

- React + TypeScript + Vite
- Zustand para state management
- React Markdown para mostrar respuestas
- APIs de Google Gemini y OpenAI

## Memoria del Chatbot

Si configuras Supabase, el chatbot recordará tus conversaciones anteriores automáticamente. Usa las últimas 3 interacciones como contexto para respuestas más coherentes.

Sin Supabase = solo memoria de la sesión actual
Con Supabase = memoria entre sesiones

## Notas

- El historial se guarda en tu navegador + Supabase (opcional)
- Necesitas internet para que funcione
- Las API keys van en .env.local (no las subas a git)

Eso es todo. Si algo no funciona, revisa que las keys estén bien.