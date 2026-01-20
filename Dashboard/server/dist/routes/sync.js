"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const syncAccount_1 = require("../models/syncAccount");
const router = (0, express_1.Router)();
// Get all sync accounts
router.get('/accounts', async (_req, res) => {
    try {
        const accounts = await (0, syncAccount_1.getAllSyncAccounts)();
        // Don't send encrypted tokens to frontend
        const sanitized = accounts.map((account) => ({
            id: account.id,
            provider: account.provider,
            email: account.email,
            lastSync: account.lastSync,
            status: account.status,
            errorMessage: account.errorMessage,
            createdAt: account.createdAt,
        }));
        res.json(sanitized);
    }
    catch (error) {
        console.error('Error getting sync accounts:', error);
        res.status(500).json({ error: 'Failed to get sync accounts' });
    }
});
// Get single sync account
router.get('/accounts/:id', async (req, res) => {
    try {
        const account = await (0, syncAccount_1.getSyncAccountById)(req.params.id);
        if (!account) {
            res.status(404).json({ error: 'Sync account not found' });
            return;
        }
        // Don't send encrypted tokens
        const sanitized = {
            id: account.id,
            provider: account.provider,
            email: account.email,
            lastSync: account.lastSync,
            status: account.status,
            errorMessage: account.errorMessage,
            createdAt: account.createdAt,
        };
        res.json(sanitized);
    }
    catch (error) {
        console.error('Error getting sync account:', error);
        res.status(500).json({ error: 'Failed to get sync account' });
    }
});
// Delete/disconnect sync account
router.delete('/accounts/:id', async (req, res) => {
    try {
        const { deleteEvents } = req.query;
        const deleted = await (0, syncAccount_1.deleteSyncAccount)(req.params.id, deleteEvents === 'true');
        if (!deleted) {
            res.status(404).json({ error: 'Sync account not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting sync account:', error);
        res.status(500).json({ error: 'Failed to delete sync account' });
    }
});
// OAuth endpoints (placeholder - will implement in Phase 4)
router.get('/:provider/auth', async (req, res) => {
    res.status(501).json({
        error: 'OAuth not yet implemented',
        message: 'Calendar sync will be implemented in Phase 4',
    });
});
router.get('/:provider/callback', async (req, res) => {
    res.status(501).json({
        error: 'OAuth not yet implemented',
        message: 'Calendar sync will be implemented in Phase 4',
    });
});
router.post('/:provider/trigger', async (req, res) => {
    res.status(501).json({
        error: 'Manual sync not yet implemented',
        message: 'Calendar sync will be implemented in Phase 4',
    });
});
exports.default = router;
//# sourceMappingURL=sync.js.map