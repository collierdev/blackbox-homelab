import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Settings, Copy, Plus, Mic, Paperclip, Send, History,
  ChevronDown, ChevronRight, Loader, ExternalLink, Clock, Minimize2,
  X, MessageSquare, Trash2, Circle,
} from 'lucide-react';
import type { ChatMessage, OllamaModel } from '../types';
import { loadSettings } from './SettingsModal';

type Provider = 'ollama' | 'claude' | 'agent';

interface ChatBotProps { inline?: boolean }

const C = {
  bg: '#0b1326', l1: '#121f38', l2: '#162040', l3: '#1c2a4a', l4: '#243356',
  blue: '#adc6ff', amber: '#f7be1d', text: '#e2e8f0', dim: '#c2c6d6', dimmer: '#8892a4',
  trace: '#0d1f0d', traceBorder: '#1e3a1e', traceText: '#86efac', traceAccent: '#4ade80',
  sidebar: '#0e1a30', sidebarBorder: '#1a2a46',
};

// ── Session persistence ──────────────────────────────────────────────────────

interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  provider: Provider;
  model: string;
  messages: ChatMessage[];
  status: 'idle' | 'running' | 'complete';
}

const STORAGE_KEY = 'pi_agent_sessions';
const MAX_SESSIONS = 50;

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((s: Session) => ({
      ...s,
      messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch { return []; }
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {}
}

function newSession(provider: Provider, model: string): Session {
  return {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'New conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    provider,
    model,
    messages: [],
    status: 'idle',
  };
}

function sessionTitle(session: Session): string {
  const first = session.messages.find(m => m.role === 'user');
  return first ? first.content.slice(0, 48) + (first.content.length > 48 ? '…' : '') : 'New conversation';
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

interface YTCandidate { title: string; url: string; snippet: string; source: string }

function parseCandidates(line: string): YTCandidate[] | null {
  if (!line.startsWith('[CANDIDATES] ')) return null;
  try { return JSON.parse(line.slice('[CANDIDATES] '.length)); }
  catch { return null; }
}

// ── TracePanel ───────────────────────────────────────────────────────────────

function TracePanel({ lines, isActive, elapsedMs }: { lines: string[]; isActive: boolean; elapsedMs: number }) {
  const [expanded, setExpanded] = useState(true);
  const [candidatesExpanded, setCandidatesExpanded] = useState(false);
  if (!lines || lines.length === 0) return null;

  const steps = lines.map(l => ({ text: l, candidates: parseCandidates(l) }));
  const candidateBlock = steps.find(s => s.candidates !== null);
  const regularSteps = steps.filter(s => s.candidates === null);

  return (
    <div style={{ marginBottom: 10, background: C.trace, border: `1px solid ${C.traceBorder}`, borderRadius: 8, overflow: 'hidden', fontSize: 12 }}>
      <button onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: C.traceText }}>
        {isActive
          ? <Loader style={{ width: 12, height: 12, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          : expanded ? <ChevronDown style={{ width: 12, height: 12, flexShrink: 0 }} /> : <ChevronRight style={{ width: 12, height: 12, flexShrink: 0 }} />}
        <span style={{ fontSize: 10, letterSpacing: '0.08em', fontWeight: 700 }}>
          {isActive ? 'AGENT TRACE — RUNNING' : `AGENT TRACE — ${regularSteps.length} STEPS`}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.dimmer, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock style={{ width: 10, height: 10 }} />{fmtElapsed(elapsedMs || 0)}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '4px 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {regularSteps.map((s, i) => {
            const isLast = i === regularSteps.length - 1;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ color: C.traceAccent, fontSize: 10, marginTop: 3, flexShrink: 0 }}>›</span>
                <span style={{ color: isLast && isActive ? C.traceText : '#86efac88', lineHeight: 1.6, fontWeight: isLast && isActive ? 600 : 400 }}
                  dangerouslySetInnerHTML={{ __html: s.text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#c4f0c4">$1</strong>').replace(/\*(.*?)\*/g, '<em style="color:#a3e8a3">$1</em>') }} />
              </div>
            );
          })}
          {isActive && (
            <div style={{ display: 'flex', gap: 4, paddingLeft: 18 }}>
              {[0, 1, 2].map(i => <span key={i} className="animate-bounce" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: 2, background: C.dimmer, animationDelay: `${i * 150}ms` }} />)}
            </div>
          )}
          {candidateBlock?.candidates && (
            <div style={{ marginTop: 6, borderTop: `1px solid ${C.traceBorder}`, paddingTop: 6 }}>
              <button onClick={() => setCandidatesExpanded(e => !e)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: C.traceText, padding: '2px 0', width: '100%' }}>
                {candidatesExpanded ? <ChevronDown style={{ width: 11, height: 11 }} /> : <ChevronRight style={{ width: 11, height: 11 }} />}
                <span style={{ fontSize: 10, letterSpacing: '0.06em', fontWeight: 600 }}>{candidateBlock.candidates.length} CANDIDATES RETRIEVED</span>
              </button>
              {candidatesExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {candidateBlock.candidates.map((c, i) => {
                    const bracketMatch = c.snippet.match(/\[(.+)\]$/);
                    const meta = bracketMatch ? bracketMatch[1] : '';
                    const desc = c.snippet.replace(/\[.+\]$/, '').trim();
                    return (
                      <div key={i} style={{ background: '#0f240f', border: `1px solid ${C.traceBorder}`, borderRadius: 6, padding: '7px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ color: C.traceText, fontWeight: 600, lineHeight: 1.4, fontSize: 11 }}>{i + 1}. {c.title}</span>
                          <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: C.dimmer, flexShrink: 0 }}>
                            <ExternalLink style={{ width: 11, height: 11 }} />
                          </a>
                        </div>
                        {desc && <div style={{ color: '#86efac55', marginTop: 3, fontSize: 10, lineHeight: 1.4 }}>{desc}</div>}
                        {meta && <div style={{ color: C.dimmer, marginTop: 3, fontSize: 10 }}>📊 {meta}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Session Sidebar ──────────────────────────────────────────────────────────

function SessionSidebar({
  sessions, currentId, onSelect, onDelete, onNew, open, onClose,
}: {
  sessions: Session[];
  currentId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const running = sessions.filter(s => s.status === 'running');
  const past = sessions.filter(s => s.status !== 'running');

  const SessRow = ({ s }: { s: Session }) => (
    <div
      onClick={() => { onSelect(s.id); onClose(); }}
      style={{
        padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
        background: s.id === currentId ? C.l3 : 'transparent',
        border: `1px solid ${s.id === currentId ? C.l4 : 'transparent'}`,
        display: 'flex', alignItems: 'flex-start', gap: 8,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (s.id !== currentId) (e.currentTarget as HTMLDivElement).style.background = C.l2; }}
      onMouseLeave={e => { if (s.id !== currentId) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        {s.status === 'running'
          ? <Loader style={{ width: 13, height: 13, color: C.amber, animation: 'spin 1s linear infinite' }} />
          : <MessageSquare style={{ width: 13, height: 13, color: s.id === currentId ? C.blue : C.dimmer }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: s.id === currentId ? C.text : C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: s.status === 'running' ? 600 : 400 }}>
          {sessionTitle(s)}
        </div>
        <div style={{ fontSize: 10, color: C.dimmer, marginTop: 2, display: 'flex', gap: 6 }}>
          <span>{s.provider === 'agent' ? '★ Agent' : s.provider}</span>
          <span>·</span>
          <span>{fmtDate(s.updatedAt)}</span>
          {s.messages.length > 0 && <><span>·</span><span>{s.messages.filter(m => m.role === 'user').length} msg</span></>}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(s.id); }}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.dimmer, opacity: 0.4 }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.4'; }}
      >
        <Trash2 style={{ width: 11, height: 11 }} />
      </button>
    </div>
  );

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, bottom: 0, width: 260,
      background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`,
      display: 'flex', flexDirection: 'column', zIndex: 20, borderRadius: '16px 0 0 16px',
    }}>
      {/* Sidebar header */}
      <div style={{ padding: '14px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.dimmer, letterSpacing: '0.08em' }}>SESSIONS</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onNew}
            style={{ background: C.blue, border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.bg, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus style={{ width: 11, height: 11 }} /> NEW
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dimmer }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {/* Running sessions */}
        {running.length > 0 && (
          <>
            <div style={{ fontSize: 9, color: C.amber, letterSpacing: '0.1em', fontWeight: 700, padding: '6px 4px 4px' }}>
              RUNNING ({running.length})
            </div>
            {running.map(s => <SessRow key={s.id} s={s} />)}
            <div style={{ height: 8 }} />
          </>
        )}

        {/* Past sessions */}
        {past.length > 0 && (
          <>
            <div style={{ fontSize: 9, color: C.dimmer, letterSpacing: '0.1em', fontWeight: 700, padding: '6px 4px 4px' }}>
              HISTORY ({past.length})
            </div>
            {past.map(s => <SessRow key={s.id} s={s} />)}
          </>
        )}

        {sessions.length === 0 && (
          <div style={{ textAlign: 'center', color: C.dimmer, fontSize: 12, marginTop: 40 }}>
            No sessions yet.<br />Send a message to start.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message rendering ─────────────────────────────────────────────────────────

function parseMessage(content: string, msgIdx: number, copied: number | null, onCopy: (c: string, k: number) => void) {
  const segments: React.ReactNode[] = [];
  let partIdx = 0;
  const codeRe = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0, match: RegExpExecArray | null;
  while ((match = codeRe.exec(content)) !== null) {
    const before = content.slice(last, match.index);
    if (before) segments.push(<TextSegment key={`t-${msgIdx}-${partIdx++}`} text={before} />);
    const lang = match[1] || 'code', code = match[2], copyKey = msgIdx * 1000 + partIdx;
    segments.push(
      <div key={`c-${msgIdx}-${partIdx++}`} style={{ marginTop: 14, background: C.bg, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${C.l3}` }}>
          <span style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{lang}</span>
          <button onClick={() => onCopy(code, copyKey)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.dimmer, cursor: 'pointer', background: 'none', border: 'none' }}>
            <Copy style={{ width: 12, height: 12 }} /> {copied === copyKey ? 'COPIED!' : 'COPY'}
          </button>
        </div>
        <pre style={{ padding: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.dim, lineHeight: 1.8, overflow: 'auto', margin: 0 }}>{code}</pre>
      </div>
    );
    last = match.index + match[0].length;
  }
  const tail = content.slice(last);
  if (tail) segments.push(<TextSegment key={`t-${msgIdx}-${partIdx}`} text={tail} />);
  return segments.length > 0 ? segments : <TextSegment key="t-0" text={content} />;
}

function TextSegment({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`\n]+`)/g);
  return (
    <div style={{ fontSize: 14, lineHeight: 1.8, color: C.dim }}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: C.text }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ background: C.l4, padding: '1px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.blue }}>{p.slice(1, -1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatBot({ inline = false }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState(false);
  const [provider, setProvider] = useState<Provider>('agent');           // agent is default
  const [showSettings, setShowSettings] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState(() => localStorage.getItem('claude_api_key') || '');
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => loadSettings().defaultModel || 'llama3.2:1b');
  const [copied, setCopied] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Session state
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Derive current session and its messages
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages ?? [];

  // Persist sessions whenever they change
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  useEffect(() => { fetchOllamaModels(); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Timer for elapsed display
  useEffect(() => {
    if (loading) {
      startTimeRef.current = Date.now() - elapsedMs;
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  // Update session in state helper
  const updateSession = useCallback((id: string, updater: (s: Session) => Session) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const fetchOllamaModels = async () => {
    try {
      const res = await fetch('/api/chat/models');
      if (res.ok) {
        const models = await res.json();
        setOllamaModels(models);
      }
    } catch {}
  };

  // Create a new session
  const startNewSession = useCallback((prov?: Provider, model?: string) => {
    const sess = newSession(prov ?? provider, model ?? selectedModel);
    setSessions(prev => [sess, ...prev]);
    setCurrentSessionId(sess.id);
    return sess;
  }, [provider, selectedModel]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    // Ensure we have a session
    let sessId = currentSessionId;
    let sess = sessions.find(s => s.id === sessId);
    if (!sess || sess.status === 'complete') {
      const newSess = startNewSession();
      sessId = newSess.id;
    }

    const userMessage: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    setInput('');
    setLoading(true);
    setElapsedMs(0);
    startTimeRef.current = Date.now();

    // Add user message and mark session running
    updateSession(sessId, s => ({
      ...s,
      messages: [...s.messages, userMessage],
      status: 'running',
      updatedAt: Date.now(),
      title: s.messages.length === 0 ? (userMessage.content.slice(0, 48) + (userMessage.content.length > 48 ? '…' : '')) : s.title,
    }));

    // Snapshot for API call
    const allMessages = [...(sessions.find(s => s.id === sessId)?.messages ?? []), userMessage];

    try {
      const isStreaming = provider === 'ollama' || provider === 'agent';
      const assistantPlaceholder: ChatMessage = {
        role: 'assistant', content: '', timestamp: new Date(),
        traceLines: provider === 'agent' ? [] : undefined,
      };

      if (isStreaming) {
        const endpoint = provider === 'agent' ? '/api/chat/agent' : '/api/chat/ollama';

        // Add placeholder assistant message
        updateSession(sessId, s => ({ ...s, messages: [...s.messages, assistantPlaceholder] }));

        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          }),
          signal: ctrl.signal,
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

            if (data === '[DONE]') {
              updateSession(sessId, s => ({ ...s, status: 'complete', updatedAt: Date.now() }));
              setLoading(false);
              setBackgroundMode(false);
              return;
            }
            if (data.startsWith('[ERROR]')) {
              updateSession(sessId, s => {
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: data };
                return { ...s, messages: msgs, status: 'complete', updatedAt: Date.now() };
              });
              setLoading(false); setBackgroundMode(false); return;
            }
            if (data.startsWith('[TRACE] ')) {
              const traceMsg = data.slice(8);
              updateSession(sessId, s => {
                const msgs = [...s.messages];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, traceLines: [...(last.traceLines ?? []), traceMsg] };
                return { ...s, messages: msgs, updatedAt: Date.now() };
              });
              continue;
            }
            // Regular token
            updateSession(sessId, s => {
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              msgs[msgs.length - 1] = { ...last, content: last.content + data };
              return { ...s, messages: msgs, updatedAt: Date.now() };
            });
          }
        }
        updateSession(sessId, s => ({ ...s, status: 'complete', updatedAt: Date.now() }));
        setLoading(false);
        setBackgroundMode(false);
        return;
      }

      // Claude non-streaming
      const res = await fetch('/api/chat/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: claudeApiKey, model: 'claude-sonnet-4-20250514', messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.content, timestamp: new Date() };
      updateSession(sessId, s => ({ ...s, messages: [...s.messages, assistantMsg], status: 'complete', updatedAt: Date.now() }));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateSession(sessId, s => ({ ...s, status: loading ? 'running' : 'complete' }));
        setLoading(false); setBackgroundMode(false); return;
      }
      const errMsg: ChatMessage = { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Failed'}`, timestamp: new Date() };
      updateSession(sessId, s => ({ ...s, messages: [...s.messages, errMsg], status: 'complete', updatedAt: Date.now() }));
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentSessionId, sessions, provider, selectedModel, claudeApiKey, startNewSession, updateSession]);

  const copyCode = (code: string, key: number) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const goBackground = () => { setBackgroundMode(true); setIsOpen(false); };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setShowSidebar(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId('');
  };

  const handleNewSession = () => {
    const s = startNewSession();
    setCurrentSessionId(s.id);
    setShowSidebar(false);
  };

  const runningCount = sessions.filter(s => s.status === 'running').length;

  // Floating button
  if (!inline && (!isOpen || backgroundMode)) {
    return (
      <button onClick={() => { setIsOpen(true); setBackgroundMode(false); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{ background: C.blue, position: 'relative' }}>
        <Bot className="w-7 h-7" style={{ color: C.bg }} />
        {runningCount > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, background: C.amber, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader style={{ width: 11, height: 11, color: C.bg, animation: 'spin 1s linear infinite' }} />
          </span>
        )}
      </button>
    );
  }

  const containerStyle = inline
    ? { height: '100%', display: 'flex', flexDirection: 'column' as const, background: C.bg, borderRadius: 12, overflow: 'hidden', position: 'relative' as const }
    : { position: 'fixed' as const, bottom: 24, right: 24, width: 460, height: 700, background: C.bg, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', zIndex: 50 };

  return (
    <div style={containerStyle}>
      {/* Session sidebar overlay */}
      <SessionSidebar
        sessions={sessions}
        currentId={currentSessionId}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        onNew={handleNewSession}
        open={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Top bar */}
      <div style={{ padding: '8px 8px 10px', borderBottom: `1px solid ${C.l4}40`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* History toggle with running badge */}
        <button onClick={() => setShowSidebar(s => !s)}
          style={{ position: 'relative', background: showSidebar ? C.l3 : 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}>
          <History style={{ width: 17, height: 17, color: showSidebar ? C.blue : C.dimmer }} />
          {runningCount > 0 && (
            <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, background: C.amber, borderRadius: 4, border: `1px solid ${C.bg}` }} />
          )}
        </button>

        {/* Provider + model selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowModelDropdown(!showModelDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.l2, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: C.amber, cursor: 'pointer', border: 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.amber, flexShrink: 0 }} />
            {provider === 'agent' ? '★ AGENT' : provider === 'ollama' ? 'OLLAMA' : 'CLAUDE'}
            <span style={{ fontSize: 11 }}>▾</span>
          </button>
          {showModelDropdown && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: C.l3, borderRadius: 10, overflow: 'hidden', zIndex: 100, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '4px 0', borderBottom: `1px solid ${C.l4}` }}>
                {[{ id: 'agent', label: '★ Pi Agent (LangGraph)' }, { id: 'ollama', label: 'Ollama (Local)' }, { id: 'claude', label: 'Claude API' }].map(p => (
                  <div key={p.id} onClick={() => { setProvider(p.id as Provider); setShowModelDropdown(false); }}
                    style={{ padding: '8px 14px', fontSize: 12, color: provider === p.id ? C.blue : C.dim, background: provider === p.id ? C.l4 : 'transparent', cursor: 'pointer' }}>
                    {p.label}
                  </div>
                ))}
              </div>
              {provider === 'ollama' && ollamaModels.map(m => (
                <div key={m.name} onClick={() => { setSelectedModel(m.name); setShowModelDropdown(false); }}
                  style={{ padding: '9px 14px', fontSize: 12, color: m.name === selectedModel ? C.blue : C.dim, background: m.name === selectedModel ? C.l4 : 'transparent', cursor: 'pointer' }}>
                  {m.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <span style={{ fontSize: 11, color: C.dimmer }}>
          {provider === 'agent' ? `${selectedModel} · ctx=2048` : provider === 'ollama' ? selectedModel : 'claude-sonnet'}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {loading && (
            <button onClick={goBackground} title="Continue in background"
              style={{ background: C.l3, border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: C.dimmer, fontWeight: 600 }}>
              <Minimize2 style={{ width: 12, height: 12 }} /> BG
            </button>
          )}
          {/* New session */}
          <button onClick={handleNewSession} title="New session"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <Plus style={{ width: 15, height: 15, color: C.dimmer }} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <Settings style={{ width: 15, height: 15, color: showSettings ? C.blue : C.dimmer }} />
          </button>
          {!inline && (
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
              <X style={{ width: 15, height: 15, color: C.dimmer }} />
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.l4}`, background: C.l2, display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
          {provider === 'claude' && (
            <>
              <label style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.06em' }}>CLAUDE API KEY</label>
              <input type="password" value={claudeApiKey} onChange={e => setClaudeApiKey(e.target.value)} placeholder="sk-ant-..."
                style={{ background: C.l3, border: `1px solid ${C.l4}`, borderRadius: 7, padding: '7px 10px', fontSize: 12, color: C.text, outline: 'none' }} />
              <button onClick={() => { localStorage.setItem('claude_api_key', claudeApiKey); setShowSettings(false); }}
                style={{ background: C.blue, color: C.bg, borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none' }}>Save</button>
            </>
          )}
          {provider === 'agent' && (
            <div style={{ fontSize: 11, color: C.dimmer, lineHeight: 1.7 }}>
              LangGraph agent · vault: <code style={{ color: C.blue }}>/blackbox/documents/vault</code><br />
              model: <code style={{ color: C.blue }}>{selectedModel}</code> · num_ctx=2048 · keep_alive=10m
            </div>
          )}
        </div>
      )}

      {/* Session label bar */}
      {currentSession && (
        <div style={{ padding: '5px 14px', background: C.l1, borderBottom: `1px solid ${C.l4}30`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Circle style={{ width: 6, height: 6, color: currentSession.status === 'running' ? C.amber : C.dimmer, fill: 'currentColor' }} />
          <span style={{ fontSize: 11, color: C.dimmer, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sessionTitle(currentSession)}
          </span>
          <span style={{ fontSize: 10, color: C.dimmer }}>{fmtDate(currentSession.updatedAt)}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, opacity: 0.6 }}>
            <Bot style={{ width: 40, height: 40, color: C.amber }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: C.dim, fontWeight: 600 }}>Pi Agent ready</div>
              <div style={{ fontSize: 12, color: C.dimmer, marginTop: 4 }}>LangGraph · llama3.2:1b · vault + memory</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              {[
                'What tasks do I have today?',
                'Find me a YouTube video about LangGraph agents',
                'Search for the latest AI news',
              ].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  style={{ background: C.l2, border: `1px solid ${C.l3}`, borderRadius: 8, padding: '9px 14px', fontSize: 12, color: C.dim, cursor: 'pointer', textAlign: 'left' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLastAssistant = m.role === 'assistant' && i === messages.length - 1;
          const isActiveMsg = isLastAssistant && loading;
          return (
            <div key={i}>
              {m.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ maxWidth: '72%', background: C.l3, borderRadius: 14, borderBottomRightRadius: 4, padding: '12px 15px' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: C.dim, margin: 0 }}>{m.content}</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 11 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: C.l3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot style={{ width: 16, height: 16, color: C.amber }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: C.dimmer, letterSpacing: '0.06em', marginBottom: 7 }}>
                      {provider === 'agent' ? 'PI AGENT / LANGGRAPH' : provider === 'ollama' ? 'OLLAMA / LOCAL' : 'CLAUDE / API'}
                    </div>
                    {m.traceLines !== undefined && (
                      <TracePanel lines={m.traceLines} isActive={isActiveMsg && m.content === ''} elapsedMs={isActiveMsg ? elapsedMs : 0} />
                    )}
                    {m.content ? parseMessage(m.content, i, copied, copyCode) : null}
                    {isActiveMsg && m.content !== '' && (
                      <div style={{ fontSize: 10, color: C.dimmer, marginTop: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Loader style={{ width: 9, height: 9, animation: 'spin 1s linear infinite' }} />
                        Generating… {fmtElapsed(elapsedMs)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ padding: '0 14px 14px', flexShrink: 0 }}>
        <div style={{ background: C.l2, borderRadius: 12, padding: '11px 13px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={currentSession ? 'Continue conversation…' : 'Message Pi Agent…'}
            rows={2}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text, resize: 'none', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <Mic style={{ width: 16, height: 16, color: C.dimmer, cursor: 'pointer', flexShrink: 0 }} />
            <Paperclip style={{ width: 16, height: 16, color: C.dimmer, cursor: 'pointer', flexShrink: 0 }} />
            {loading && (
              <div style={{ fontSize: 10, color: C.dimmer, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock style={{ width: 10, height: 10 }} />{fmtElapsed(elapsedMs)}
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={handleSend} disabled={!input.trim() || loading}
                style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() && !loading ? C.blue : C.l4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default' }}>
                <Send style={{ width: 13, height: 13, color: input.trim() && !loading ? C.bg : C.dimmer }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
