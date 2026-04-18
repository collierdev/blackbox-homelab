import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const ALLOWED_ROOTS = ['/home/jwcollie', '/blackbox'];

function isAllowed(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return ALLOWED_ROOTS.some(root => resolved.startsWith(root));
}

router.get('/browse', (req: Request, res: Response) => {
  const dirPath = (req.query.path as string) || '/home/jwcollie';
  if (!isAllowed(dirPath)) {
    res.status(403).json({ error: 'Access denied to path: ' + dirPath });
    return;
  }
  try {
    if (!fs.existsSync(dirPath)) {
      res.status(404).json({ error: 'Directory not found', path: dirPath });
      return;
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const items = entries
      .filter(e => !e.name.startsWith('.'))
      .map(entry => {
        const fullPath = path.join(dirPath, entry.name);
        let size = 0;
        let modified = new Date();
        try {
          const stat = fs.statSync(fullPath);
          size = stat.size;
          modified = stat.mtime;
        } catch {}
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size,
          modified,
          extension: entry.isFile() ? path.extname(entry.name).toLowerCase() : null,
        };
      })
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    res.json({ path: dirPath, items, parent: path.dirname(dirPath) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read directory', details: String(error) });
  }
});

router.get('/read', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath || !isAllowed(filePath)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ path: filePath, content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file', details: String(error) });
  }
});

router.post('/write', (req: Request, res: Response) => {
  const { path: filePath, content } = req.body as { path: string; content: string };
  if (!filePath || !isAllowed(filePath)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to write file', details: String(error) });
  }
});

router.post('/create', (req: Request, res: Response) => {
  const { path: targetPath, type } = req.body as { path: string; type: 'file' | 'dir' };
  if (!targetPath || !isAllowed(targetPath)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  try {
    if (type === 'dir') {
      fs.mkdirSync(targetPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      if (!fs.existsSync(targetPath)) fs.writeFileSync(targetPath, '', 'utf-8');
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create', details: String(error) });
  }
});

router.delete('/delete', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath || !isAllowed(filePath)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete', details: String(error) });
  }
});

router.post('/rename', (req: Request, res: Response) => {
  const { oldPath, newPath } = req.body as { oldPath: string; newPath: string };
  if (!isAllowed(oldPath) || !isAllowed(newPath)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  try {
    fs.renameSync(oldPath, newPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rename', details: String(error) });
  }
});

export default router;
