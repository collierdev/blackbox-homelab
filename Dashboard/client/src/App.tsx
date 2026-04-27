import { useState, useEffect } from 'react';
import { Cpu, Home, CalendarDays, Bot, Clipboard, FolderOpen, Moon, Search, Radio, Server, Settings, User } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { SystemStats } from './components/SystemStats';
import { ChatBot } from './components/ChatBot';
import { NotificationPopup } from './components/NotificationPopup';
import { HomeAssistant } from './components/HomeAssistant';
import { useSocket } from './hooks/useSocket';
import CalendarTodoView from './components/CalendarTodoView';
import { DayPlanner } from './components/DayPlanner';
import { VaultEditor } from './components/VaultEditor';
import { DisplayPage } from './components/DisplayPage';
import { SettingsModal, loadSettings } from './components/SettingsModal';

type Tab = 'dashboard' | 'smarthome' | 'calendar' | 'chat' | 'planner' | 'vault';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'System', icon: <Cpu className="w-5 h-5" /> },
  { id: 'smarthome', label: 'Smart Home', icon: <Home className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'chat', label: 'AI Chat', icon: <Bot className="w-5 h-5" /> },
  { id: 'planner', label: 'Planner', icon: <Clipboard className="w-5 h-5" /> },
  { id: 'vault', label: 'Vault', icon: <FolderOpen className="w-5 h-5" /> },
];

function Dashboard() {
  const savedSettings = loadSettings();
  const initialHiddenSections = Array.isArray(savedSettings.smarthomeHiddenSections) ? savedSettings.smarthomeHiddenSections : [];
  const initialHiddenLights = Array.isArray(savedSettings.smarthomeHiddenLights) ? savedSettings.smarthomeHiddenLights : [];
  const initialHiddenCameras = Array.isArray(savedSettings.smarthomeHiddenCameras) ? savedSettings.smarthomeHiddenCameras : [];
  const [activeTab, setActiveTab] = useState<Tab>((savedSettings.defaultTab as Tab) || 'dashboard');
  const [currentTime, setCurrentTime] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nodeName, setNodeName] = useState<string>(savedSettings.nodeName || 'NODE-01');
  const [hiddenSections, setHiddenSections] = useState<string[]>(initialHiddenSections);
  const [hiddenLights, setHiddenLights] = useState<string[]>(initialHiddenLights);
  const [hiddenCameras, setHiddenCameras] = useState<string[]>(initialHiddenCameras);

  // React to settings saves without reload
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.nodeName) setNodeName(detail.nodeName);
      if (detail?.defaultTab) setActiveTab(detail.defaultTab as Tab);
      setHiddenSections(Array.isArray(detail?.smarthomeHiddenSections) ? detail.smarthomeHiddenSections : []);
      setHiddenLights(Array.isArray(detail?.smarthomeHiddenLights) ? detail.smarthomeHiddenLights : []);
      setHiddenCameras(Array.isArray(detail?.smarthomeHiddenCameras) ? detail.smarthomeHiddenCameras : []);
    };
    window.addEventListener('pi-settings-saved', handler);
    return () => window.removeEventListener('pi-settings-saved', handler);
  }, []);

  const {
    stats,
    haDevices,
    haStatus,
    toggleEntity,
    setLightBrightness,
    setLightColor,
    setClimateTemperature,
    mediaPlayerAction,
    setMediaVolume,
    lightFixtures,
    createFixture,
    updateFixture,
    deleteFixture,
    toggleFixture,
    setFixtureBrightness,
    setFixtureColor,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    dismissAllNotifications
  } = useSocket();

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const ipAddress = stats?.network?.interfaces?.[0]?.ip4 || '192.168.50.39';

  const visibleLightCount = (haDevices?.lights?.filter((l) => !hiddenLights.includes(l.entity_id)).length || 0);
  const totalDeviceCount =
    visibleLightCount +
    (haDevices?.switches?.length || 0) +
    (haDevices?.climate?.length || 0) +
    (haDevices?.media_players?.length || 0);

  return (
    <div className="h-screen bg-surface text-on-surface flex overflow-hidden">
      {/* Sidebar — 64px icon-only */}
      <aside
        className="w-16 flex-shrink-0 flex flex-col items-center py-4 gap-1"
        style={{ background: '#0f1a2e' }}
      >
        {/* Logo */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'rgba(173,198,255,0.10)' }}
        >
          <Radio className="w-5 h-5 text-primary" />
        </div>

        {/* Nav items — icon only */}
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all"
            style={
              activeTab === item.id
                ? { background: '#1c2a4a', color: '#adc6ff' }
                : { color: '#8892a4' }
            }
            onMouseEnter={e => {
              if (activeTab !== item.id) {
                (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
                (e.currentTarget as HTMLElement).style.background = '#162040';
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== item.id) {
                (e.currentTarget as HTMLElement).style.color = '#8892a4';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            {item.icon}
            {activeTab === item.id && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                style={{ width: '3px', height: '20px', background: '#adc6ff' }}
              />
            )}
          </button>
        ))}

        {/* Bottom: settings + avatar */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            title="Settings"
            onClick={() => setSettingsOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ color: '#8892a4' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
              (e.currentTarget as HTMLElement).style.background = '#162040';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#8892a4';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <Settings className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#1c2a4a' }}
          >
            <User className="w-4 h-4" style={{ color: '#8892a4' }} />
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — 48px */}
        <header
          className="flex-shrink-0 flex items-center px-5 gap-3"
          style={{ height: '48px', background: '#0f1a2e' }}
        >
          {/* Node info */}
          <div className="flex items-center gap-2.5">
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#162040' }}
            >
              <Server className="w-4 h-4 text-success" />
              <span
                className="absolute rounded-full border-2"
                style={{
                  bottom: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  background: '#22c55e',
                  borderColor: '#0f1a2e',
                }}
              />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{nodeName}</div>
              <div className="leading-tight" style={{ fontSize: '10px', color: '#22c55e' }}>
                ONLINE / {ipAddress}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xs">
            <div
              className="rounded-lg px-3.5 py-1.5 flex items-center gap-2"
              style={{ background: '#162040' }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: '#8892a4' }} />
              <span className="text-sm" style={{ color: '#8892a4' }}>Search commands, files…</span>
              <span
                className="ml-auto rounded px-1.5 py-0.5"
                style={{ fontSize: '11px', color: '#8892a4', background: '#1c2a4a' }}
              >
                ⌘K
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm" style={{ color: '#8892a4' }}>{currentTime}</span>
            <Radio className="w-4 h-4" style={{ color: '#8892a4' }} />
            <Moon className="w-4 h-4" style={{ color: '#8892a4' }} />
            <div className="relative">
              <NotificationPopup
                mode="inline"
                notifications={notifications}
                unreadCount={unreadNotificationCount}
                onMarkAsRead={markNotificationAsRead}
                onMarkAllAsRead={markAllNotificationsAsRead}
                onDismiss={dismissNotification}
                onDismissAll={dismissAllNotifications}
                onNavigateToEvent={(eventId) => {
                  setActiveTab('calendar');
                  console.log('Navigate to event:', eventId);
                }}
                onNavigateToTask={(taskId) => {
                  setActiveTab('calendar');
                  console.log('Navigate to task:', taskId);
                }}
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'dashboard' ? (
            <SystemStats stats={stats} haDevices={haDevices} haStatus={haStatus} hiddenCameraIds={hiddenCameras} />
          ) : activeTab === 'smarthome' ? (
            <div className="h-full overflow-y-auto" style={{ padding: '28px 32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px', color: '#e2e8f0' }}>Environment Control</h1>
                <div style={{ fontSize: '12px', color: '#8892a4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Managing {totalDeviceCount} Active Devices
                </div>
              </div>
              <HomeAssistant
                devices={haDevices}
                status={haStatus}
                hiddenSections={hiddenSections}
                hiddenLights={hiddenLights}
                hiddenCameras={hiddenCameras}
                onToggle={toggleEntity}
                onLightBrightness={setLightBrightness}
                onLightColor={setLightColor}
                onClimateTemperature={setClimateTemperature}
                onMediaAction={mediaPlayerAction}
                onMediaVolume={setMediaVolume}
                fixtures={lightFixtures}
                onFixtureToggle={toggleFixture}
                onFixtureBrightness={setFixtureBrightness}
                onFixtureColor={setFixtureColor}
                onFixtureCreate={createFixture}
                onFixtureUpdate={updateFixture}
                onFixtureDelete={deleteFixture}
              />
            </div>
          ) : activeTab === 'calendar' ? (
            <div className="flex-1 overflow-hidden flex flex-col m-4 rounded-xl" style={{ background: '#162040' }}>
              <CalendarTodoView />
            </div>
          ) : activeTab === 'chat' ? (
            <div className="flex-1 overflow-hidden m-4">
              <ChatBot inline />
            </div>
          ) : activeTab === 'planner' ? (
            <DayPlanner />
          ) : (
            <div className="flex-1 overflow-hidden">
              <VaultEditor />
            </div>
          )}
        </main>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function App() {
  const [isDisplay, setIsDisplay] = useState(
    () => window.location.hash === '#display'
  );

  useEffect(() => {
    const onHash = () => setIsDisplay(window.location.hash === '#display');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (isDisplay) return <DisplayPage />;

  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;
