import { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import type { AISettings } from '../types';
import { getProviderConfig } from '../utils/api';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  aiSettings: AISettings;
  onOpenSettings: () => void;
}

// animacion de fondo tipo matrix
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const chars = '01アイウエオカキクケコサシスセソ{}[]<>/\\|=+-*&^%$#@!~';
    const charArr = chars.split('');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = window.innerWidth < 640 ? 11 : 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops: number[] = Array(columns).fill(0).map(() => Math.random() * -100);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      columns = Math.floor(canvas.width / fontSize);
      while (drops.length < columns) drops.push(Math.random() * -100);

      for (let i = 0; i < columns; i++) {
        const char = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0 && y < canvas.height) {
          ctx.fillStyle = '#00ff41';
          ctx.font = `${fontSize}px monospace`;
          ctx.globalAlpha = 0.9;
          ctx.fillText(char, x, y);

          for (let t = 1; t < 4; t++) {
            const ty = y - t * fontSize;
            if (ty > 0) {
              ctx.globalAlpha = 0.25 - t * 0.06;
              ctx.fillStyle = '#00cc33';
              ctx.fillText(
                charArr[Math.floor(Math.random() * charArr.length)],
                x, ty
              );
            }
          }
          ctx.globalAlpha = 1;
        }

        drops[i] += 0.35 + Math.random() * 0.25;

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = Math.random() * -20;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-25"
      style={{ zIndex: 0 }}
    />
  );
}

// particulas flotantes binarias
function BinaryParticles() {
  const count = typeof window !== 'undefined' && window.innerWidth < 640 ? 15 : 30;
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    char: Math.random() > 0.5 ? '1' : '0',
    left: Math.random() * 100,
    delay: Math.random() * 20,
    duration: 15 + Math.random() * 25,
    size: 9 + Math.random() * 6,
    opacity: 0.03 + Math.random() * 0.08,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute font-mono text-[#00ff41] select-none"
          style={{
            left: `${p.left}%`,
            bottom: '-20px',
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: `binaryFloat ${p.duration}s linear ${p.delay}s infinite`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}

// simbolos ascii flotantes
function AsciiSymbols() {
  const symbols = ['{ }', '</>', '[ ]', '( )', '&&', '=>', '0x', '#!', 'NULL', 'void'];

  const count = typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 14;
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    symbol: symbols[i % symbols.length],
    left: 5 + Math.random() * 90,
    top: 5 + Math.random() * 90,
    delay: Math.random() * 12,
    duration: 12 + Math.random() * 18,
    driftX: -60 + Math.random() * 120,
    driftY: -120 + Math.random() * -60,
    driftR: Math.random() * 180,
    size: 8 + Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute font-mono select-none"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            fontSize: `${item.size}px`,
            color: item.id % 3 === 0 ? '#ff00ff' : item.id % 3 === 1 ? '#00d4ff' : '#00ff41',
            opacity: 0,
            ['--drift-x' as string]: `${item.driftX}px`,
            ['--drift-y' as string]: `${item.driftY}px`,
            ['--drift-r' as string]: `${item.driftR}deg`,
            animation: `asciiDrift ${item.duration}s ease-in-out ${item.delay}s infinite`,
          }}
        >
          {item.symbol}
        </span>
      ))}
    </div>
  );
}

// anillos orbitales
function OrbitalRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      <div
        className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[380px] md:h-[380px] rounded-full border border-[#00ff4110]"
        style={{ animation: 'ringPulse 12s linear infinite' }}
      />
      <div
        className="absolute w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] rounded-full border border-[#00d4ff08]"
        style={{ animation: 'ringPulse 18s linear infinite reverse' }}
      />
      <div
        className="absolute w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] md:w-[580px] md:h-[580px] rounded-full border border-[#ff00ff06]"
        style={{ animation: 'ringPulse 24s linear infinite' }}
      />
      <div className="absolute w-[140px] h-[140px] sm:w-[220px] sm:h-[220px] md:w-[300px] md:h-[300px] rounded-full bg-[#00ff41] opacity-[0.02] blur-[60px] sm:blur-[80px]" />
    </div>
  );
}

// overlay crt
function CRTOverlay() {
  return (
    <div
      className="absolute inset-0 crt-lines opacity-15 sm:opacity-20 pointer-events-none"
      style={{ zIndex: 3 }}
    />
  );
}

// linea de estado
function StatusLine({ aiSettings }: { aiSettings: AISettings }) {
  const [time, setTime] = useState(new Date());
  const provider = getProviderConfig(aiSettings.provider);
  const isOnline = aiSettings.provider !== 'offline' && aiSettings.apiKey.trim().length > 0;

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = time.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div
      className="absolute bottom-3 sm:bottom-6 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 text-[7px] sm:text-[9px] md:text-[10px] font-mono tracking-[0.15em] sm:tracking-[0.2em] opacity-0 animate-fade-in-slow stagger-6 px-2"
      style={{ zIndex: 5 }}
    >
      <span className="text-[#00ff4120]">SYS.ONLINE</span>
      <span className="text-[#00ff4110]">|</span>
      <span className="text-[#00ff4118]">{fmt}</span>
      <span className="text-[#00ff4110]">|</span>
      <span className={isOnline ? 'text-[#00ff4125]' : 'text-[#ffaa0025]'}>
        <span className={`inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isOnline ? 'bg-[#00ff41]' : 'bg-yellow-500'} opacity-40 mr-1 animate-pulse`} />
        {isOnline ? `${provider.name.toUpperCase()} CONNECTED` : 'OFFLINE MODE'}
      </span>
    </div>
  );
}

// componente principal
export function WelcomeScreen({ onSuggestionClick, aiSettings, onOpenSettings }: WelcomeScreenProps) {
  const isOnline = aiSettings.provider !== 'offline' && aiSettings.apiKey.trim().length > 0;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden deep-matrix-bg select-none" style={{ minHeight: '100%' }}>
      <MatrixRain />
      <BinaryParticles />
      <AsciiSymbols />
      <OrbitalRings />
      <CRTOverlay />

      {/* contenido central */}
      <div className="relative flex flex-col items-center justify-center px-4" style={{ zIndex: 5 }}>
        <div className="w-20 sm:w-32 h-px bg-gradient-to-r from-transparent via-[#00ff4133] to-transparent mb-4 sm:mb-8 opacity-0 animate-fade-in-slow stagger-1" />

        <p className="text-[8px] sm:text-[10px] md:text-[11px] font-mono tracking-[0.3em] sm:tracking-[0.5em] text-[#00ff4130] uppercase mb-2 sm:mb-4 opacity-0 animate-fade-in-slow stagger-2">
          neural · engine · v2
        </p>

        {/* titulo VORTEX */}
        <div className="relative vortex-glitch flex items-center justify-center">
          <h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-[0.2em] sm:tracking-[0.3em] text-[#00ff41] animate-glitch-heavy animate-flicker"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              textShadow: '0 0 20px #00ff4155, 0 0 40px #00ff4133, 0 0 80px #00ff4111',
            }}
          >
            VORTEX
          </h1>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-5 opacity-0 animate-fade-in-slow stagger-3">
          <div className="w-5 sm:w-8 h-px bg-[#00ff4122]" />
          <span className="text-[#00ff4140] text-[10px] sm:text-xs font-mono animate-blink">█</span>
          <div className="w-5 sm:w-8 h-px bg-[#00ff4122]" />
        </div>

        {/* estado de IA */}
        <div className="mt-4 sm:mt-6 opacity-0 animate-fade-in-slow stagger-4">
          {isOnline ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#00ff4122] bg-[#00ff4108] px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff41] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff41]" />
              </span>
              <span className="text-[8px] sm:text-[10px] font-mono text-[#00ff4166] tracking-wider">
                {getProviderConfig(aiSettings.provider).name.toUpperCase()} · {aiSettings.model.split('/').pop()?.split('-').slice(0, 3).join('-')?.toUpperCase()}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 rounded-lg border border-[#ffaa0022] bg-[#ffaa0008] px-3 py-1.5 hover:bg-[#ffaa0015] transition-all group cursor-pointer"
            >
              <Settings size={10} className="text-yellow-600 group-hover:animate-spin" />
              <span className="text-[8px] sm:text-[10px] font-mono text-yellow-600/60 tracking-wider group-hover:text-yellow-600/80">
                CONFIGURAR IA
              </span>
            </button>
          )}
        </div>

        <p className="mt-3 sm:mt-4 text-[8px] sm:text-[10px] md:text-xs font-mono tracking-[0.2em] sm:tracking-[0.3em] text-[#00ff4120] uppercase opacity-0 animate-fade-in-slow stagger-4">
          awaiting input
        </p>

        <div className="w-14 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#00ff4120] to-transparent mt-4 sm:mt-8 opacity-0 animate-fade-in-slow stagger-5" />

        <button
          onClick={() => onSuggestionClick('Hola, ¿qué puedes hacer?')}
          className="mt-6 sm:mt-10 opacity-0 animate-fade-in-slow stagger-6 group cursor-pointer border-none bg-transparent"
        >
          <div className="flex items-center gap-2 rounded-lg border border-[#00ff4110] px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-500 group-hover:border-[#00ff4133] group-hover:bg-[#00ff4108] group-hover:shadow-[0_0_30px_#00ff4110] active:scale-95">
            <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.2em] sm:tracking-[0.3em] text-[#00ff4120] transition-colors group-hover:text-[#00ff4150]">
              {'>'} INICIAR_SESION
            </span>
            <span className="text-[#00ff4115] text-[9px] sm:text-[10px] animate-blink transition-colors group-hover:text-[#00ff4140]">_</span>
          </div>
        </button>
      </div>

      <StatusLine aiSettings={aiSettings} />

      {/* esquinas decorativas */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 text-[7px] sm:text-[8px] font-mono text-[#00ff4110] leading-relaxed opacity-0 animate-fade-in-slow stagger-2 hidden xs:block" style={{ zIndex: 5 }}>
        ┌──<br />
        │ 0x<br />
        │
      </div>
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[7px] sm:text-[8px] font-mono text-[#00ff4110] leading-relaxed text-right opacity-0 animate-fade-in-slow stagger-3 hidden xs:block" style={{ zIndex: 5 }}>
        ──┐<br />
        FF │<br />
        &nbsp;&nbsp;│
      </div>
      <div className="absolute bottom-12 sm:bottom-16 left-3 sm:left-4 text-[7px] sm:text-[8px] font-mono text-[#00ff4110] leading-relaxed opacity-0 animate-fade-in-slow stagger-4 hidden xs:block" style={{ zIndex: 5 }}>
        │<br />
        │ $$<br />
        └──
      </div>
      <div className="absolute bottom-12 sm:bottom-16 right-3 sm:right-4 text-[7px] sm:text-[8px] font-mono text-[#00ff4110] leading-relaxed text-right opacity-0 animate-fade-in-slow stagger-5 hidden xs:block" style={{ zIndex: 5 }}>
        &nbsp;&nbsp;│<br />
        ## │<br />
        ──┘
      </div>
    </div>
  );
}
