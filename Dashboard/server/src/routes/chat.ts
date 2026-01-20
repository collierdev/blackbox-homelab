import { Router, Request, Response } from 'express';

const router = Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

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
  try {
    const { model, messages } = req.body as OllamaRequest;

    if (!model || !messages) {
      res.status(400).json({ error: 'Model and messages are required' });
      return;
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json() as OllamaChatResponse;
    res.json({
      content: data.message?.content || '',
      model: data.model,
      done: data.done
    });
  } catch (error) {
    console.error('Error with Ollama chat:', error);
    res.status(500).json({ error: 'Failed to get response from Ollama' });
  }
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

export default router;
