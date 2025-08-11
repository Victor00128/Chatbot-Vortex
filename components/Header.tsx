import React from 'react';
import { AIPersonality, PERSONALITIES, PERSONALITY_ORDER } from '../types';

interface HeaderProps {
  currentPersonality: AIPersonality;
  onPersonalityChange: (personality: AIPersonality) => void;
  isLoading: boolean;
  onRetry: () => void; // Lo mantenemos por si se usa en el futuro, pero el botón no estará
  canRetry: boolean;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentPersonality, 
    onPersonalityChange, 
    isLoading, 
    onToggleFullscreen,
    isFullscreen,
    onToggleSidebar
}) => {
  return (
    <header className="bg-zinc-900/70 backdrop-blur-sm p-4 border-b border-zinc-700 shadow-lg sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="p-1 text-gray-400 hover:text-white transition-colors duration-200 md:hidden"
            aria-label="Toggle Sidebar"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-red-500 block drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"
          >
            <path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.134A.75.75 0 003 6.821v10.358c0 .32.19.601.478.712l8.254 3.321a.75.75 0 00.756 0l8.254-3.321a.75.75 0 00.478-.712V6.821a.75.75 0 00-.366-.687L12.378 1.602zM12 7.5a.75.75 0 01.75.75v3.19l2.47-1.426a.75.75 0 11.76 1.316l-3.22 1.86a.75.75 0 01-.76 0l-3.22-1.86a.75.75 0 11.76-1.316l2.47 1.426V8.25A.75.75 0 0112 7.5z" />
          </svg>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative">
            <select
              id="personality-select"
              value={currentPersonality}
              onChange={(e) => onPersonalityChange(e.target.value as AIPersonality)}
              disabled={isLoading}
              className="appearance-none bg-zinc-800 border border-zinc-700 rounded-md py-2 pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              aria-label="Seleccionar modelo de IA"
            >
              {PERSONALITY_ORDER.map((key) => (
                <option key={key} value={key}>
                  {PERSONALITIES[key].name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          
          {/* --- BLOQUE DE CÓDIGO ELIMINADO ---
            El botón de reintentar que estaba aquí ha sido removido.
          --- FIN DEL BLOQUE ELIMINADO --- */}

          <button
            onClick={onToggleFullscreen}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;