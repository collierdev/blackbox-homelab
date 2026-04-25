import { useState, useEffect } from 'react';
import { X, Cpu, Wifi, Bot, Bell, Info, CalendarDays, Link2, Unlink } from 'lucide-react';
import type { SyncAccount } from '../types';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'system' | 'connections' | 'ai' | 'calendar' | 'notifications' | 'about';

const C = {
  bg:    '#0b1326',
  l0:    '#0f1a2e',
  l1:    '#121f38',
  l2:    '#162040',
  l3:    '#1c2a4a',
  l4:    '#243356',
  blue:  '#adc6ff',
  amber: '#f7be1d',
  green: '#22c55e',
  red:   '#ffb4ab',
  text:  '#e2e8f0',
  dim:   '#c2c6d6',
  dimmer:'#8892a4',
};

export const SETTINGS_KEY = 'pi-dashboard-settings';

export function loadSettings() {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

const DEFAULTS = {
  nodeName:          'NODE-01',
  updateInterval:    '2',
  defaultTab:        'dashboard',
  haUrl:             'http://192.168.50.39:8123',
  haToken:           '',
  ollamaUrl:         'http://localhost:11434',
  defaultModel:      'llama3.2:latest',
  claudeApiKey:      '',
  calDefaultView:    'month',
  calWeekStart:      'sunday',
  calShowWeekNums:   false,
  calShowDeclined:   false,
  notifySounds:      false,
  notifyDesktop:     false,
  notifyHA:          true,
  notifySystem:      true,
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? C.amber : C.l4,
      boxShadow: on ? `0 0 12px ${C.amber}55` : 'none',
      display: 'flex', alignItems: 'center', padding: '0 3px',
      cursor: 'pointer', transition: 'background 0.2s, box-shadow 0.2s', flexShrink: 0,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: on ? C.bg : C.dimmer, marginLeft: on ? 20 : 0, transition: 'margin 0.2s, background 0.2s' }} />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.dimmer, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: hint ? 4 : 8 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: C.dimmer, marginBottom: 8, opacity: 0.7 }}>{hint}</div>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', mono = false, disabled = false }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; mono?: boolean; disabled?: boolean;
}) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8,
        padding: '10px 14px', fontSize: 13, color: disabled ? C.dimmer : C.text, outline: 'none',
        fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
        boxSizing: 'border-box', opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.15s',
      }}
      onFocus={e => !disabled && (e.currentTarget.style.borderColor = C.blue)}
      onBlur={e => (e.currentTarget.style.borderColor = C.l4)}
    />
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8,
      padding: '10px 14px', fontSize: 13, color: C.text, outline: 'none', cursor: 'pointer',
      boxSizing: 'border-box' as const,
    }}>
      {children}
    </select>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.dimmer, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18, paddingBottom: 10, borderBottom: `1px solid ${C.l3}` }}>{label}</div>
  );
}

function InfoRow({ label, value, mono = false, href }: { label: string; value: string; mono?: boolean; href?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.l3}`, fontSize: 13 }}>
      <span style={{ color: C.dimmer }}>{label}</span>
      {href
        ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit', fontSize: 12, textDecoration: 'none' }}>{value}</a>
        : <span style={{ color: C.text, fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit', fontSize: 12 }}>{value}</span>
      }
    </div>
  );
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'system',        label: 'System',        icon: <Cpu size={16} /> },
  { id: 'connections',   label: 'Connections',   icon: <Wifi size={16} /> },
  { id: 'ai',            label: 'AI & Models',   icon: <Bot size={16} /> },
  { id: 'calendar',      label: 'Calendar',      icon: <CalendarDays size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'about',         label: 'About',         icon: <Info size={16} /> },
];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('system');
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(() => ({ ...DEFAULTS, ...loadSettings() }));
  const [syncAccounts, setSyncAccounts] = useState<SyncAccount[]>([]);
  const [isLoadingSyncAccounts, setIsLoadingSyncAccounts] = useState(false);

  type S = typeof DEFAULTS;
  const set = <K extends keyof S>(key: K, value: S[K]) =>
    setSettings((prev: S) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Sync Claude API key to the key ChatBot already reads
    if (settings.claudeApiKey) localStorage.setItem('claude_api_key', settings.claudeApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Dispatch event so App.tsx can react without reload
    window.dispatchEvent(new CustomEvent('pi-settings-saved', { detail: settings }));
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Sync claude_api_key into settings state on mount
  useEffect(() => {
    const existing = localStorage.getItem('claude_api_key');
    if (existing && !settings.claudeApiKey) set('claudeApiKey', existing);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (activeTab !== 'calendar') return;
    void loadSyncAccounts();
  }, [activeTab]);

  const loadSyncAccounts = async () => {
    setIsLoadingSyncAccounts(true);
    try {
      const response = await fetch('/api/sync/accounts');
      if (!response.ok) return;
      const data = await response.json();
      setSyncAccounts(data);
    } catch (error) {
      console.error('Failed to load sync accounts:', error);
    } finally {
      setIsLoadingSyncAccounts(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!confirm('Disconnect this calendar account?')) return;
    try {
      const response = await fetch(`/api/sync/accounts/${accountId}`, { method: 'DELETE' });
      if (!response.ok) {
        alert('Failed to disconnect account');
        return;
      }
      await loadSyncAccounts();
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      alert('Failed to disconnect account');
    }
  };

  const handleConnectCalendar = (provider: 'google' | 'microsoft' | 'caldav') => {
    alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar sync will be available soon! OAuth integration is currently being implemented.`);
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
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.l1, borderRadius: 16, width: 700, maxHeight: '82vh',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header row — no bottom border, just padding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: C.text }}>Settings</span>
            <span style={{ fontSize: 12, color: C.dimmer }}>Dashboard configuration &amp; preferences</span>
          </div>
          <button onClick={onClose} style={{ color: C.dimmer, padding: 4, display: 'flex', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '20px 28px 0' }}>

          {/* Left nav */}
          <div style={{ width: 148, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, marginRight: 24 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  background: activeTab === tab.id ? C.l3 : 'transparent',
                  color: activeTab === tab.id ? C.blue : C.dimmer,
                  position: 'relative', textAlign: 'left',
                }}
              >
                {activeTab === tab.id && (
                  <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: C.blue, borderRadius: '0 2px 2px 0' }} />
                )}
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'thin', scrollbarColor: `${C.l4} transparent` }}>

            {activeTab === 'system' && (
              <div>
                <SectionLabel label="Display" />
                <Field label="Node Name" hint="Shown in the top header bar.">
                  <TextInput value={settings.nodeName} onChange={v => set('nodeName', v)} placeholder="NODE-01" />
                </Field>
                <Field label="Default Tab" hint="Which screen opens when the dashboard loads.">
                  <Select value={settings.defaultTab} onChange={v => set('defaultTab', v)}>
                    <option value="dashboard">System</option>
                    <option value="smarthome">Smart Home</option>
                    <option value="calendar">Calendar</option>
                    <option value="planner">Planner</option>
                    <option value="vault">Vault</option>
                    <option value="chat">AI Chat</option>
                  </Select>
                </Field>
                <SectionLabel label="Performance" />
                <Field label="Stats Update Interval (seconds)" hint="How often system metrics refresh via WebSocket.">
                  <TextInput value={settings.updateInterval} onChange={v => set('updateInterval', v)} placeholder="2" />
                </Field>
              </div>
            )}

            {activeTab === 'connections' && (
              <div>
                <SectionLabel label="Home Assistant" />
                <Field label="URL" hint="Base URL of your Home Assistant instance.">
                  <TextInput value={settings.haUrl} onChange={v => set('haUrl', v)} placeholder="http://192.168.50.39:8123" />
                </Field>
                <Field label="Long-Lived Access Token" hint="Profile → Security → Long-Lived Access Tokens.">
                  <TextInput value={settings.haToken} onChange={v => set('haToken', v)} placeholder="eyJ0eXAiOiJKV1Q…" type="password" mono />
                </Field>
                <div style={{ background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: C.dimmer, marginBottom: 20, lineHeight: 1.7 }}>
                  These values are stored locally as reference. To activate server-side, set <code style={{ fontFamily: "'JetBrains Mono', monospace", color: C.blue }}>HA_URL</code> and <code style={{ fontFamily: "'JetBrains Mono', monospace", color: C.blue }}>HA_TOKEN</code> in your Docker environment and redeploy.
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div>
                <SectionLabel label="Ollama (Local LLM)" />
                <Field label="Ollama URL">
                  <TextInput value={settings.ollamaUrl} onChange={v => set('ollamaUrl', v)} placeholder="http://localhost:11434" />
                </Field>
                <Field label="Default Model" hint="Pre-selected model when opening AI Chat.">
                  <TextInput value={settings.defaultModel} onChange={v => set('defaultModel', v)} placeholder="llama3.2:latest" mono />
                </Field>
                <SectionLabel label="Claude (Anthropic)" />
                <Field label="API Key" hint="Required to switch to the Claude provider in AI Chat.">
                  <TextInput value={settings.claudeApiKey} onChange={v => set('claudeApiKey', v)} placeholder="sk-ant-api03-…" type="password" mono />
                </Field>
                <div style={{ background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: C.dimmer, lineHeight: 1.7 }}>
                  Saving the Claude key here syncs it to the AI Chat session immediately. For server-side use, set <code style={{ fontFamily: "'JetBrains Mono', monospace", color: C.blue }}>CLAUDE_API_KEY</code> in Docker and redeploy.
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div>
                <SectionLabel label="Display" />
                <Field label="Default View" hint="Which view opens when switching to Calendar.">
                  <Select value={settings.calDefaultView} onChange={v => set('calDefaultView', v)}>
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                    <option value="2month">2 Months</option>
                    <option value="circular">Circular</option>
                  </Select>
                </Field>
                <Field label="Week Starts On">
                  <Select value={settings.calWeekStart} onChange={v => set('calWeekStart', v)}>
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </Select>
                </Field>
                <SectionLabel label="Visibility" />
                {([
                  { key: 'calShowWeekNums' as const, label: 'Show Week Numbers',   desc: 'Display ISO week number in each row' },
                  { key: 'calShowDeclined' as const, label: 'Show Declined Events', desc: 'Include events you declined in the grid' },
                ] as const).map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: `1px solid ${C.l3}` }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: C.dimmer, marginTop: 3 }}>{item.desc}</div>
                    </div>
                    <Toggle on={settings[item.key] as boolean} onChange={v => set(item.key, v)} />
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  <SectionLabel label="Calendar Linking" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 14 }}>
                    {isLoadingSyncAccounts ? (
                      <div style={{ background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.dimmer }}>
                        Loading linked calendars...
                      </div>
                    ) : syncAccounts.length > 0 ? (
                      syncAccounts.map(account => (
                        <div
                          key={account.id}
                          style={{
                            background: C.l0,
                            border: `1px solid ${C.l4}`,
                            borderRadius: 8,
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{getProviderName(account.provider)}</div>
                            <div style={{ fontSize: 11, color: C.dimmer, marginTop: 2 }}>{account.email}</div>
                          </div>
                          <button
                            onClick={() => handleDisconnectAccount(account.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.red, background: C.l2, border: `1px solid ${C.l4}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}
                            title="Disconnect calendar"
                          >
                            <Unlink size={13} />
                            Disconnect
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.dimmer }}>
                        No calendars linked yet.
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                    {(['google', 'microsoft', 'caldav'] as const).map(provider => (
                      <button
                        key={provider}
                        onClick={() => handleConnectCalendar(provider)}
                        style={{ background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8, padding: '10px 8px', color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Link2 size={13} color={C.blue} />
                        {provider === 'google' ? 'Google' : provider === 'microsoft' ? 'Outlook' : 'CalDAV'}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, background: C.l0, border: `1px solid ${C.l4}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: C.dimmer, lineHeight: 1.7 }}>
                    Link your external calendars here. Connected accounts sync events into this dashboard calendar.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <SectionLabel label="Alert Channels" />
                {([
                  { key: 'notifySystem'  as const, label: 'System Alerts',        desc: 'CPU, memory, temperature threshold warnings' },
                  { key: 'notifyHA'      as const, label: 'Smart Home Events',    desc: 'Home Assistant device state changes' },
                  { key: 'notifyDesktop' as const, label: 'Desktop Notifications',desc: 'Browser push notifications' },
                  { key: 'notifySounds'  as const, label: 'Alert Sounds',         desc: 'Audio cue on critical system alerts' },
                ] as const).map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: `1px solid ${C.l3}` }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: C.dimmer, marginTop: 3 }}>{item.desc}</div>
                    </div>
                    <Toggle on={settings[item.key] as boolean} onChange={v => set(item.key, v)} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div>
                <SectionLabel label="Dashboard" />
                <InfoRow label="Version"    value="1.0.0" />
                <InfoRow label="Build"      value="Production" />
                <InfoRow label="Runtime"    value="Node.js 24 · React 18" />
                <InfoRow label="Platform"   value="Raspberry Pi 5 · ARM64" mono />
                <InfoRow label="OS"         value="Debian GNU/Linux 13 (trixie)" />
                <InfoRow label="IP Address" value="192.168.50.39" mono />
                <SectionLabel label="Services" />
                <InfoRow label="Home Assistant" value="http://ha.blackbox"            href="http://ha.blackbox" mono />
                <InfoRow label="go2rtc"         value="http://go2rtc.blackbox"        href="http://go2rtc.blackbox" mono />
                <InfoRow label="Jellyfin"       value="http://jellyfin.blackbox"      href="http://jellyfin.blackbox" mono />
                <InfoRow label="n8n"            value="http://n8n.blackbox"           href="http://n8n.blackbox" mono />
                <InfoRow label="Portainer"      value="http://blackbox/portainer"     href="http://blackbox/portainer" mono />
                <InfoRow label="Ollama"         value="http://localhost:11434" mono />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px 24px' }}>
          {activeTab !== 'about' ? (
            <>
              <button
                onClick={handleReset}
                style={{ fontSize: 12, color: C.dimmer, padding: '7px 16px', borderRadius: 8, background: C.l3, cursor: 'pointer' }}
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                style={{
                  fontSize: 13, fontWeight: 600, color: saved ? C.bg : C.bg,
                  padding: '9px 22px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s',
                  background: saved ? C.green : C.blue,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {saved ? '✓ Saved' : 'Save Changes'}
              </button>
            </>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
