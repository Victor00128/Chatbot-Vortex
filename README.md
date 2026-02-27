# Vortex Chatbot

Interfaz de chat desarrollada para uso interno de Vortex. Permite conectarse a distintos proveedores de inteligencia artificial (Gemini, Groq, OpenAI, DeepSeek, etc.) desde una sola pantalla, sin tener que cambiar de herramienta cada vez.

La idea surgio porque estabamos cansados de abrir mil pestañas distintas dependiendo del modelo que quisieras usar. Con esto tenes todo en un solo lugar.

---

## ¿Que hace exactamente?

- Conecta con multiples proveedores de IA usando tu propia API key
- Guarda el historial de conversaciones en el navegador (localStorage), no se pierde aunque recargues
- Adjuntar archivos y que la IA los analice (texto, codigo, etc)
- Modo oscuro por defecto (no hay modo claro, no lo necesitabamos)
- Se puede configurar el modelo, temperatura y tokens maximos desde la UI
- Diseño responsive, funciona en movil aunque esta mas optimizado para desktop

---

## Tecnologías usadas

- **React 19** con TypeScript
- **Vite** como bundler (rapido y sencillo de configurar)
- **Tailwind CSS v4** para los estilos
- **Lucide React** para los iconos
- APIs compatibles con OpenAI (Groq, OpenRouter, DeepSeek) y la API nativa de Gemini

---

## Instalacion

Necesitas tener Node.js instalado (version 18 o superior recomendada).

```bash
# Clonar el repo
git clone https://github.com/tu-usuario/vortex-chatbot.git
cd vortex-chatbot

# Instalar dependencias
npm install

# Levantar el servidor de desarrollo
npm run dev
```

Despues de eso se abre en `http://localhost:5173` (o el puerto que te indique la terminal).

Para hacer el build de produccion:

```bash
npm run build
```

---

## Configuracion

No hay archivo `.env` necesario. La API key se configura directamente desde la interfaz en el boton de ajustes (icono de engranaje). Podes cambiarla en cualquier momento sin recargar.

Los proveedores gratuitos que funcionan sin pagar son **Groq** y **Gemini** (tienen tier gratuito con limites razonables).

---

## Estructura del proyecto

```
src/
├── components/      # Componentes de la UI (Sidebar, Chat, Modales, etc)
├── hooks/           # useChat.ts con toda la logica del chat
├── utils/           # Conexion con APIs, prompts, helpers
├── types/           # Tipos TypeScript compartidos
└── App.tsx          # Componente raiz
```

---

## Notas

- El historial se guarda solo en el navegador. Si limpiás el localStorage se borra todo.
- Algunos modelos de Gemini todavia estan en preview y pueden cambiar sin aviso.
- Si la respuesta de la IA tarda mucho, probablemente es el modelo, no el codigo (los modelos grandes a veces son lentos).

---

Desarrollado por **Julio Cesar**
