```
██╗   ██╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██║   ██║██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║   ██║██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝
╚██╗ ██╔╝██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗
 ╚████╔╝ ╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
```


## ✨ Lo que hace Vortex-IA

-   **Doble Potencia de IA**: Conversaciones fluidas con dos personalidades distintas. El **Modelo Flash** usa Gemini 1.5 Flash para respuestas rápidas, mientras que el **Modelo Desarrollador** utiliza GPT-4o-mini de OpenAI para análisis de código en profundidad.
-   **Análisis Multimodal**: Sube imágenes (JPG, PNG) y documentos PDF, y Vortex-IA los analizará para responder preguntas específicas sobre su contenido.
-   **Respuestas en Tiempo Real**: Gracias al streaming, las respuestas de la IA aparecen al instante, sin esperas.
-   **Personalidades a tu Gusto**: Cambia fácilmente entre el asistente rápido (Gemini) y el experto en código (OpenAI) según tus necesidades.
-   **Historial Organizado**: Todas tus conversaciones se guardan en tu navegador para que puedas revisarlas o retomarlas cuando quieras.

## 🚀 Ponlo en Marcha

Sigue estos pasos para tener Vortex-IA funcionando en tu propia máquina.

### 📋 Requisitos Previos

-   [Node.js](https://nodejs.org/) (versión 18 o superior).
-   `npm` (viene incluido con Node.js).
-   Una clave de API de **Google Gemini** (consíguela gratis en [Google AI Studio](https://aistudio.google.com/app/apikey)).
-   Una clave de API de **OpenAI** (consíguela en [OpenAI Platform](https://platform.openai.com/api-keys)).

### ⚙️ Guía de Instalación

1.  **Clona o Descarga el Repositorio:**
    Abre tu terminal y clona el proyecto con este comando:
    ```bash
    git clone https://github.com/Victor00128/Chatbot-Vortex.git
    ```
    Luego, navega a la carpeta del proyecto:
    ```bash
    cd Chatbot-Vortex
    ```

2.  **Instala las Dependencias:**
    Ejecuta este comando para descargar todas las librerías necesarias.
    ```bash
    npm install
    ```

3.  **Configura tus Claves de API:**
    Crea una copia del archivo de ejemplo `.env.local.example` y renómbrala a `.env.local`.
    ```bash
    # En Windows (cmd):
    copy .env.local.example .env.local

    # En Linux/Mac:
    cp .env.local.example .env.local
    ```
    Ahora, abre el nuevo archivo `.env.local` y pega tus claves de API. **Este paso es fundamental.**
    ```dotenv
    # Clave de API para el "Modelo Flash" (Gemini)
    VITE_GEMINI_API_KEY=TU_CLAVE_DE_API_DE_GEMINI

    # Clave de API para el "Modelo Desarrollador" (OpenAI)
    VITE_OPENAI_API_KEY=TU_CLAVE_DE_API_DE_OPENAI
    ```

4.  **¡Inicia la Aplicación!**
    Ejecuta el siguiente comando para poner en marcha el servidor de desarrollo.
    ```bash
    npm run dev
    ```

5.  **Abre tu Navegador:**
    Ve a la dirección `http://localhost:5173/`. ¡Ya está todo listo para usar Vortex-IA
