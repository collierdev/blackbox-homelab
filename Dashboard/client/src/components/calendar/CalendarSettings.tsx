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
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // Track which project's color picker is open

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

  const handleConnectCalendar = (provider: 'google' | 'microsoft' | 'caldav') => {
    // For now, show a message that OAuth is coming soon
    alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar sync will be available soon! OAuth integration is currently being implemented.`);

    // In the future, this will redirect to OAuth flow:
    // window.location.href = `/api/sync/${provider}/auth`;
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

  const getSyncStatusBadge = (status: SyncAccount['status']) => {
    const badges = {
      connected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      syncing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return badges[status] || badges.connected;
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: 'Google Calendar',
      microsoft: 'Microsoft Outlook',
      caldav: 'CalDAV',
    };
    return names[provider] || provider;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Calendar Sync
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Connected Calendars
                </h3>

                {isLoadingSyncAccounts ? (
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                ) : syncAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {syncAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {getProviderName(account.provider)}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSyncStatusBadge(account.status)}`}>
                              {account.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{account.email}</p>
                          {account.lastSync && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Last synced: {new Date(account.lastSync).toLocaleString()}
                            </p>
                          )}
                          {account.errorMessage && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{account.errorMessage}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDisconnectAccount(account.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          aria-label="Disconnect calendar"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No calendars connected yet</p>
                )}
              </div>

              {/* Connect New Calendar */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Connect a Calendar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleConnectCalendar('google')}
                    className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-colors group"
                  >
                    <Link2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Google Calendar</span>
                  </button>
                  <button
                    onClick={() => handleConnectCalendar('microsoft')}
                    className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-colors group"
                  >
                    <Link2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Outlook/iCloud</span>
                  </button>
                  <button
                    onClick={() => handleConnectCalendar('caldav')}
                    className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-colors group"
                  >
                    <Link2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">CalDAV</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
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
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    {editingProjectId === project.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {/* Color Button */}
                          <button
                            onClick={() => setShowColorPicker(showColorPicker === project.id ? null : project.id)}
                            className="relative w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-500 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                            style={{ backgroundColor: editProjectColor }}
                            title="Choose color"
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                              <Palette className="w-4 h-4 text-white" />
                            </div>
                          </button>

                          {/* Name Input */}
                          <input
                            type="text"
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Project name"
                            autoFocus
                          />

                          {/* Actions */}
                          <button
                            onClick={handleSaveEditProject}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            aria-label="Save"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              handleCancelEdit();
                              setShowColorPicker(null);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            aria-label="Cancel"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Color Picker */}
                        {showColorPicker === project.id && (
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
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
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-500 shadow-sm"
                          style={{ backgroundColor: project.color }}
                        />

                        {/* Project Name */}
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </span>

                        {/* Actions */}
                        <button
                          onClick={() => handleStartEditProject(project)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          aria-label="Edit project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {/* Color Button */}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === 'new' ? null : 'new')}
                        className="relative w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-500 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                        style={{ backgroundColor: newProjectColor }}
                        title="Choose color"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                          <Palette className="w-4 h-4 text-white" />
                        </div>
                      </button>

                      {/* Name Input */}
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Project name"
                        autoFocus
                      />

                      {/* Actions */}
                      <button
                        onClick={handleAddProject}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
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
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        aria-label="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Color Picker */}
                    {showColorPicker === 'new' && (
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
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
                  className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-colors group"
                >
                  <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                  <span className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-500">
                    Add New Project
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
