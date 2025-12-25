<div align="center">

# 🌀 Vortex Chat

### Chatbot Multimodal Inteligente con Gemini y GPT-4

[![Demo en Vivo](https://img.shields.io/badge/🌐_Demo-Probar_Ahora-4ECDC4?style=for-the-badge)](https://vortex-ia.netlify.app/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

<a href="https://vortex-ia.netlify.app/">
  <img src="https://raw.githubusercontent.com/Victor00128/Chatbot-Vortex/main/Imagen/Chatbot-Vortex.png" width="800" alt="Banner de Vortex Chat" />
</a>

**[Probar Demo](https://vortex-ia.netlify.app/) • [Reportar Bug](https://github.com/Victor00128/Chatbot-Vortex/issues) • [Solicitar Feature](https://github.com/Victor00128/Chatbot-Vortex/issues)**

</div>

---

## 📋 Tabla de Contenidos

- [Acerca del Proyecto](#-acerca-del-proyecto)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Casos de Uso](#-casos-de-uso)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 Acerca del Proyecto

**Vortex Chat** es un chatbot multimodal avanzado que combina lo mejor de dos mundos: la velocidad y versatilidad de **Google Gemini** con la precisión en código de **OpenAI GPT-4**. Diseñado para ofrecer conversaciones inteligentes con capacidad de análisis de imágenes, lectura de PDFs y memoria contextual persistente.

### ¿Por qué Vortex Chat?

La mayoría de los chatbots están limitados a un solo modelo de IA o carecen de capacidades multimodales robustas. Vortex Chat resuelve esto ofreciendo:

- **Dual AI Engine**: Alterna automáticamente entre Gemini (conversación general) y GPT-4 (análisis técnico y código)
- **Memoria Visual Persistente**: Recuerda imágenes durante toda la conversación, ideal para ejercicios con múltiples incisos
- **Análisis Multimodal**: Procesa texto, imágenes y PDFs en una sola interfaz
- **Memoria Contextual**: Mantiene el contexto de conversaciones anteriores usando Supabase
- **Streaming en Tiempo Real**: Respuestas progresivas para una experiencia fluida

---

## ✨ Características Principales

### 🤖 Dual AI Engine

Vortex Chat integra dos modelos de IA líderes, cada uno optimizado para diferentes tareas:

| Modelo | Uso Principal | Ventajas |
|--------|---------------|----------|
| **Google Gemini** | Conversación general, análisis de imágenes | Rápido, multimodal nativo, excelente para contexto visual |
| **OpenAI GPT-4** | Código, análisis técnico, razonamiento complejo | Precisión superior en programación, lógica avanzada |

### 🖼️ Memoria Visual Persistente

Una característica única que permite referencias naturales a imágenes anteriores:

```
Usuario: [Envía imagen de ejercicio matemático] "Resuelve el ejercicio 8a"
Vortex: ✅ Analiza y resuelve correctamente

Usuario: "Ahora resuelve el inciso b)"
Vortex: ✅ Usa automáticamente la misma imagen, sin necesidad de reenviarla

Usuario: "¿Y el inciso c)?"
Vortex: ✅ Mantiene el contexto visual completo
```

**Palabras clave que activan la memoria visual:**
`mismo`, `anterior`, `imagen`, `foto`, `ejercicio`, `inciso`, `mira`, `ves`, `archivo`, `documento`, `problema`, `ahora`, `también`, `arriba`, `envié`

### 📄 Análisis de Documentos

- **PDFs**: Extrae y analiza contenido de documentos PDF
- **Imágenes**: Reconocimiento de texto (OCR), análisis de diagramas, resolución de ejercicios matemáticos
- **Formatos soportados**: JPG, PNG, PDF, WEBP

### 💾 Memoria Contextual Inteligente

- **Memoria a Corto Plazo**: Mantiene las últimas 3 interacciones en contexto
- **Memoria Persistente**: Guarda conversaciones en Supabase para sesiones futuras
- **Memoria Visual**: Las imágenes permanecen en contexto durante toda la conversación actual

### 🌍 Soporte Multiidioma

Interfaz disponible en múltiples idiomas con detección automática del navegador:
- Español
- Inglés
- Francés
- Alemán
- Italiano
- Portugués

### ⚡ Streaming en Tiempo Real

Las respuestas se generan y muestran progresivamente, similar a ChatGPT, para una experiencia de usuario fluida y responsiva.

---

## 🏗️ Arquitectura

Vortex Chat sigue una arquitectura modular de tres capas que separa claramente las responsabilidades:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Chat         │  │ Message      │  │ Input        │  │
│  │ Interface    │  │ List         │  │ Form         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│           React + TypeScript + Zustand                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Gemini AI    │  │ OpenAI GPT   │  │ Summary      │  │
│  │ Service      │  │ Service      │  │ Service      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│           API Integration & Business Logic               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                         │
│  ┌──────────────┐                  ┌──────────────┐    │
│  │ Supabase     │                  │ Browser      │    │
│  │ Database     │                  │ localStorage │    │
│  └──────────────┘                  └──────────────┘    │
│           Persistent & Session Storage                   │
└─────────────────────────────────────────────────────────┘
```

### Componentes Clave

**Frontend Components:**
- `ChatInput.tsx`: Maneja entrada de texto, archivos y comandos
- `ChatMessage.tsx`: Renderiza mensajes con formato Markdown y sintaxis de código
- `MessageList.tsx`: Lista virtualizada para rendimiento con historial largo
- `Sidebar.tsx`: Gestión de conversaciones y configuración
- `Header.tsx`: Navegación y selector de modelo de IA

**Services:**
- `geminiService.ts`: Integración con Google Gemini API
- `openaiService.ts`: Integración con OpenAI GPT-4 API
- `summaryService.ts`: Generación de resúmenes de conversaciones
- `supabaseClient.ts`: Cliente de base de datos para persistencia
- `debugService.ts`: Sistema de logging y validación

**State Management:**
- Zustand para gestión de estado global
- Stores separados para conversaciones, configuración y UI

---

## 🛠️ Tecnologías

### Core Stack

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19.1.0 | Biblioteca UI principal |
| **TypeScript** | 5.8.2 | Tipado estático y seguridad |
| **Vite** | 6.2.0 | Build tool y dev server |
| **Zustand** | 5.0.7 | State management |

### AI & Backend

| Servicio | Propósito |
|----------|-----------|
| **Google Gemini API** | Modelo de IA multimodal principal |
| **OpenAI GPT-4 API** | Modelo especializado en código |
| **Supabase** | Base de datos PostgreSQL y autenticación |

### UI & Rendering

| Librería | Propósito |
|----------|-----------|
| **React Markdown** | Renderizado de respuestas en Markdown |
| **React Syntax Highlighter** | Resaltado de sintaxis de código |
| **KaTeX** | Renderizado de fórmulas matemáticas LaTeX |
| **React Window** | Virtualización de listas para rendimiento |

### Testing

| Herramienta | Propósito |
|-------------|-----------|
| **Vitest** | Framework de testing |
| **Testing Library** | Testing de componentes React |
| **Happy DOM** | Entorno DOM para tests |

---

## 🚀 Instalación

### Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18.0 o superior)
- **npm** o **pnpm** (gestor de paquetes)
- Cuentas activas en:
  - [Google AI Studio](https://aistudio.google.com/) (para Gemini API)
  - [OpenAI Platform](https://platform.openai.com/) (para GPT-4 API)
  - [Supabase](https://supabase.com/) (opcional, para memoria persistente)

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/Victor00128/Chatbot-Vortex.git
cd Chatbot-Vortex
```

2. **Instalar dependencias**

```bash
npm install
```

O si prefieres pnpm:

```bash
pnpm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
touch .env.local
```

4. **Agregar tus API keys** (ver sección [Configuración](#-configuración))

5. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

6. **Abrir en el navegador**

Navega a `http://localhost:5173` para ver la aplicación en acción.

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Google Gemini API
VITE_GEMINI_API_KEY=tu_gemini_api_key_aqui

# OpenAI API
VITE_OPENAI_API_KEY=tu_openai_api_key_aqui

# Supabase (Opcional - para memoria persistente)
VITE_SUPABASE_URL=tu_supabase_url_aqui
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

### Obtener API Keys

#### 1. Google Gemini API Key

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la clave generada

**Nota**: Gemini ofrece un tier gratuito generoso con 60 requests por minuto.

#### 2. OpenAI API Key

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Navega a "API Keys" en el menú lateral
4. Haz clic en "Create new secret key"
5. Copia la clave (solo se muestra una vez)

**Nota**: OpenAI requiere configurar un método de pago, pero ofrece $5 de crédito inicial.

#### 3. Supabase (Opcional)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto
3. Ve a Settings → API
4. Copia la `URL` y la `anon/public key`

**Configuración de la base de datos:**

Ejecuta el siguiente SQL en el editor de Supabase para crear la tabla de conversaciones:

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### Configuración sin Supabase

Si no configuras Supabase, Vortex Chat funcionará perfectamente usando solo `localStorage` del navegador:

- ✅ Memoria durante la sesión actual
- ✅ Historial de conversaciones en el navegador
- ❌ Sin sincronización entre dispositivos
- ❌ Sin persistencia si se borran datos del navegador

---

## 💡 Uso

### Interfaz Básica

1. **Seleccionar Modelo de IA**
   - Haz clic en el selector en el header
   - Elige entre Gemini (rápido) o GPT-4 (preciso)

2. **Enviar Mensajes**
   - Escribe tu pregunta en el campo de texto
   - Presiona Enter o haz clic en el botón de enviar
   - Las respuestas aparecerán en tiempo real (streaming)

3. **Adjuntar Archivos**
   - Haz clic en el ícono de clip 📎
   - Selecciona una imagen (JPG, PNG, WEBP) o PDF
   - El archivo se procesará automáticamente

### Comandos Especiales

Vortex Chat soporta comandos de barra para acciones rápidas:

| Comando | Acción |
|---------|--------|
| `/clear` | Limpia el historial de la conversación actual |
| `/new` | Inicia una nueva conversación |
| `/export` | Exporta la conversación actual como JSON |
| `/help` | Muestra la lista de comandos disponibles |

### Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + Enter` | Enviar mensaje |
| `Ctrl + K` | Abrir selector de conversaciones |
| `Ctrl + N` | Nueva conversación |
| `Esc` | Cerrar modales |

---

## 🎓 Casos de Uso

### 1. Resolución de Ejercicios Matemáticos

**Escenario**: Tienes una imagen con múltiples ejercicios y quieres resolverlos uno por uno.

```
Tú: [Envías imagen con 5 ejercicios de cálculo]
    "Resuelve el ejercicio 3a"

Vortex: [Analiza la imagen y resuelve el ejercicio 3a paso a paso]

Tú: "Ahora el inciso b del mismo ejercicio"

Vortex: [Usa la imagen anterior automáticamente, sin necesidad de reenviarla]

Tú: "¿Y el ejercicio 4?"

Vortex: [Continúa usando la misma imagen en contexto]
```

**Ventaja**: No necesitas reenviar la imagen cada vez, la conversación fluye naturalmente.

### 2. Análisis de Código

**Escenario**: Necesitas ayuda para depurar o mejorar un fragmento de código.

```
Tú: "Revisa este código y dime si hay errores"
    [Pegas código JavaScript]

Vortex (GPT-4): [Analiza el código, identifica bugs y sugiere mejoras]

Tú: "¿Cómo puedo optimizar el rendimiento?"

Vortex: [Proporciona refactorización con explicaciones]
```

**Recomendación**: Usa GPT-4 para análisis de código, es más preciso que Gemini en este contexto.

### 3. Lectura y Resumen de PDFs

**Escenario**: Tienes un documento PDF largo y necesitas un resumen o buscar información específica.

```
Tú: [Adjuntas PDF de 20 páginas]
    "Resume los puntos principales de este documento"

Vortex: [Lee el PDF y genera un resumen estructurado]

Tú: "¿Qué dice sobre el capítulo 3?"

Vortex: [Busca y extrae información específica del PDF]
```

### 4. Aprendizaje de Idiomas

**Escenario**: Practicar conversación en otro idioma con correcciones en tiempo real.

```
Tú: "Quiero practicar francés. Corrige mis errores."

Vortex: "D'accord! Commençons. Comment s'est passée ta journée?"

Tú: "Ma journée était bien. J'ai allé au parc."

Vortex: "Casi perfecto! Pequeña corrección: 'Je suis allé au parc' 
        (el verbo 'aller' usa 'être' como auxiliar, no 'avoir')"
```

---

## 🗺️ Roadmap

### ✅ Completado

- [x] Integración dual de Gemini y GPT-4
- [x] Memoria visual persistente
- [x] Análisis de imágenes y PDFs
- [x] Streaming de respuestas en tiempo real
- [x] Soporte multiidioma
- [x] Persistencia con Supabase
- [x] Sistema de validación y debug

### 🚧 En Desarrollo

- [ ] **Búsqueda Web en Tiempo Real**: Integración con APIs de búsqueda para respuestas actualizadas
- [ ] **Generación de Imágenes**: Integración con DALL-E o Stable Diffusion
- [ ] **Modo Voz**: Speech-to-text y text-to-speech para conversaciones manos libres
- [ ] **Plugins Personalizados**: Sistema de extensiones para funcionalidades adicionales

### 🔮 Futuro

- [ ] **Versión Móvil**: App nativa para iOS y Android
- [ ] **Colaboración en Tiempo Real**: Múltiples usuarios en la misma conversación
- [ ] **Fine-tuning Personalizado**: Entrenar modelos con datos específicos del usuario
- [ ] **Integración con Herramientas**: Conectar con Notion, Google Drive, Slack, etc.

---

## 🤝 Contribuir

¡Las contribuciones son lo que hace que la comunidad open source sea un lugar increíble para aprender, inspirar y crear! Cualquier contribución que hagas será **muy apreciada**.

### Cómo Contribuir

1. **Fork el proyecto**
2. **Crea tu Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit tus cambios** (`git commit -m 'Add some AmazingFeature'`)
4. **Push a la Branch** (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

### Guías de Contribución

- **Código**: Sigue las convenciones de TypeScript y React
- **Commits**: Usa mensajes descriptivos en español o inglés
- **Tests**: Agrega tests para nuevas funcionalidades
- **Documentación**: Actualiza el README si es necesario

### Reportar Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/Victor00128/Chatbot-Vortex/issues) con:

- Descripción clara del problema
- Pasos para reproducirlo
- Comportamiento esperado vs. actual
- Screenshots si es aplicable
- Información del entorno (navegador, OS, versión de Node)

---

## 📜 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

La Licencia MIT es una licencia permisiva que permite el uso comercial, modificación, distribución y uso privado, siempre que se incluya el aviso de copyright.

---

## 📞 Contacto

**Julio Cesar** - Desarrollador Full-Stack

- GitHub: [@Victor00128](https://github.com/Victor00128)
- LinkedIn: [Julio Cesar](https://www.linkedin.com/in/julio-cesar-406314373/)
- Email: juliocesarmoralesalvarado9@gmail.com
- Portfolio: [Próximamente]

**Link del Proyecto**: [https://github.com/Victor00128/Chatbot-Vortex](https://github.com/Victor00128/Chatbot-Vortex)

**Demo en Vivo**: [https://vortex-ia.netlify.app/](https://vortex-ia.netlify.app/)

---

## 🙏 Agradecimientos

Este proyecto no sería posible sin estas increíbles tecnologías y recursos:

- [React](https://reactjs.org/) - La biblioteca UI que hace todo posible
- [Google Gemini](https://ai.google.dev/) - Modelo de IA multimodal de vanguardia
- [OpenAI GPT-4](https://openai.com/gpt-4) - El modelo de lenguaje más avanzado
- [Supabase](https://supabase.com/) - Backend-as-a-Service increíble
- [Vite](https://vitejs.dev/) - Build tool ultrarrápido
- [Zustand](https://github.com/pmndrs/zustand) - State management simple y efectivo
- [React Markdown](https://github.com/remarkjs/react-markdown) - Renderizado perfecto de Markdown
- [Shields.io](https://shields.io/) - Badges hermosos para el README

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

[![Star on GitHub](https://img.shields.io/github/stars/Victor00128/Chatbot-Vortex.svg?style=social)](https://github.com/Victor00128/Chatbot-Vortex)

**Hecho por [Julio Cesar](https://github.com/Victor00128)**

</div>
