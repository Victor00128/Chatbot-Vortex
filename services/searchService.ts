export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export const performSearch = async (query: string): Promise<SearchResult[]> => {
  const apiKey = import.meta.env.VITE_SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("La clave de API de Serper (VITE_SERPER_API_KEY) no está configurada.");
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error en la API de Serper:', errorBody);
      throw new Error(`Error de la API de Serper: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Devuelve solo los resultados orgánicos que son los más relevantes para un resumen
    return data.organic || [];

  } catch (error) {
    console.error('Error al realizar la búsqueda en internet:', error);
    if (error instanceof Error) {
        throw new Error(`Error de red o de conexión al realizar la búsqueda: ${error.message}`);
    }
    throw new Error('Error desconocido al realizar la búsqueda en internet.');
  }
};
