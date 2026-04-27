import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Link2, Unlink, Palette } from 'lucide-react';
import ColorPicker from '../shared/ColorPicker';
import type { Project, SyncAccount } from '../../types';

interface CalendarSettingsProps {
  projects: Project[];
  onClose: () => void;
  onCreateProject: (name: string, color: string) => Promise<void>;
  onUpdateProject: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export default function CalendarSettings({
  projects,
  onClose,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: CalendarSettingsProps) {
  const [activeTab, setActiveTab] = useState<'sync' | 'projects'>('sync');
  const [syncAccounts, setSyncAccounts] = useState<SyncAccount[]>([]);
  const [isLoadingSyncAccounts, setIsLoadingSyncAccounts] = useState(false);

  // Project form state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectColor, setEditProjectColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // Load sync accounts
  useEffect(() => {
    if (activeTab === 'sync') {
      loadSyncAccounts();
    }
  }, [activeTab]);

  const loadSyncAccounts = async () => {
    setIsLoadingSyncAccounts(true);
    try {
      const response = await fetch('/api/sync/accounts');
      if (response.ok) {
        const data = await response.json();
        setSyncAccounts(data);
      }
    } catch (error) {
      console.error('Failed to load sync accounts:', error);
    } finally {
      setIsLoadingSyncAccounts(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar? Events will not be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sync/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSyncAccounts();
      } else {
        alert('Failed to disconnect account');
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      alert('Failed to disconnect account');
    }
  };

  const handleConnectCalendar = async (provider: 'google' | 'microsoft' | 'caldav') => {
    try {
      if (provider === 'caldav') {
        const serverUrl = prompt('CalDAV server URL (example: https://caldav.icloud.com)');
        if (!serverUrl) return;
        const username = prompt('CalDAV username (often your email)');
        if (!username) return;
        const password = prompt('CalDAV app password');
        if (!password) return;

        const response = await fetch('/api/sync/caldav/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverUrl,
            username,
            password,
            email: username,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || body.error || 'Failed to connect CalDAV calendar');
        }

        await loadSyncAccounts();
        alert('CalDAV calendar connected and synced.');
        return;
      }

      const popup = window.open(
        `/api/sync/${provider}/auth`,
        `${provider}-calendar-auth`,
        'width=620,height=760'
      );

      if (!popup) {
        alert('Popup blocked. Please allow popups and try again.');
        return;
      }

      const listener = async (event: MessageEvent) => {
        if (event.data?.source !== 'pi-dashboard-sync') return;
        window.removeEventListener('message', listener);
        await loadSyncAccounts();
        if (event.data.success) {
          alert(event.data.message || 'Calendar connected successfully.');
        } else {
          alert(event.data.message || 'Calendar connection failed.');
        }
      };

      window.addEventListener('message', listener);
    } catch (error: any) {
      console.error('Failed to connect calendar:', error);
      alert(error.message || 'Failed to connect calendar');
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      await onCreateProject(newProjectName.trim(), newProjectColor);
      setNewProjectName('');
      setNewProjectColor(PRESET_COLORS[0]);
      setIsAddingProject(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  const handleStartEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectColor(project.color);
  };

  const handleSaveEditProject = async () => {
    if (!editingProjectId || !editProjectName.trim()) return;

    try {
      await onUpdateProject(editingProjectId, {
        name: editProjectName.trim(),
        color: editProjectColor,
      });
      setEditingProjectId(null);
      setEditProjectName('');
      setEditProjectColor('');
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project');
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditProjectName('');
    setEditProjectColor('');
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? Events in this project will be moved to "No Project".`)) {
      return;
    }

    try {
      await onDeleteProject(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const getSyncStatusStyle = (status: SyncAccount['status']) => {
    const styles: Record<string, { color: string; background: string }> = {
      connected: { color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)' },
      error: { color: '#ffb4ab', background: 'rgba(255, 180, 171, 0.15)' },
      syncing: { color: '#adc6ff', background: 'rgba(173, 198, 255, 0.15)' },
    };
    return styles[status] || styles.connected;
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: 'Google Calendar',
      microsoft: 'Microsoft Outlook',
      caldav: 'CalDAV',
    };
    return names[provider] || provider;
  };

  const inputStyle = {
    background: '#162040',
    border: '1px solid #243356',
    color: '#e2e8f0',
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        style={{ background: '#1c2a4a', border: '1px solid #243356' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid #243356' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Calendar Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#8892a4' }}
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 px-6 pt-4"
          style={{ borderBottom: '1px solid #243356' }}
        >
          <button
            onClick={() => setActiveTab('sync')}
            className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
            style={
              activeTab === 'sync'
                ? { background: '#162040', color: '#adc6ff', borderBottom: '2px solid #adc6ff' }
                : { color: '#8892a4' }
            }
          >
            Calendar Sync
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
            style={
              activeTab === 'projects'
                ? { background: '#162040', color: '#adc6ff', borderBottom: '2px solid #adc6ff' }
                : { color: '#8892a4' }
            }
          >
            Projects
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'sync' ? (
            <div className="space-y-6">
              {/* Calendar Sync Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#e2e8f0' }}>
                  Connected Calendars
                </h3>

                {isLoadingSyncAccounts ? (
                  <p style={{ color: '#8892a4' }}>Loading...</p>
                ) : syncAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {syncAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ background: '#162040', border: '1px solid #243356' }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium" style={{ color: '#e2e8f0' }}>
                              {getProviderName(account.provider)}
                            </span>
                            <span
                              className="px-2 py-0.5 text-xs font-medium rounded-full"
                              style={getSyncStatusStyle(account.status)}
                            >
                              {account.status}
                            </span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: '#8892a4' }}>{account.email}</p>
                          {account.lastSync && (
                            <p className="text-xs mt-1" style={{ color: '#8892a4' }}>
                              Last synced: {new Date(account.lastSync).toLocaleString()}
                            </p>
                          )}
                          {account.errorMessage && (
                            <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>{account.errorMessage}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDisconnectAccount(account.id)}
                          className="ml-4 p-2 rounded-lg transition-colors"
                          style={{ color: '#ffb4ab' }}
                          aria-label="Disconnect calendar"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="italic" style={{ color: '#8892a4' }}>No calendars connected yet</p>
                )}
              </div>

              {/* Connect New Calendar */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#e2e8f0' }}>
                  Connect a Calendar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['google', 'microsoft', 'caldav'] as const).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleConnectCalendar(provider)}
                      className="flex items-center justify-center gap-2 p-4 rounded-lg transition-colors group"
                      style={{ background: '#162040', border: '2px solid #243356' }}
                    >
                      <Link2 className="w-5 h-5" style={{ color: '#8892a4' }} />
                      <span className="font-medium" style={{ color: '#e2e8f0' }}>
                        {provider === 'google' ? 'Google Calendar' : provider === 'microsoft' ? 'Outlook/iCloud' : 'CalDAV'}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: '#8892a4' }}>
                  Note: Calendar sync with OAuth is currently in development. You'll be able to connect your calendars soon!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Projects List */}
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 rounded-lg"
                    style={{ background: '#162040', border: '1px solid #243356' }}
                  >
                    {editingProjectId === project.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {/* Color Button */}
                          <button
                            onClick={() => setShowColorPicker(showColorPicker === project.id ? null : project.id)}
                            className="relative w-10 h-10 rounded-lg border-2 transition-colors group"
                            style={{
                              backgroundColor: editProjectColor,
                              borderColor: '#243356',
                            }}
                            title="Choose color"
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                              <Palette className="w-4 h-4 text-white" />
                            </div>
                          </button>

                          {/* Name Input */}
                          <input
                            type="text"
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={inputStyle}
                            placeholder="Project name"
                            autoFocus
                          />

                          {/* Actions */}
                          <button
                            onClick={handleSaveEditProject}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#22c55e' }}
                            aria-label="Save"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              handleCancelEdit();
                              setShowColorPicker(null);
                            }}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#8892a4' }}
                            aria-label="Cancel"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Color Picker */}
                        {showColorPicker === project.id && (
                          <div
                            className="p-4 rounded-lg"
                            style={{ background: '#1c2a4a', border: '1px solid #243356' }}
                          >
                            <ColorPicker
                              color={editProjectColor}
                              onChange={(color) => setEditProjectColor(color)}
                              showPresets={true}
                              presetColors={PRESET_COLORS}
                              label="Project Color"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* Color Badge */}
                        <div
                          className="w-10 h-10 rounded-lg shadow-sm"
                          style={{ backgroundColor: project.color, border: '2px solid #243356' }}
                        />

                        {/* Project Name */}
                        <span className="flex-1 font-medium" style={{ color: '#e2e8f0' }}>
                          {project.name}
                        </span>

                        {/* Actions */}
                        <button
                          onClick={() => handleStartEditProject(project)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#adc6ff' }}
                          aria-label="Edit project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#ffb4ab' }}
                          aria-label="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Project */}
              {isAddingProject ? (
                <div
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(173, 198, 255, 0.08)', border: '2px solid #adc6ff' }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {/* Color Button */}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === 'new' ? null : 'new')}
                        className="relative w-10 h-10 rounded-lg border-2 transition-colors group"
                        style={{ backgroundColor: newProjectColor, borderColor: '#243356' }}
                        title="Choose color"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <Palette className="w-4 h-4 text-white" />
                        </div>
                      </button>

                      {/* Name Input */}
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
                        className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={inputStyle}
                        placeholder="Project name"
                        autoFocus
                      />

                      {/* Actions */}
                      <button
                        onClick={handleAddProject}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#22c55e' }}
                        aria-label="Add project"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingProject(false);
                          setNewProjectName('');
                          setNewProjectColor(PRESET_COLORS[0]);
                          setShowColorPicker(null);
                        }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#8892a4' }}
                        aria-label="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Color Picker */}
                    {showColorPicker === 'new' && (
                      <div
                        className="p-4 rounded-lg"
                        style={{ background: '#1c2a4a', border: '1px solid #243356' }}
                      >
                        <ColorPicker
                          color={newProjectColor}
                          onChange={(color) => setNewProjectColor(color)}
                          showPresets={true}
                          presetColors={PRESET_COLORS}
                          label="Project Color"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingProject(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg transition-colors"
                  style={{
                    background: '#162040',
                    border: '2px dashed #243356',
                    color: '#8892a4',
                  }}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add New Project</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 p-6"
          style={{ borderTop: '1px solid #243356' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg transition-colors"
            style={{ background: '#adc6ff', color: '#0b1326' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
