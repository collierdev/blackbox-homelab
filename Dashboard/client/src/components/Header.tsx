import { Moon, Sun, Server, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  hostname: string;
  connected: boolean;
}

export function Header({ hostname, connected }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-[#0b1326] shadow-[0_1px_0_0_rgba(255,255,255,0.05)] px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10 relative">
          <Server className="w-5 h-5 text-primary" />
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0b1326] ${connected ? 'bg-success' : 'bg-error'}`} />
        </div>
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-primary tracking-widest uppercase">
            {hostname || 'NODE-01'}
          </h1>
          <p className="text-[10px] text-on-surface-variant tracking-widest uppercase font-['Inter']">
            {connected ? 'ONLINE' : 'OFFLINE'} / Pi Dashboard
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-white/5">
          {connected ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-error" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-white/5 transition-colors duration-300"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
