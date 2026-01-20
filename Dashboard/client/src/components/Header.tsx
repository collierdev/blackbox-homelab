import { Moon, Sun, Server, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  hostname: string;
  connected: boolean;
}

export function Header({ hostname, connected }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Server className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Pi Dashboard</h1>
          <p className="text-sm text-muted-foreground">{hostname || 'Raspberry Pi'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-5 h-5 text-success" />
          ) : (
            <WifiOff className="w-5 h-5 text-destructive" />
          )}
          <span className="text-sm text-muted-foreground">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}
