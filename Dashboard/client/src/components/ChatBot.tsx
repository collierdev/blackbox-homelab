import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Settings, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, OllamaModel } from '../types';

type Provider = 'ollama' | 'claude';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>('ollama');
  const [showSettings, setShowSettings] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState(() =>
    localStorage.getItem('claude_api_key') || ''
  );
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOllamaModels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchOllamaModels = async () => {
    try {
      const res = await fetch('/api/chat/models');
      if (res.ok) {
        const models = await res.json();
        setOllamaModels(models);
        if (models.length > 0 && !models.find((m: OllamaModel) => m.name === selectedModel)) {
          setSelectedModel(models[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('claude_api_key', claudeApiKey);
    setShowSettings(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const endpoint = provider === 'ollama' ? '/api/chat/ollama' : '/api/chat/claude';
      const body = provider === 'ollama'
        ? {
            model: selectedModel,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        : {
            apiKey: claudeApiKey,
            model: 'claude-sonnet-4-20250514',
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            }))
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
        <Bot className="w-7 h-7 text-primary-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary-foreground" />
          <span className="font-semibold text-primary-foreground">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-primary-foreground" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-secondary/50 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="claude">Claude API</option>
            </select>
          </div>

          {provider === 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                {ollamaModels.map(model => (
                  <option key={model.name} value={model.name}>{model.name}</option>
                ))}
              </select>
            </div>
          )}

          {provider === 'claude' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
              <input
                type="password"
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              />
              <button
                onClick={handleSaveApiKey}
                className="mt-2 w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
              >
                Save API Key
              </button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start a conversation with your AI assistant</p>
            <p className="text-sm mt-1">
              Using: {provider === 'ollama' ? `Ollama (${selectedModel})` : 'Claude API'}
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary' : 'bg-secondary'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Bot className="w-5 h-5 text-foreground" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-5 h-5 text-foreground" />
            </div>
            <div className="bg-secondary rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 bg-secondary border border-border rounded-xl resize-none text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
