import { useState, useEffect } from 'react';
import { Menu, Skull, Wifi, Lock, Settings, Zap } from 'lucide-react';
import type { AISettings } from '../types';
import { getProviderConfig } from '../utils/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  conversationTitle?: string;
  aiSettings: AISettings;
}

export function Header({ onToggleSidebar, onOpenSettings, conversationTitle, aiSettings }: HeaderProps) {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const provider = getProviderConfig(aiSettings.provider);
  const online = aiSettings.provider !== 'offline' && aiSettings.apiKey.trim().length > 0;

  return (
    <header className="flex items-center justify-between border-b border-[#00ff4118] bg-[#0a0a0a]/90 px-2 py-2 sm:px-4 sm:py-2.5 backdrop-blur-xl">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 sm:p-2 text-[#00ff4155] transition-all hover:bg-[#00ff4115] hover:text-[#00ff41] active:scale-95 shrink-0"
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00cc33] to-[#009922] shadow-md shadow-[#00ff4122]">
            <Skull size={12} className="text-black" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[10px] sm:text-xs font-bold tracking-wider text-[#00ff41cc] text-glow-green truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
              {conversationTitle || 'VORTEX'}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${online ? 'bg-[#00ff41]' : 'bg-yellow-500'} opacity-75`} />
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${online ? 'bg-[#00ff41]' : 'bg-yellow-500'}`} />
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono text-[#00ff4166] tracking-wider">
                {online ? provider.name.toUpperCase() : 'OFFLINE'}
              </span>
              <Lock size={7} className="text-[#00ff4133] hidden xs:block" />
              <Wifi size={7} className="text-[#00ff4133] hidden xs:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#00ff4115] bg-[#00ff4108] px-2 py-1">
          <Zap size={9} className={online ? 'text-[#00ff41]' : 'text-yellow-600'} />
          <span className="text-[8px] sm:text-[9px] font-mono text-[#00ff4155] tracking-wider">
            {aiSettings.provider !== 'offline'
              ? `${provider.name} · ${aiSettings.model.split('/').pop()?.split('-').slice(0, 3).join('-')}`
              : 'OFFLINE'}
          </span>
        </div>

        <span className="hidden sm:block text-[9px] font-mono text-[#00ff4133]">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>

        <div className="hidden md:flex items-center gap-2 rounded-lg border border-[#00ff4115] bg-[#00ff4108] px-2.5 py-1">
          <span className="text-[9px] font-mono text-[#00ff4144]">SESSION</span>
          <span className="text-[9px] font-mono text-[#00ff4166]">{sessionId}</span>
        </div>

        <button
          onClick={onOpenSettings}
          className="rounded-lg p-1.5 sm:p-2 text-[#00ff4155] transition-all hover:bg-[#00ff4115] hover:text-[#00ff41] active:scale-95"
          aria-label="Configuracion"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
