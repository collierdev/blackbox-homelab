import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Folder,
  FileText,
  FilePlus,
  FolderPlus,
  Trash2,
  Save,
  Eye,
  Code,
  ArrowLeft,
  Send,
  Settings,
  Loader2,
  RefreshCw,
  Home,
  AlignLeft,
  Bot,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const C = {
  bg: '#0b1326', l1: '#121f38', l2: '#162040', l3: '#1c2a4a', l4: '#243356',
  blue: '#adc6ff', amber: '#f7be1d', green: '#22c55e', red: '#ffb4ab',
  text: '#e2e8f0', dim: '#c2c6d6', dimmer: '#8892a4',
};

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension: string | null;
}

interface BrowseResult {
  path: string;
  items: FileEntry[];
  parent: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ModelProvider = 'ollama' | 'claude' | 'gemini';

interface ModelConfig {
  provider: ModelProvider;
  ollamaModel: string;
  claudeKey: string;
  claudeModel: string;
  geminiKey: string;
  geminiModel: string;
}

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'ollama',
  ollamaModel: 'llama3.2:latest',
  claudeKey: '',
  claudeModel: 'claude-sonnet-4-6',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
};

const ROOT_PATH = '/home/jwcollie';

const BOOKMARKS = [
  { label: 'Home', path: '/home/jwcollie' },
  { label: 'Dashboard', path: '/home/jwcollie/Dashboard' },
  { label: 'Shared', path: '/blackbox/shared' },
  { label: 'Documents', path: '/blackbox/documents' },
];

function fileColor(ext: string | null): string {
  return ({ py: C.amber, js: C.blue, ts: C.blue, md: C.green, css: '#ff8a80', json: '#ff8a80' } as Record<string, string>)[ext?.slice(1) || ''] || C.dimmer;
}

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultValue; }
    catch { return defaultValue; }
  });
  const set = useCallback((v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [value, set] as const;
}

export function VaultEditor() {
  const [currentPath, setCurrentPath] = useState(ROOT_PATH);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [parentPath, setParentPath] = useState('');
  const [browseError, setBrowseError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Tabs
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [savedContents, setSavedContents] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showSettings, setShowSettings] = useState(false);
  const [customPath, setCustomPath] = useState('');

  // AI state
  const [modelConfig, setModelConfig] = useLocalStorage<ModelConfig>('vault-model-config', DEFAULT_CONFIG);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  // Create dialog
  const [createDialog, setCreateDialog] = useState<{ type: 'file' | 'dir' } | null>(null);
  const [newName, setNewName] = useState('');

  const browse = useCallback(async (path: string) => {
    setBrowseError('');
    try {
      const res = await fetch(`/api/vault/browse?path=${encodeURIComponent(path)}`);
      if (!res.ok) { const err = await res.json(); setBrowseError(err.error || 'Failed to browse'); return; }
      const data: BrowseResult = await res.json();
      setEntries(data.items);
      setCurrentPath(data.path);
      setParentPath(data.parent);
    } catch { setBrowseError('Network error'); }
  }, []);

  useEffect(() => { browse(ROOT_PATH); }, [browse]);
  useEffect(() => {
    fetch('/api/chat/models').then(r => r.json()).then(m => setOllamaModels(m.map((x: {name:string}) => x.name))).catch(() => {});
  }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const content = activeFile ? (fileContents[activeFile] || '') : '';
  const savedContent = activeFile ? (savedContents[activeFile] || '') : '';
  const isDirty = content !== savedContent;
  const fileName = activeFile ? activeFile.split('/').pop() : null;

  const EDITABLE_EXTS = ['.md', '.mdx', '.txt', '.sh', '.py', '.js', '.ts', '.json', '.yaml', '.yml', '.env', '.conf', '.cfg', '.ini', '.toml'];

  const openEntry = async (entry: FileEntry) => {
    if (entry.isDirectory) { browse(entry.path); return; }
    if (!entry.extension || EDITABLE_EXTS.includes(entry.extension)) {
      if (!openTabs.includes(entry.path)) setOpenTabs(prev => [...prev, entry.path]);
      setActiveFile(entry.path);
      if (!(entry.path in fileContents)) {
        setLoading(true);
        try {
          const res = await fetch(`/api/vault/read?path=${encodeURIComponent(entry.path)}`);
          if (res.ok) {
            const data = await res.json();
            setFileContents(prev => ({ ...prev, [entry.path]: data.content }));
            setSavedContents(prev => ({ ...prev, [entry.path]: data.content }));
          }
        } finally { setLoading(false); }
      }
    }
  };

  const closeTab = (path: string) => {
    const idx = openTabs.indexOf(path);
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeFile === path) {
      setActiveFile(newTabs[Math.min(idx, newTabs.length - 1)] || null);
    }
  };

  const setContent = (c: string) => {
    if (!activeFile) return;
    setFileContents(prev => ({ ...prev, [activeFile]: c }));
  };

  const save = async (path = activeFile, value = content) => {
    if (!path) return;
    setSaving(true);
    try {
      const res = await fetch('/api/vault/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content: value }),
      });
      if (res.ok) setSavedContents(prev => ({ ...prev, [path]: value }));
    } finally { setSaving(false); }
  };

  // Autosave current file shortly after edits.
  useEffect(() => {
    if (!activeFile) return;
    if (!isDirty) return;
    const autosaveTimer = setTimeout(() => {
      void save(activeFile, content);
    }, 600);
    return () => clearTimeout(autosaveTimer);
  }, [activeFile, content, isDirty]);

  const createEntry = async () => {
    if (!newName || !createDialog) return;
    const targetPath = `${currentPath}/${newName}`;
    await fetch('/api/vault/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath, type: createDialog.type }),
    });
    setCreateDialog(null);
    setNewName('');
    browse(currentPath);
  };

  const deleteEntry = async (entry: FileEntry) => {
    if (!confirm(`Delete "${entry.name}"?`)) return;
    await fetch(`/api/vault/delete?path=${encodeURIComponent(entry.path)}`, { method: 'DELETE' });
    if (activeFile === entry.path) { closeTab(entry.path); }
    browse(currentPath);
  };

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    const systemPrompt = activeFile
      ? `You are PiAssistant, an AI code assistant. The user is editing: ${activeFile}\n\nFile content:\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``
      : 'You are PiAssistant, an AI code assistant in the Intelligence Console editor.';
    const allMessages = [{ role: 'system' as const, content: systemPrompt }, ...messages, userMsg];
    try {
      if (modelConfig.provider === 'ollama') {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        const res = await fetch('/api/chat/ollama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelConfig.ollamaModel, messages: allMessages }),
        });
        if (!res.ok || !res.body) throw new Error('Stream failed');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop()!;
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') { setChatLoading(false); return; }
            if (data.startsWith('[ERROR]')) {
              setMessages(prev => { const u = [...prev]; u[u.length-1] = { ...u[u.length-1], content: data }; return u; });
              setChatLoading(false); return;
            }
            setMessages(prev => { const u = [...prev]; const last = u[u.length-1]; u[u.length-1] = { ...last, content: last.content + data }; return u; });
          }
        }
        setChatLoading(false); return;
      }
      let res: Response;
      if (modelConfig.provider === 'claude') {
        res = await fetch('/api/chat/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: modelConfig.claudeKey, model: modelConfig.claudeModel, messages: allMessages }) });
      } else {
        res = await fetch('/api/chat/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: modelConfig.geminiKey, model: modelConfig.geminiModel, messages: allMessages }) });
      }
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        const err = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.error}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Check model config.' }]);
    } finally { setChatLoading(false); }
  };

  const lineCount = content.split('\n').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, color: C.text, overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', background: C.l1, borderBottom: `1px solid ${C.l4}33`, flexShrink: 0 }}>
        {/* Tree toggle */}
        <div style={{ borderRight: `1px solid ${C.l4}33`, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.dimmer }}>
            <AlignLeft style={{ width: 14, height: 14 }} />
          </div>
        </div>
        {openTabs.map(path => {
          const name = path.split('/').pop() || path;
          const ext = name.includes('.') ? '.' + name.split('.').pop() : null;
          const isActive = path === activeFile;
          return (
            <div key={path} onClick={() => setActiveFile(path)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRight: `1px solid ${C.l4}22`, cursor: 'pointer', background: isActive ? C.l2 : 'transparent', borderTop: `2px solid ${isActive ? C.blue : 'transparent'}`, transition: 'all 0.15s', flexShrink: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: fileColor(ext), flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: isActive ? C.text : C.dimmer }}>{name}</span>
              {isDirty && isActive && <span style={{ width: 6, height: 6, borderRadius: 3, background: C.blue }} />}
              <span onClick={e => { e.stopPropagation(); closeTab(path); }}
                style={{ color: C.dimmer, opacity: 0.5, marginLeft: 2, lineHeight: 1, cursor: 'pointer', fontSize: 16 }}>×</span>
            </div>
          );
        })}
        {/* Toolbar actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px' }}>
          {/* View toggles */}
          <div style={{ display: 'flex', background: C.bg, borderRadius: 6, overflow: 'hidden' }}>
            {(['edit', 'split', 'preview'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{ padding: '4px 8px', background: viewMode === mode ? C.l3 : 'transparent', color: viewMode === mode ? C.text : C.dimmer, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {mode === 'edit' ? <Code style={{ width: 13, height: 13 }} /> : mode === 'preview' ? <Eye style={{ width: 13, height: 13 }} /> : <span style={{ fontSize: 11, display: 'flex', gap: 2 }}><Code style={{ width: 11, height: 11 }} /><Eye style={{ width: 11, height: 11 }} /></span>}
              </button>
            ))}
          </div>
          {saving && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: `${C.blue}20`, color: C.blue, fontSize: 12 }}>
              <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              Saving...
            </div>
          )}
          <button onClick={() => setShowAI(v => !v)}
            style={{ padding: '5px 10px', borderRadius: 6, background: showAI ? `${C.blue}20` : C.l3, color: showAI ? C.blue : C.dimmer, fontSize: 12, border: 'none', cursor: 'pointer' }}>
            AI
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* File tree */}
        <div style={{ width: 200, background: C.l1, borderRight: `1px solid ${C.l4}22`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* Tree header */}
          <div style={{ padding: '10px 12px 6px', borderBottom: `1px solid ${C.l4}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <button onClick={() => browse(ROOT_PATH)} title="Home" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dimmer, padding: 4, display: 'flex' }}>
                <Home style={{ width: 13, height: 13 }} />
              </button>
              {currentPath !== ROOT_PATH && parentPath && (
                <button onClick={() => browse(parentPath)} title="Up" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dimmer, padding: 4, display: 'flex' }}>
                  <ArrowLeft style={{ width: 13, height: 13 }} />
                </button>
              )}
              <button onClick={() => browse(currentPath)} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dimmer, padding: 4, display: 'flex' }}>
                <RefreshCw style={{ width: 13, height: 13 }} />
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={() => setCreateDialog({ type: 'file' })} title="New file" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dimmer, padding: 4, display: 'flex' }}>
                <FilePlus style={{ width: 13, height: 13 }} />
              </button>
              <button onClick={() => setCreateDialog({ type: 'dir' })} title="New folder" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dimmer, padding: 4, display: 'flex' }}>
                <FolderPlus style={{ width: 13, height: 13 }} />
              </button>
            </div>
            <input type="text" value={customPath || currentPath} onChange={e => setCustomPath(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { browse(customPath || currentPath); setCustomPath(''); } }}
              onBlur={() => setCustomPath('')}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.l4}80`, borderRadius: 4, padding: '3px 8px', fontSize: 11, color: C.dimmer, fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
              placeholder={currentPath} />
          </div>

          {/* Bookmarks */}
          <div style={{ padding: '6px 0 2px', borderBottom: `1px solid ${C.l4}22` }}>
            <div style={{ fontSize: 10, color: C.l4, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 4 }}>Bookmarks</div>
            {BOOKMARKS.map(b => (
              <button key={b.path} onClick={() => browse(b.path)}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, padding: '3px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: currentPath === b.path ? C.blue : C.dimmer }}>
                <Home style={{ width: 11, height: 11, flexShrink: 0 }} /> {b.label}
              </button>
            ))}
          </div>

          {/* Create dialog */}
          {createDialog && (
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.l4}22`, background: `${C.l3}80` }}>
              <div style={{ fontSize: 11, color: C.dimmer, marginBottom: 4 }}>New {createDialog.type}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createEntry(); if (e.key === 'Escape') setCreateDialog(null); }}
                  placeholder={createDialog.type === 'file' ? 'note.md' : 'folder'}
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.l4}80`, borderRadius: 4, padding: '3px 6px', fontSize: 11, color: C.text, outline: 'none' }} />
                <button onClick={createEntry} style={{ background: `${C.blue}30`, borderRadius: 4, padding: '2px 8px', fontSize: 11, color: C.blue, border: 'none', cursor: 'pointer' }}>✓</button>
                <button onClick={() => setCreateDialog(null)} style={{ background: C.l3, borderRadius: 4, padding: '2px 8px', fontSize: 11, color: C.dimmer, border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
            <div style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.08em', fontWeight: 600, padding: '0 12px', marginBottom: 6 }}>EXPLORER</div>
            {browseError ? (
              <div style={{ padding: '8px 12px', fontSize: 11, color: C.red }}>{browseError}</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: 11, color: C.dimmer }}>Empty directory</div>
            ) : (
              entries.map(entry => {
                const ext = entry.extension;
                const isOpen = activeFile === entry.path;
                if (entry.isDirectory) {
                  const isExpanded = expandedFolders[entry.path];
                  return (
                    <div key={entry.path}>
                      <div
                        onClick={() => {
                          setExpandedFolders(prev => ({ ...prev, [entry.path]: !prev[entry.path] }));
                          openEntry(entry);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: C.dim }}>
                        {isExpanded ? <ChevronDown style={{ width: 12, height: 12, flexShrink: 0 }} /> : <ChevronRight style={{ width: 12, height: 12, flexShrink: 0 }} />}
                        <Folder style={{ width: 13, height: 13, color: C.amber, flexShrink: 0 }} />
                        {entry.name}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={entry.path}
                    className="group"
                    onClick={() => openEntry(entry)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px 5px 20px', cursor: 'pointer', fontSize: 12, background: isOpen ? C.l3 : 'transparent', color: isOpen ? C.text : C.dimmer, transition: 'background 0.1s' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: fileColor(ext), flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                    <button onClick={e => { e.stopPropagation(); deleteEntry(entry); }}
                      className="opacity-0 group-hover:opacity-100"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, padding: 2, display: 'flex', flexShrink: 0 }}>
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Code area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg }}>
          {/* Breadcrumb */}
          <div style={{ padding: '8px 20px', fontSize: 11, color: C.dimmer, borderBottom: `1px solid ${C.l4}22`, flexShrink: 0 }}>
            {activeFile ? activeFile.replace(ROOT_PATH + '/', '') : 'Select a file to edit'}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dimmer }}>
              <Loader2 style={{ width: 24, height: 24 }} className="animate-spin" />
            </div>
          ) : !activeFile ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.dimmer, gap: 12 }}>
              <FileText style={{ width: 48, height: 48, opacity: 0.3 }} />
              <div style={{ fontSize: 13 }}>Select a file from the explorer</div>
              <div style={{ fontSize: 11 }}>Supports .md, .txt, .py, .js, .ts, .json and more</div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div style={{ flex: viewMode === 'split' ? '0 0 50%' : 1, display: 'flex', overflow: 'hidden', borderRight: viewMode === 'split' ? `1px solid ${C.l4}22` : 'none' }}>
                  {/* Line numbers */}
                  <div ref={lineNumRef} style={{ width: 48, background: C.bg, color: C.dimmer, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: '1.8', padding: '16px 8px 16px 0', textAlign: 'right', userSelect: 'none', flexShrink: 0, overflowY: 'hidden' }}>
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onScroll={e => { if (lineNumRef.current) lineNumRef.current.scrollTop = e.currentTarget.scrollTop; }}
                    onKeyDown={e => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        setContent(content.slice(0, start) + '  ' + content.slice(end));
                        setTimeout(() => { if (textareaRef.current) { textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2; } }, 0);
                      }
                    }}
                    style={{ flex: 1, background: C.bg, color: C.dim, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8, padding: '16px 20px', resize: 'none', outline: 'none', border: 'none', overflowY: 'auto' }}
                    spellCheck={false}
                  />
                </div>
              )}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: C.bg }}>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: C.dim }}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Panel */}
        {showAI && (
          <div style={{ width: 300, background: C.l1, borderLeft: `1px solid ${C.l4}22`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* AI header */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.l4}22`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Bot style={{ width: 16, height: 16, color: C.amber }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>ASSISTANT</span>
              <div style={{ marginLeft: 'auto', position: 'relative' }}>
                <button onClick={() => setShowModelDropdown(!showModelDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.l2, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.dimmer, border: 'none', cursor: 'pointer' }}>
                  {modelConfig.provider === 'ollama' ? modelConfig.ollamaModel.split(':')[0] : modelConfig.provider}
                  <ChevronDown style={{ width: 12, height: 12 }} />
                </button>
                {showModelDropdown && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: C.l3, borderRadius: 8, overflow: 'hidden', zIndex: 100, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {showSettings ? (
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select value={modelConfig.provider} onChange={e => setModelConfig({ ...modelConfig, provider: e.target.value as ModelProvider })}
                          style={{ background: C.l2, border: `1px solid ${C.l4}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, color: C.text, outline: 'none' }}>
                          <option value="ollama">Ollama (local)</option>
                          <option value="claude">Claude API</option>
                          <option value="gemini">Gemini API</option>
                        </select>
                        {modelConfig.provider === 'ollama' && (
                          <select value={modelConfig.ollamaModel} onChange={e => setModelConfig({ ...modelConfig, ollamaModel: e.target.value })}
                            style={{ background: C.l2, border: `1px solid ${C.l4}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, color: C.text, outline: 'none' }}>
                            {ollamaModels.length > 0 ? ollamaModels.map(m => <option key={m} value={m}>{m}</option>) : <option value={modelConfig.ollamaModel}>{modelConfig.ollamaModel}</option>}
                          </select>
                        )}
                        {modelConfig.provider === 'claude' && (
                          <input type="password" placeholder="Anthropic API key" value={modelConfig.claudeKey} onChange={e => setModelConfig({ ...modelConfig, claudeKey: e.target.value })}
                            style={{ background: C.l2, border: `1px solid ${C.l4}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, color: C.text, outline: 'none' }} />
                        )}
                        <button onClick={() => { setShowSettings(false); setShowModelDropdown(false); }}
                          style={{ background: `${C.blue}20`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: C.blue, border: 'none', cursor: 'pointer' }}>Done</button>
                      </div>
                    ) : (
                      <>
                        {modelConfig.provider === 'ollama' && ollamaModels.map(m => (
                          <div key={m} onClick={() => { setModelConfig({ ...modelConfig, ollamaModel: m }); setShowModelDropdown(false); }}
                            style={{ padding: '9px 14px', fontSize: 12, color: m === modelConfig.ollamaModel ? C.blue : C.dim, background: m === modelConfig.ollamaModel ? C.l4 : 'transparent', cursor: 'pointer' }}>{m}</div>
                        ))}
                        <div onClick={() => setShowSettings(true)} style={{ padding: '9px 14px', fontSize: 12, color: C.dimmer, cursor: 'pointer', borderTop: `1px solid ${C.l4}22` }}>
                          <Settings style={{ width: 11, height: 11, display: 'inline', marginRight: 6 }} /> Settings
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 32 }}>
                  <p style={{ fontSize: 12, color: C.dimmer }}>Ask anything about{activeFile ? ' this file' : ' your vault'}</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i}>
                  {m.role === 'assistant' ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Bot style={{ width: 14, height: 14, color: C.amber }} />
                        <span style={{ fontSize: 10, color: C.dimmer, letterSpacing: '0.06em' }}>ASSISTANT</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>{m.content}</div>
                      {activeFile && m.content.match(/```[\w]*\n([\s\S]*?)```/) && (() => {
                        const match = m.content.match(/```[\w]*\n([\s\S]*?)```/);
                        return match ? (
                          <button onClick={() => setContent(match[1])}
                            style={{ marginTop: 8, width: '100%', padding: '5px 8px', background: `${C.blue}15`, borderRadius: 6, fontSize: 11, color: C.blue, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Save style={{ width: 11, height: 11 }} /> Apply to file
                          </button>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ background: C.l3, borderRadius: 10, borderBottomRightRadius: 3, padding: '10px 12px', maxWidth: '85%', fontSize: 12, color: C.dim, lineHeight: 1.7 }}>
                        {m.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
                  {[0,1,2].map(i => <span key={i} className="animate-bounce" style={{ width: 6, height: 6, borderRadius: 3, background: C.dimmer, display: 'inline-block', animationDelay: `${i * 150}ms` }} />)}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.l4}22`, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask AI to edit code..."
                  style={{ flex: 1, background: C.l2, border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.text, outline: 'none' }} />
                <button onClick={sendMessage}
                  style={{ background: C.blue, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer' }}>
                  <Send style={{ width: 14, height: 14, color: C.bg }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ height: 28, background: C.l1, borderTop: `1px solid ${C.l4}22`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 20, fontSize: 11, color: C.dimmer, flexShrink: 0 }}>
        {activeFile ? (
          <>
            <span>Ln {lineCount}</span>
            <span>SPACES: 2</span>
            <span>UTF-8</span>
            <span style={{ marginLeft: 'auto', color: C.blue }}>{fileName?.split('.').pop()?.toUpperCase() || 'TXT'}</span>
          </>
        ) : (
          <span>No file open</span>
        )}
      </div>
    </div>
  );
}
