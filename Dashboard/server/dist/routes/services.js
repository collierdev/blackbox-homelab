"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const docker_1 = require("../utils/docker");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const router = (0, express_1.Router)();
const ICONS_DIR = '/tmp/service-icons';
router.get('/', async (req, res) => {
    try {
        const services = await (0, docker_1.getAllServices)();
        res.json(services);
    }
    catch (error) {
        console.error('Error getting services:', error);
        res.status(500).json({ error: 'Failed to get services' });
    }
});
router.post('/:id/:action', async (req, res) => {
    const { id, action } = req.params;
    const { type } = req.body;
    if (!['start', 'stop', 'restart'].includes(action)) {
        res.status(400).json({ error: 'Invalid action. Use start, stop, or restart.' });
        return;
    }
    try {
        if (type === 'docker') {
            const containers = await (0, docker_1.getDockerContainers)();
            const container = containers.find(c => c.id === id || c.name.toLowerCase() === id.toLowerCase());
            if (!container) {
                res.status(404).json({ error: 'Container not found' });
                return;
            }
            await (0, docker_1.controlDockerContainer)(container.id, action);
        }
        else if (type === 'systemd') {
            await (0, docker_1.controlSystemdService)(id, action);
        }
        else {
            res.status(400).json({ error: 'Invalid service type. Use docker or systemd.' });
            return;
        }
        res.json({ success: true, message: `Service ${action} successful` });
    }
    catch (error) {
        console.error(`Error performing ${action} on service ${id}:`, error);
        res.status(500).json({ error: `Failed to ${action} service` });
    }
});
// Update service notes
router.post('/:name/notes', async (req, res) => {
    const { name } = req.params;
    const { notes } = req.body;
    try {
        (0, docker_1.setServiceNotes)(name, notes || '');
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error saving notes:', error);
        res.status(500).json({ error: 'Failed to save notes' });
    }
});
// Upload custom icon
router.post('/:name/icon', async (req, res) => {
    const { name } = req.params;
    const { icon } = req.body; // Base64 encoded image
    try {
        if (!fs.existsSync(ICONS_DIR)) {
            fs.mkdirSync(ICONS_DIR, { recursive: true });
        }
        if (!icon) {
            // Clear custom icon
            (0, docker_1.setServiceIcon)(name, '');
            res.json({ success: true });
            return;
        }
        // Extract base64 data and file extension
        const matches = icon.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (!matches) {
            res.status(400).json({ error: 'Invalid image format' });
            return;
        }
        const ext = matches[1] === 'svg+xml' ? 'svg' : matches[1];
        const data = matches[2];
        const filename = `${name.toLowerCase()}.${ext}`;
        const filepath = path.join(ICONS_DIR, filename);
        fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
        (0, docker_1.setServiceIcon)(name, `/api/services/${name}/icon-file`);
        res.json({ success: true, iconPath: `/api/services/${name}/icon-file` });
    }
    catch (error) {
        console.error('Error saving icon:', error);
        res.status(500).json({ error: 'Failed to save icon' });
    }
});
// Get custom icon file
router.get('/:name/icon-file', async (req, res) => {
    const { name } = req.params;
    try {
        const files = fs.readdirSync(ICONS_DIR).filter(f => f.startsWith(name.toLowerCase() + '.'));
        if (files.length === 0) {
            res.status(404).json({ error: 'Icon not found' });
            return;
        }
        const filepath = path.join(ICONS_DIR, files[0]);
        const ext = path.extname(files[0]).slice(1);
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
        res.setHeader('Content-Type', mimeType);
        res.sendFile(filepath);
    }
    catch (error) {
        res.status(404).json({ error: 'Icon not found' });
    }
});
exports.default = router;
//# sourceMappingURL=services.js.map