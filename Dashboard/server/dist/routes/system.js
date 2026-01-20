"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemInfo_1 = require("../utils/systemInfo");
const router = (0, express_1.Router)();
router.get('/stats', async (req, res) => {
    try {
        const stats = await (0, systemInfo_1.getSystemStats)();
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting system stats:', error);
        res.status(500).json({ error: 'Failed to get system stats' });
    }
});
router.get('/cpu-history', async (req, res) => {
    try {
        const history = await (0, systemInfo_1.getCpuHistory)();
        res.json(history);
    }
    catch (error) {
        console.error('Error getting CPU history:', error);
        res.status(500).json({ error: 'Failed to get CPU history' });
    }
});
exports.default = router;
//# sourceMappingURL=system.js.map