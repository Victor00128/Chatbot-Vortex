import { Skull } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-2 sm:gap-3 px-2.5 py-3 sm:px-4 md:px-6 sm:py-4 animate-fade-in bg-[#00ff4105] border-l-2 border-[#00ff4122]">
      <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00cc33] to-[#009922] shadow-lg shadow-[#00ff4133]">
        <Skull size={13} className="text-black" />
      </div>
      <div>
        <div className="mb-1 sm:mb-1.5 flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#00ff41] uppercase">
            VORTEX
          </span>
          <span className="text-[9px] sm:text-[10px] text-[#00ff4144] font-mono">procesando...</span>
        </div>
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {[0, 1].map((j) => (
                <div
                  key={j}
                  className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-sm bg-[#00ff41]"
                  style={{
                    animation: `typing-bounce 1.4s ease-in-out ${(i * 2 + j) * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          ))}
          <span className="ml-2 text-[9px] sm:text-[10px] font-mono text-[#00ff4133] animate-blink">
            ▊
          </span>
        </div>
      </div>
    </div>
  );
}
