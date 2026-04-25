import { useState, useEffect, useRef } from 'react';
import { Bot, Settings, Copy, Plus, Mic, Paperclip, Send, History } from 'lucide-react';
import type { ChatMessage, OllamaModel } from '../types';
import { loadSettings } from './SettingsModal';

type Provider = 'ollama' | 'claude';

interface ChatBotProps {
  inline?: boolean;
}

const C = {
  bg: '#0b1326', l1: '#121f38', l2: '#162040', l3: '#1c2a4a', l4: '#243356',
  blue: '#adc6ff', amber: '#f7be1d', text: '#e2e8f0', dim: '#c2c6d6', dimmer: '#8892a4',
};

function parseMessage(content: string, msgIdx: number, copied: number | null, onCopy: (code: string, key: number) => void) {
  const segments: React.ReactNode[] = [];
  let partIdx = 0;
  const codeBlockRe = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRe.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before) segments.push(<TextSegment key={`t-${msgIdx}-${partIdx++}`} text={before} />);
    const lang = match[1] || 'code';
    const code = match[2];
    const copyKey = msgIdx * 1000 + partIdx;
    segments.push(
      <div key={`c-${msgIdx}-${partIdx++}`} style={{ marginTop: 14, background: C.bg, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${C.l3}` }}>
          <span style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{lang}</span>
          <button onClick={() => onCopy(code, copyKey)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.dimmer, cursor: 'pointer' }}>
            <Copy style={{ width: 12, height: 12 }} /> {copied === copyKey ? 'COPIED!' : 'COPY'}
          </button>
        </div>
        <pre style={{ padding: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.dim, lineHeight: 1.8, overflow: 'auto', margin: 0 }}>{code}</pre>
      </div>
    );
    lastIndex = match.index + match[0].length;
  }

  const tail = content.slice(lastIndex);
  if (tail) segments.push(<TextSegment key={`t-${msgIdx}-${partIdx}`} text={tail} />);
  return segments.length > 0 ? segments : <TextSegment key="t-0" text={content} />;
}

function TextSegment({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`\n]+`)/g);
  return (
    <div style={{ fontSize: 14, lineHeight: 1.8, color: C.dim }}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} style={{ color: C.text }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`') && p.endsWith('`'))
          return <code key={i} style={{ background: C.l4, padding: '1px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.blue }}>{p.slice(1, -1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </div>
  );
}

export function ChatBot({ inline = false }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>('ollama');
  const [showSettings, setShowSettings] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState(() => localStorage.getItem('claude_api_key') || '');
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => loadSettings().defaultModel || 'llama3.2');
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchOllamaModels(); }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const fetchOllamaModels = async () => {
    try {
      const res = await fetch('/api/chat/models');
      if (res.ok) {
        const models = await res.json();
        setOllamaModels(models);
        if (models.length > 0 && !models.find((m: OllamaModel) => m.name === selectedModel))
          setSelectedModel(models[0].name);
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const allMessages = [...messages, userMessage];
      if (provider === 'ollama') {
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
        const res = await fetch('/api/chat/ollama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel, messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
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
            if (data === '[DONE]') { setLoading(false); return; }
            if (data.startsWith('[ERROR]')) {
              setMessages(prev => { const u = [...prev]; u[u.length-1] = { ...u[u.length-1], content: data }; return u; });
              setLoading(false); return;
            }
            setMessages(prev => { const u = [...prev]; const last = u[u.length-1]; u[u.length-1] = { ...last, content: last.content + data }; return u; });
          }
        }
        setLoading(false); return;
      }
      const res = await fetch('/api/chat/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: claudeApiKey, model: 'claude-sonnet-4-20250514', messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Failed'}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string, key: number) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (!inline && !isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center" style={{ background: C.blue }}>
        <Bot className="w-7 h-7" style={{ color: C.bg }} />
      </button>
    );
  }

  const containerStyle = inline
    ? { height: '100%', display: 'flex', flexDirection: 'column' as const, background: C.bg, borderRadius: 12, overflow: 'hidden' }
    : { position: 'fixed' as const, bottom: 24, right: 24, width: 420, height: 640, background: C.bg, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', zIndex: 50 };

  return (
    <div style={containerStyle}>
      {/* Top bar */}
      <div style={{ padding: '8px 8px 12px', borderBottom: `1px solid ${C.l4}40`, display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.l2, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: C.amber, cursor: 'pointer', border: 'none' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.amber, flexShrink: 0 }} />
            {provider === 'ollama' ? 'OLLAMA' : 'CLAUDE'}
            <span style={{ fontSize: 11 }}>▾</span>
          </button>
          {showModelDropdown && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: C.l3, borderRadius: 10, overflow: 'hidden', zIndex: 100, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ padding: '4px 0', borderBottom: `1px solid ${C.l4}` }}>
                {[{id: 'ollama', label: 'Ollama (Local)'}, {id: 'claude', label: 'Claude API'}].map(p => (
                  <div key={p.id} onClick={() => setProvider(p.id as Provider)} style={{ padding: '8px 16px', fontSize: 12, color: provider === p.id ? C.blue : C.dim, background: provider === p.id ? C.l4 : 'transparent', cursor: 'pointer' }}>{p.label}</div>
                ))}
              </div>
              {provider === 'ollama' && ollamaModels.map(m => (
                <div key={m.name} onClick={() => { setSelectedModel(m.name); setShowModelDropdown(false); }}
                  style={{ padding: '10px 16px', fontSize: 13, color: m.name === selectedModel ? C.blue : C.dim, background: m.name === selectedModel ? C.l4 : 'transparent', cursor: 'pointer' }}>
                  {m.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <span style={{ fontSize: 13, color: C.dimmer }}>MODEL: {provider === 'ollama' ? selectedModel : 'claude-sonnet'}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <History style={{ width: 18, height: 18, color: C.dimmer, cursor: 'pointer' }} />
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <Settings style={{ width: 18, height: 18, color: showSettings ? C.blue : C.dimmer }} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.l4}`, background: C.l2, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {provider === 'claude' && (
            <>
              <label style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.06em' }}>CLAUDE API KEY</label>
              <input type="password" value={claudeApiKey} onChange={e => setClaudeApiKey(e.target.value)} placeholder="sk-ant-..."
                style={{ background: C.l3, border: `1px solid ${C.l4}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.text, outline: 'none' }} />
              <button onClick={() => { localStorage.setItem('claude_api_key', claudeApiKey); setShowSettings(false); }}
                style={{ background: C.blue, color: C.bg, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                Save Key
              </button>
            </>
          )}
          {provider === 'ollama' && (
            <div style={{ fontSize: 12, color: C.dimmer }}>Select model from the dropdown above</div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.dimmer, letterSpacing: '0.06em' }}>{'SESSION INITIALIZED \u2022 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        {messages.map((m, i) => (
          <div key={i}>
            {m.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '70%', background: C.l3, borderRadius: 14, borderBottomRightRadius: 4, padding: '16px 18px' }}>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: C.dim, margin: 0 }}>{m.content}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.l3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot style={{ width: 18, height: 18, color: C.amber }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.06em', marginBottom: 10 }}>
                    {provider === 'ollama' ? 'OLLAMA / LOCAL' : 'CLAUDE / API'}
                  </div>
                  {parseMessage(m.content, i, copied, copyCode)}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.l3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot style={{ width: 18, height: 18, color: C.amber }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingTop: 10 }}>
              {[0,1,2].map(di => <span key={di} className="animate-bounce" style={{ width: 7, height: 7, borderRadius: 4, background: C.dimmer, display: 'inline-block', animationDelay: `${di * 150}ms` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chip */}
      <div style={{ textAlign: 'center', padding: '0 0 10px', flexShrink: 0 }}>
        <button onClick={() => setInput('Run a diagnostic on the router and summarize the results')}
          style={{ background: C.l3, borderRadius: 20, padding: '6px 16px', fontSize: 12, color: C.dim, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: C.amber, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: C.amber }}>SUGGEST:</span> &quot;RUN DIAGNOSTIC ON ROUTER&quot;
        </button>
      </div>

      {/* Input */}
      <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>
        <div style={{ background: C.l2, borderRadius: 14, padding: '14px 16px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message AI Console..."
            rows={2}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: C.text, resize: 'none', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Plus style={{ width: 18, height: 18, color: C.dimmer, cursor: 'pointer', flexShrink: 0 }} />
            <Mic style={{ width: 18, height: 18, color: C.dimmer, cursor: 'pointer', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.dimmer, cursor: 'pointer', padding: '4px 10px', background: C.l3, borderRadius: 6 }}>
              <Paperclip style={{ width: 12, height: 12 }} /> CONTEXT
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{ width: 36, height: 36, borderRadius: 9, background: input.trim() ? C.blue : C.l4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', cursor: input.trim() ? 'pointer' : 'default', border: 'none' }}
              >
                <Send style={{ width: 15, height: 15, color: input.trim() ? C.bg : C.dimmer }} />
              </button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: C.dimmer, marginTop: 10, letterSpacing: '0.04em' }}>
          AI RESPONSES MAY BE INACCURATE. VERIFY CRITICAL SYSTEM ACTIONS.
        </div>
      </div>
    </div>
  );
}
