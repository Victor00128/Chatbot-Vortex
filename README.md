# Chatbot Vortex

Chatbot Vortex es una interfaz de chat para trabajar con varios proveedores de IA desde un solo lugar. El proyecto permite probar la experiencia en modo local, conectar proveedores con API key propia y exportar conversaciones desde el navegador.

## Qué ofrece

- Múltiples proveedores en una sola UI: Gemini, Groq, OpenAI, DeepSeek, OpenRouter y modo local.
- Historial persistente en el navegador con exportación a JSON y Markdown.
- Adjuntos con análisis básico de imágenes, PDFs, ZIPs, código, CSV, JSON, audio y video.
- Configuración de modelo, temperatura, tokens máximos y prompt del sistema.
- Mejoras de accesibilidad: navegación por teclado, mejor foco visual, menos movimiento si el sistema pide `prefers-reduced-motion`.
- Cancelación de respuesta en curso y avisos visibles de estado/error.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React

## Inicio rápido

Requisitos:

- Node.js 18 o superior

Instalación:

```bash
git clone https://github.com/Victor00128/Chatbot-Vortex.git
cd Chatbot-Vortex
npm ci
npm run dev
```

Build de producción:

```bash
npm run build
```

## Configuración

La app arranca en `offline` por defecto. Eso evita exponer una clave preconfigurada y permite probar la interfaz sin tocar ninguna API.

Si quieres usar un proveedor real:

1. Abre el botón de ajustes.
2. Elige proveedor.
3. Pega tu API key.
4. Guarda y prueba conexión.

## Seguridad

La versión actual funciona con API key propia. Cuando eliges un proveedor real, la clave se usa directamente desde el navegador.

Eso sirve para:

- demos
- uso personal
- validación rápida del flujo

No es suficiente para:

- producto multiusuario
- ventas a empresas
- control real de cuotas, billing o abuse prevention

Si el proyecto evoluciona a una versión comercial multiusuario, el siguiente paso lógico es montar un backend/proxy que:

- reciba las peticiones del frontend
- proteja las claves
- aplique autenticación, rate limits y observabilidad
- opcionalmente guarde historial fuera del navegador

## Estructura

```text
src/
├── components/
├── hooks/
├── types/
├── utils/
└── App.tsx
```

## Estado actual

Esta versión deja el proyecto en un estado mucho más sólido para demo, revisión técnica e iteración:

- configuración segura por defecto
- interfaz más consistente
- exportación de datos
- accesibilidad básica más sólida
- manejo más claro de errores y tiempos de espera

## Siguientes pasos recomendados

1. Sacar las llamadas a proveedores del frontend y moverlas a un backend.
2. Añadir autenticación de usuarios y planes.
3. Guardar historial en base de datos o IndexedDB, no solo en `localStorage`.
4. Incorporar analítica, rate limiting y panel administrativo.
5. Preparar landing, pricing y una demo pública.
