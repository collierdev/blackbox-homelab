"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
router.get('/models', async (req, res) => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        if (!response.ok) {
            throw new Error('Failed to fetch models from Ollama');
        }
        const data = await response.json();
        res.json(data.models || []);
    }
    catch (error) {
        console.error('Error fetching Ollama models:', error);
        res.status(500).json({ error: 'Failed to fetch models', models: [] });
    }
});
router.post('/ollama', async (req, res) => {
    try {
        const { model, messages } = req.body;
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
        const data = await response.json();
        res.json({
            content: data.message?.content || '',
            model: data.model,
            done: data.done
        });
    }
    catch (error) {
        console.error('Error with Ollama chat:', error);
        res.status(500).json({ error: 'Failed to get response from Ollama' });
    }
});
router.post('/claude', async (req, res) => {
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
        const claudeMessages = messages.map((msg) => ({
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
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Claude API error');
        }
        const data = await response.json();
        res.json({
            content: data.content?.[0]?.text || '',
            model: data.model,
            usage: data.usage
        });
    }
    catch (error) {
        console.error('Error with Claude chat:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get response from Claude'
        });
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map