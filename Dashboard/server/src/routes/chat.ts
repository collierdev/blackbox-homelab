import { Router, Request, Response } from 'express';

const router = Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AGENT_URL = process.env.AGENT_URL || 'http://192.168.50.39:8001';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ChatMessage[];
}

interface OllamaTagsResponse {
  models: { name: string; model: string; modified_at: string; size: number }[];
}

interface OllamaChatResponse {
  message?: { content: string };
  model: string;
  done: boolean;
}

interface ClaudeResponse {
  content?: { text: string }[];
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

interface ClaudeErrorResponse {
  error?: { message: string };
}

router.get('/models', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch models from Ollama');
    }
    const data = await response.json() as OllamaTagsResponse;
    res.json(data.models || []);
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    res.status(500).json({ error: 'Failed to fetch models', models: [] });
  }
});

router.post('/ollama', async (req: Request, res: Response) => {
  const { model, messages } = req.body as OllamaRequest;

  if (!model || !messages) {
    res.status(400).json({ error: 'Model and messages are required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);
  res.on('close', () => { controller.abort(); clearTimeout(timeoutId); });

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      res.write('data: [ERROR] Ollama request failed\n\n');
      res.end();
      clearTimeout(timeoutId);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!;
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as OllamaChatResponse;
          if (parsed.message?.content) {
            res.write(`data: ${parsed.message.content}\n\n`);
          }
          if (parsed.done) {
            res.write('data: [DONE]\n\n');
            res.end();
            clearTimeout(timeoutId);
            return;
          }
        } catch { /* skip malformed lines */ }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error && err.name === 'AbortError'
      ? '[ERROR] Request timed out after 120s'
      : '[ERROR] Ollama connection failed';
    res.write(`data: ${msg}\n\n`);
    res.end();
  }
  clearTimeout(timeoutId);
});

router.post('/claude', async (req: Request, res: Response) => {
  try {
    const { apiKey, model, messages } = req.body;

    if (!apiKey) {
      res.status(400).json({ error: 'API key is required' });
      return;
    }

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    const claudeMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: claudeMessages
      } as ClaudeRequest)
    });

    if (!response.ok) {
      const errorData = await response.json() as ClaudeErrorResponse;
      throw new Error(errorData.error?.message || 'Claude API error');
    }

    const data = await response.json() as ClaudeResponse;
    res.json({
      content: data.content?.[0]?.text || '',
      model: data.model,
      usage: data.usage
    });
  } catch (error) {
    console.error('Error with Claude chat:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get response from Claude'
    });
  }
});

router.post('/gemini', async (req: Request, res: Response) => {
  try {
    const { apiKey, model, messages } = req.body as {
      apiKey: string;
      model?: string;
      messages: ChatMessage[];
    };

    if (!apiKey) {
      res.status(400).json({ error: 'API key is required' });
      return;
    }

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    const geminiModel = model || 'gemini-2.0-flash';
    const systemMessages = messages.filter(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      contents: chatMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 4096 },
    };

    if (systemMessages.length > 0) {
      body.systemInstruction = {
        parts: [{ text: systemMessages.map(m => m.content).join('\n') }],
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json() as { error?: { message: string } };
      throw new Error(err.error?.message || 'Gemini API error');
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ content: text, model: geminiModel });
  } catch (error) {
    console.error('Error with Gemini chat:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get response from Gemini',
    });
  }
});

router.post('/pull', async (req: Request, res: Response) => {
  try {
    const { model } = req.body as { model: string };
    if (!model) {
      res.status(400).json({ error: 'Model name required' });
      return;
    }
    const response = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false }),
    });
    if (!response.ok) throw new Error(`Pull failed: ${response.statusText}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error pulling model:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Pull failed' });
  }
});

// ── Pi Agent (LangGraph + Memory) ──────────────────────────────────────────

router.post('/agent', async (req: Request, res: Response) => {
  const { model, messages } = req.body as { model?: string; messages: ChatMessage[] };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Messages are required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const controller = new AbortController();
  // No fixed deadline — only abort when the client disconnects.
  // The agent's own heartbeat loop keeps the connection alive during model loading.
  res.on('close', () => { controller.abort(); });

  try {
    const response = await fetch(`${AGENT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || 'llama3.2:latest', messages }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      res.write('data: [ERROR] Agent unavailable — is pi-agent running?\n\n');
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!;
      for (const line of lines) {
        if (line.trim()) res.write(line + '\n');
      }
    }
    if (buffer.trim()) res.write(buffer + '\n');
    res.end();
  } catch (err: unknown) {
    const msg = err instanceof Error && err.name === 'AbortError'
      ? '[ERROR] Connection closed by client'
      : '[ERROR] Agent connection failed';
    res.write(`data: ${msg}\n\n`);
    res.end();
  }
});

router.get('/agent/health', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${AGENT_URL}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await response.json() as Record<string, unknown>;
    res.json({ available: true, ...data });
  } catch {
    res.json({ available: false });
  }
});

router.post('/agent/daily-brief', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${AGENT_URL}/daily-brief`, {
      method: 'POST',
      signal: AbortSignal.timeout(300_000),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Agent unavailable' });
  }
});

export default router;
