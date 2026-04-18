import { useState, useEffect } from 'react';
import { X, Plus, Lightbulb, Check } from 'lucide-react';
import type { LightFixture, HALight } from '../../types';

interface FixtureManagementProps {
  isOpen: boolean;
  onClose: () => void;
  fixture?: LightFixture | null; // null for create mode, fixture for edit mode
  availableLights: HALight[];
  onCreate: (data: { name: string; lightIds: string[]; icon?: string; room?: string }) => Promise<LightFixture | null>;
  onUpdate: (id: string, data: { name?: string; lightIds?: string[]; icon?: string; room?: string }) => Promise<LightFixture | null>;
}

const ICON_OPTIONS = [
  { value: '', label: 'Default', emoji: '💡' },
  { value: 'ceiling', label: 'Ceiling', emoji: '💡' },
  { value: 'chandelier', label: 'Chandelier', emoji: '🪔' },
  { value: 'floor', label: 'Floor Lamp', emoji: '🏮' },
  { value: 'table', label: 'Table Lamp', emoji: '🔦' },
  { value: 'strip', label: 'Light Strip', emoji: '✨' },
];

const ROOM_OPTIONS = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Office',
  'Dining Room',
  'Hallway',
  'Garage',
  'Outdoor',
  'Other'
];

export function FixtureManagement({
  isOpen,
  onClose,
  fixture,
  availableLights,
  onCreate,
  onUpdate
}: FixtureManagementProps) {
  const [name, setName] = useState('');
  const [selectedLights, setSelectedLights] = useState<string[]>([]);
  const [icon, setIcon] = useState('');
  const [room, setRoom] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!fixture;

  // Reset form when modal opens/closes or fixture changes
  useEffect(() => {
    if (isOpen && fixture) {
      // Edit mode - populate form
      setName(fixture.name);
      setSelectedLights(fixture.lightIds);
      setIcon(fixture.icon || '');
      const roomValue = fixture.room || '';
      if (ROOM_OPTIONS.includes(roomValue)) {
        setRoom(roomValue);
        setCustomRoom('');
      } else if (roomValue) {
        setRoom('Other');
        setCustomRoom(roomValue);
      } else {
        setRoom('');
        setCustomRoom('');
      }
    } else if (isOpen) {
      // Create mode - reset form
      setName('');
      setSelectedLights([]);
      setIcon('');
      setRoom('');
      setCustomRoom('');
    }
    setError('');
  }, [isOpen, fixture]);

  const handleLightToggle = (entityId: string) => {
    setSelectedLights(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a fixture name');
      return;
    }

    if (selectedLights.length === 0) {
      setError('Please select at least one light');
      return;
    }

    setSaving(true);

    try {
      const roomValue = room === 'Other' ? customRoom : room;
      const data = {
        name: name.trim(),
        lightIds: selectedLights,
        icon: icon || undefined,
        room: roomValue || undefined
      };

      let result;
      if (isEditMode && fixture) {
        result = await onUpdate(fixture.id, data);
      } else {
        result = await onCreate(data);
      }

      if (result) {
        onClose();
      } else {
        setError('Failed to save fixture. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Sort lights: selected first, then alphabetically
  const sortedLights = [...availableLights].sort((a, b) => {
    const aSelected = selectedLights.includes(a.entity_id);
    const bSelected = selectedLights.includes(b.entity_id);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    const aName = a.attributes.friendly_name || a.entity_id;
    const bName = b.attributes.friendly_name || b.entity_id;
    return aName.localeCompare(bName);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {isEditMode ? 'Edit Fixture' : 'Create Light Fixture'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Fixture Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Living Room Lamp"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Icon and Room row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="block text-sm font-medium mb-1">Room</label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No room</option>
                {ROOM_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom room input */}
          {room === 'Other' && (
            <div>
              <label className="block text-sm font-medium mb-1">Custom Room Name</label>
              <input
                type="text"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Light Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Lights ({selectedLights.length} selected)
            </label>
            <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
              {sortedLights.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No lights available
                </div>
              ) : (
                sortedLights.map(light => {
                  const isSelected = selectedLights.includes(light.entity_id);
                  const friendlyName = light.attributes.friendly_name || light.entity_id.split('.')[1];
                  const isOn = light.state === 'on';

                  return (
                    <button
                      key={light.entity_id}
                      type="button"
                      onClick={() => handleLightToggle(light.entity_id)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                        isSelected ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className={`p-1.5 rounded ${isOn ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{friendlyName}</p>
                        <p className="text-xs text-muted-foreground">{light.entity_id}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isOn ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isOn ? 'On' : 'Off'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : (
              <>
                {isEditMode ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditMode ? 'Save Changes' : 'Create Fixture'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
