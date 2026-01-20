import { useState, useEffect } from 'react';
import { LayoutDashboard, Home, CalendarDays } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { SystemStats } from './components/SystemStats';
import { Services } from './components/Services';
import { ChatBot } from './components/ChatBot';
import { HomeAssistant } from './components/HomeAssistant';
import { CamerasSection } from './components/go2rtc/CamerasSection';
import { DraggableSection } from './components/DraggableSection';
import { useSocket } from './hooks/useSocket';
import CalendarTodoView from './components/CalendarTodoView';

type Tab = 'dashboard' | 'smarthome' | 'calendar';

// Section IDs for drag-and-drop
type SectionId = 'system-overview' | 'cameras' | 'services' | 'smart-home';

// Default section order (Security Cameras ABOVE Services as requested)
const DEFAULT_SECTION_ORDER: SectionId[] = [
  'system-overview',
  'cameras',
  'services',
  'smart-home',
];

const STORAGE_KEY = 'pi-dashboard-section-order';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(() => {
    // Load order from localStorage or use default
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that all sections exist
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SECTION_ORDER.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load section order:', e);
    }
    return DEFAULT_SECTION_ORDER;
  });

  const {
    stats,
    connected,
    haDevices,
    haStatus,
    toggleEntity,
    setLightBrightness,
    setLightColor,
    setClimateTemperature,
    mediaPlayerAction,
    setMediaVolume
  } = useSocket();

  // Save section order to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sectionOrder));
    } catch (e) {
      console.error('Failed to save section order:', e);
    }
  }, [sectionOrder]);

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as SectionId);
        const newIndex = items.indexOf(over.id as SectionId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Section component mapping
  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'system-overview':
        return (
          <DraggableSection id={sectionId} key={sectionId}>
            <h2 className="text-xl font-bold text-foreground mb-4">System Overview</h2>
            <SystemStats stats={stats} />
          </DraggableSection>
        );

      case 'cameras':
        return (
          <DraggableSection id={sectionId} key={sectionId}>
            <CamerasSection defaultExpanded={true} />
          </DraggableSection>
        );

      case 'services':
        return (
          <DraggableSection id={sectionId} key={sectionId}>
            <Services />
          </DraggableSection>
        );

      case 'smart-home':
        return (
          <DraggableSection id={sectionId} key={sectionId}>
            <HomeAssistant
              devices={haDevices}
              status={haStatus}
              collapsed
              onToggle={toggleEntity}
              onLightBrightness={setLightBrightness}
              onLightColor={setLightColor}
              onClimateTemperature={setClimateTemperature}
              onMediaAction={mediaPlayerAction}
              onMediaVolume={setMediaVolume}
            />
          </DraggableSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header hostname={stats?.hostname || ''} connected={connected} />

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-6">
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="System"
            />
            <TabButton
              active={activeTab === 'smarthome'}
              onClick={() => setActiveTab('smarthome')}
              icon={<Home className="w-4 h-4" />}
              label="Smart Home"
            />
            <TabButton
              active={activeTab === 'calendar'}
              onClick={() => setActiveTab('calendar')}
              icon={<CalendarDays className="w-4 h-4" />}
              label="Calendar & Tasks"
            />
          </div>
        </div>
      </nav>

      <main className={activeTab === 'calendar'
        ? 'container mx-auto px-4 py-4 h-[calc(100vh-120px)] flex flex-col'
        : 'container mx-auto px-6 py-6 space-y-8'
      }>
        {activeTab === 'dashboard' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionOrder}
              strategy={verticalListSortingStrategy}
            >
              {sectionOrder.map((sectionId) => renderSection(sectionId))}
            </SortableContext>
          </DndContext>
        ) : activeTab === 'smarthome' ? (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Smart Home Control</h2>
            <HomeAssistant
              devices={haDevices}
              status={haStatus}
              onToggle={toggleEntity}
              onLightBrightness={setLightBrightness}
              onLightColor={setLightColor}
              onClimateTemperature={setClimateTemperature}
              onMediaAction={mediaPlayerAction}
              onMediaVolume={setMediaVolume}
            />
          </section>
        ) : (
          <div className="h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col">
            <CalendarTodoView />
          </div>
        )}
      </main>

      <ChatBot />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;
