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
  X,
  Loader2,
  RefreshCw,
  Home,
} from 'lucide-react';

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
  { label: 'Media', path: '/blackbox/media' },
];

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const set = useCallback((v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [value, set] as const;
}


function FileIcon({ entry }: { entry: FileEntry }) {
  if (entry.isDirectory) return <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
  if (['.md', '.mdx', '.txt'].includes(entry.extension || ''))
    return <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  return <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />;
}

export function VaultEditor() {
  const [currentPath, setCurrentPath] = useState(ROOT_PATH);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [parentPath, setParentPath] = useState('');
  const [browseError, setBrowseError] = useState('');
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // New file/folder dialog
  const [createDialog, setCreateDialog] = useState<{ type: 'file' | 'dir' } | null>(null);
  const [newName, setNewName] = useState('');

  const browse = useCallback(async (path: string) => {
    setBrowseError('');
    try {
      const res = await fetch(`/api/vault/browse?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const err = await res.json();
        setBrowseError(err.error || 'Failed to browse');
        return;
      }
      const data: BrowseResult = await res.json();
      setEntries(data.items);
      setCurrentPath(data.path);
      setParentPath(data.parent);
    } catch {
      setBrowseError('Network error');
    }
  }, []);

  useEffect(() => { browse(ROOT_PATH); }, [browse]);

  useEffect(() => {
    fetch('/api/chat/models')
      .then(r => r.json())
      .then(models => setOllamaModels(models.map((m: { name: string }) => m.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openEntry = async (entry: FileEntry) => {
    if (entry.isDirectory) {
      browse(entry.path);
      return;
    }
    if (!entry.extension || ['.md', '.mdx', '.txt', '.sh', '.py', '.js', '.ts', '.json', '.yaml', '.yml', '.env', '.conf', '.cfg', '.ini', '.toml'].includes(entry.extension)) {
      setLoading(true);
      try {
        const res = await fetch(`/api/vault/read?path=${encodeURIComponent(entry.path)}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
          setSavedContent(data.content);
          setOpenFile(entry.path);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const save = async () => {
    if (!openFile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/vault/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: openFile, content }),
      });
      if (res.ok) setSavedContent(content);
    } finally {
      setSaving(false);
    }
  };

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
    if (openFile === entry.path) { setOpenFile(null); setContent(''); }
    browse(currentPath);
  };

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    const systemPrompt = openFile
      ? `You are a helpful assistant working on a file: ${openFile}\n\nFile content:\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``
      : 'You are a helpful assistant for file management and writing.';

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
      userMsg,
    ];

    try {
      const cfg = modelConfig;

      if (cfg.provider === 'ollama') {
        // Add empty placeholder immediately — tokens stream in
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const res = await fetch('/api/chat/ollama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: cfg.ollamaModel, messages: allMessages }),
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
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: data };
                return updated;
              });
              setChatLoading(false);
              return;
            }
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: last.content + data };
              return updated;
            });
          }
        }
        setChatLoading(false);
        return;
      }

      // Claude and Gemini — JSON responses
      let res: Response;
      if (cfg.provider === 'claude') {
        res = await fetch('/api/chat/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: cfg.claudeKey, model: cfg.claudeModel, messages: allMessages }),
        });
      } else {
        res = await fetch('/api/chat/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: cfg.geminiKey, model: cfg.geminiModel, messages: allMessages }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        const err = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.error}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Check model config.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const isDirty = content !== savedContent;
  const fileName = openFile ? openFile.split('/').pop() : null;

  return (
    <div className="flex h-full bg-[#0d0d17] text-slate-200 overflow-hidden rounded-xl border border-slate-800">
      {/* File sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-slate-800 flex flex-col bg-[#0a0a14]">
        {/* Sidebar header */}
        <div className="px-3 py-3 border-b border-slate-800">
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => browse(ROOT_PATH)}
              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
              title="Home"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            {currentPath !== ROOT_PATH && parentPath && (
              <button
                onClick={() => browse(parentPath)}
                className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
                title="Up"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => browse(currentPath)}
              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setCreateDialog({ type: 'file' })}
              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
              title="New file"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCreateDialog({ type: 'dir' })}
              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
              title="New folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current path + custom navigation */}
          <div className="flex gap-1">
            <input
              type="text"
              value={customPath || currentPath}
              onChange={e => setCustomPath(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { browse(customPath || currentPath); setCustomPath(''); }
              }}
              onBlur={() => setCustomPath('')}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400 font-mono min-w-0"
              placeholder={currentPath}
            />
          </div>
        </div>

        {/* Create dialog */}
        {createDialog && (
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/50">
            <p className="text-xs text-slate-500 mb-1">New {createDialog.type}</p>
            <div className="flex gap-1">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createEntry(); if (e.key === 'Escape') setCreateDialog(null); }}
                placeholder={createDialog.type === 'file' ? 'note.md' : 'folder'}
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 min-w-0"
              />
              <button onClick={createEntry} className="px-2 py-1 bg-cyan-600 rounded text-xs text-white hover:bg-cyan-500">
                ✓
              </button>
              <button onClick={() => setCreateDialog(null)} className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Bookmarks */}
        <div className="px-2 py-1.5 border-b border-slate-800">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest px-1 mb-1">Bookmarks</p>
          {BOOKMARKS.map(b => (
            <button
              key={b.path}
              onClick={() => browse(b.path)}
              className={`w-full text-left flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors hover:bg-slate-800 ${
                currentPath === b.path ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Home className="w-3 h-3 flex-shrink-0" />
              {b.label}
            </button>
          ))}
        </div>

        {/* File list */}
        <div className="flex-1 overflow-auto py-1">
          {browseError ? (
            <div className="px-3 py-4 text-xs text-red-400">{browseError}</div>
          ) : entries.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-600">Empty directory</div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.path}
                className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-800/60 transition-colors ${
                  openFile === entry.path ? 'bg-slate-800 text-slate-100' : 'text-slate-400'
                }`}
                onClick={() => openEntry(entry)}
              >
                <FileIcon entry={entry} />
                <span className="flex-1 text-xs truncate">{entry.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteEntry(entry); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-[#0d0d17]">
          {openFile ? (
            <>
              <span className="text-sm text-slate-300 font-medium">
                {fileName}
                {isDirty && <span className="ml-1 text-cyan-500">●</span>}
              </span>
              <span className="text-xs text-slate-600 hidden lg:block">{openFile}</span>
            </>
          ) : (
            <span className="text-sm text-slate-600">No file open</span>
          )}
          <div className="flex-1" />

          {/* View toggles */}
          <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
            {(['edit', 'split', 'preview'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === mode ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {mode === 'edit' ? <Code className="w-3.5 h-3.5" /> : mode === 'preview' ? <Eye className="w-3.5 h-3.5" /> : (
                  <span className="flex gap-0.5"><Code className="w-3 h-3" /><Eye className="w-3 h-3" /></span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={save}
            disabled={!openFile || !isDirty || saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDirty && openFile
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>

          <button
            onClick={() => setShowAI(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showAI ? 'bg-purple-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            AI
          </button>
        </div>

        {/* Editor body */}
        <div className="flex-1 flex min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-600">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !openFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 gap-3">
              <FileText className="w-12 h-12 opacity-30" />
              <p className="text-sm">Select a file from the sidebar to edit</p>
              <p className="text-xs">Supports .md, .txt, .sh, .py, .js, .ts, .json, .yaml and more</p>
            </div>
          ) : (
            <>
              {/* Edit pane */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      setContent(c => c.slice(0, start) + '  ' + c.slice(end));
                      setTimeout(() => { if (textareaRef.current) { textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2; } }, 0);
                    }
                  }}
                  className={`bg-[#0d0d17] text-slate-300 font-mono text-sm leading-relaxed p-4 resize-none outline-none border-0 ${
                    viewMode === 'split' ? 'w-1/2 border-r border-slate-800' : 'flex-1'
                  }`}
                  spellCheck={false}
                />
              )}

              {/* Preview pane */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`overflow-auto p-6 ${viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
                  <div className="markdown-preview text-sm text-slate-300 leading-relaxed max-w-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {/* AI Chat panel */}
          {showAI && (
            <div className="w-80 flex-shrink-0 border-l border-slate-800 flex flex-col bg-[#0a0a14]">
              {/* AI toolbar */}
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">AI Assistant</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowSettings(v => !v)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setMessages([])}
                      className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {showSettings ? (
                  <div className="space-y-2">
                    <select
                      value={modelConfig.provider}
                      onChange={e => setModelConfig({ ...modelConfig, provider: e.target.value as ModelProvider })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                    >
                      <option value="ollama">Ollama (local)</option>
                      <option value="claude">Claude API</option>
                      <option value="gemini">Gemini API</option>
                    </select>

                    {modelConfig.provider === 'ollama' && (
                      <select
                        value={modelConfig.ollamaModel}
                        onChange={e => setModelConfig({ ...modelConfig, ollamaModel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                      >
                        {ollamaModels.length > 0 ? ollamaModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        )) : (
                          <option value={modelConfig.ollamaModel}>{modelConfig.ollamaModel}</option>
                        )}
                      </select>
                    )}

                    {modelConfig.provider === 'claude' && (
                      <>
                        <input
                          type="password"
                          placeholder="Anthropic API key"
                          value={modelConfig.claudeKey}
                          onChange={e => setModelConfig({ ...modelConfig, claudeKey: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        />
                        <select
                          value={modelConfig.claudeModel}
                          onChange={e => setModelConfig({ ...modelConfig, claudeModel: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        >
                          <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (fast)</option>
                          <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                          <option value="claude-opus-4-7">claude-opus-4-7</option>
                        </select>
                      </>
                    )}

                    {modelConfig.provider === 'gemini' && (
                      <>
                        <input
                          type="password"
                          placeholder="Gemini API key"
                          value={modelConfig.geminiKey}
                          onChange={e => setModelConfig({ ...modelConfig, geminiKey: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        />
                        <select
                          value={modelConfig.geminiModel}
                          onChange={e => setModelConfig({ ...modelConfig, geminiModel: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        >
                          <option value="gemini-2.0-flash">gemini-2.0-flash (fast)</option>
                          <option value="gemini-2.0-flash-thinking-exp">gemini-2.0-flash-thinking</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                        </select>
                      </>
                    )}

                    <button
                      onClick={() => setShowSettings(false)}
                      className="w-full py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-xs text-white"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">
                      {modelConfig.provider === 'ollama'
                        ? modelConfig.ollamaModel
                        : modelConfig.provider === 'claude'
                        ? modelConfig.claudeModel
                        : modelConfig.geminiModel}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      modelConfig.provider === 'ollama' ? 'bg-green-900 text-green-400' :
                      modelConfig.provider === 'claude' ? 'bg-orange-900 text-orange-400' :
                      'bg-blue-900 text-blue-400'
                    }`}>
                      {modelConfig.provider}
                    </span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-600 text-xs">
                      Ask anything about{openFile ? ' this file' : ' your vault'}
                    </p>
                    {openFile && (
                      <p className="text-slate-700 text-xs mt-1">File context included automatically</p>
                    )}
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-cyan-700 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'assistant' && openFile && (() => {
                      const match = msg.content.match(/```[\w]*\n([\s\S]*?)```/);
                      return match ? (
                        <button
                          onClick={() => setContent(match[1])}
                          className="mt-1 w-[85%] py-1 bg-cyan-900/60 hover:bg-cyan-800 rounded text-xs text-cyan-300 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Save className="w-3 h-3" /> Apply to file
                        </button>
                      ) : null;
                    })()}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-xl px-3 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="px-3 py-2 border-t border-slate-800">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder="Ask AI... (Enter to send)"
                    rows={2}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 resize-none outline-none focus:border-cyan-700"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="p-2 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-white transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
