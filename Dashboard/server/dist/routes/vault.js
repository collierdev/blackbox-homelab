"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const ALLOWED_ROOTS = ['/home/jwcollie', '/blackbox'];
function isAllowed(targetPath) {
    const resolved = path_1.default.resolve(targetPath);
    return ALLOWED_ROOTS.some(root => resolved.startsWith(root));
}
router.get('/browse', (req, res) => {
    const dirPath = req.query.path || '/home/jwcollie';
    if (!isAllowed(dirPath)) {
        res.status(403).json({ error: 'Access denied to path: ' + dirPath });
        return;
    }
    try {
        if (!fs_1.default.existsSync(dirPath)) {
            res.status(404).json({ error: 'Directory not found', path: dirPath });
            return;
        }
        const entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
        const items = entries
            .filter(e => !e.name.startsWith('.'))
            .map(entry => {
            const fullPath = path_1.default.join(dirPath, entry.name);
            let size = 0;
            let modified = new Date();
            try {
                const stat = fs_1.default.statSync(fullPath);
                size = stat.size;
                modified = stat.mtime;
            }
            catch { }
            return {
                name: entry.name,
                path: fullPath,
                isDirectory: entry.isDirectory(),
                size,
                modified,
                extension: entry.isFile() ? path_1.default.extname(entry.name).toLowerCase() : null,
            };
        })
            .sort((a, b) => {
            if (a.isDirectory !== b.isDirectory)
                return a.isDirectory ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        res.json({ path: dirPath, items, parent: path_1.default.dirname(dirPath) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read directory', details: String(error) });
    }
});
router.get('/read', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !isAllowed(filePath)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        res.json({ path: filePath, content });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read file', details: String(error) });
    }
});
router.post('/write', (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath || !isAllowed(filePath)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
        fs_1.default.writeFileSync(filePath, content, 'utf-8');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to write file', details: String(error) });
    }
});
router.post('/create', (req, res) => {
    const { path: targetPath, type } = req.body;
    if (!targetPath || !isAllowed(targetPath)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        if (type === 'dir') {
            fs_1.default.mkdirSync(targetPath, { recursive: true });
        }
        else {
            fs_1.default.mkdirSync(path_1.default.dirname(targetPath), { recursive: true });
            if (!fs_1.default.existsSync(targetPath))
                fs_1.default.writeFileSync(targetPath, '', 'utf-8');
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create', details: String(error) });
    }
});
router.delete('/delete', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !isAllowed(filePath)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            fs_1.default.rmSync(filePath, { recursive: true });
        }
        else {
            fs_1.default.unlinkSync(filePath);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete', details: String(error) });
    }
});
router.post('/rename', (req, res) => {
    const { oldPath, newPath } = req.body;
    if (!isAllowed(oldPath) || !isAllowed(newPath)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    try {
        fs_1.default.renameSync(oldPath, newPath);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to rename', details: String(error) });
    }
});
exports.default = router;
//# sourceMappingURL=vault.js.map