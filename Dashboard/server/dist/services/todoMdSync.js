"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTodoMdToDatabase = syncTodoMdToDatabase;
exports.syncDatabaseToTodoMd = syncDatabaseToTodoMd;
exports.startTodoMdWatcher = startTodoMdWatcher;
exports.stopTodoMdWatcher = stopTodoMdWatcher;
exports.triggerManualTodoMdSync = triggerManualTodoMdSync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
const task_1 = require("../models/task");
const project_1 = require("../models/project");
const TODO_MD_PATHS = (process.env.TODO_MD_PATHS || '/home/jwcollie/TODO.md').split(',');
let fileWatcher = null;
/**
 * Parse TODO.md file into tasks
 */
function parseTodoMd(filePath) {
    try {
        if (!fs_1.default.existsSync(filePath)) {
            console.log(`TODO.md file not found: ${filePath}`);
            return [];
        }
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const tasks = [];
        lines.forEach((line, index) => {
            // Match checkbox patterns: - [ ], - [x], - [X], * [ ], * [x], etc.
            const checkboxMatch = line.match(/^[\s]*[-*]\s*\[([ xX])\]\s*(.+)$/);
            if (checkboxMatch) {
                const completed = checkboxMatch[1].toLowerCase() === 'x';
                let title = checkboxMatch[2].trim();
                // Extract priority from tags like !high, !medium, !low
                let priority;
                const priorityMatch = title.match(/!\s*(high|medium|low)\b/i);
                if (priorityMatch) {
                    priority = priorityMatch[1].toLowerCase();
                    title = title.replace(/!\s*(high|medium|low)\b/gi, '').trim();
                }
                tasks.push({
                    line,
                    completed,
                    title,
                    priority,
                    lineNumber: index + 1,
                    filePath,
                });
            }
        });
        return tasks;
    }
    catch (error) {
        console.error(`Failed to parse TODO.md file ${filePath}:`, error);
        return [];
    }
}
/**
 * Sync TODO.md file to database
 */
async function syncTodoMdToDatabase(filePath) {
    console.log(`Syncing TODO.md file: ${filePath}`);
    try {
        const mdTasks = parseTodoMd(filePath);
        const dbTasks = await (0, task_1.getAllTasks)();
        const projects = await (0, project_1.getAllProjects)();
        // Find or create "TODO.md" project
        let todoMdProject = await (0, project_1.getProjectByName)('TODO.md');
        if (!todoMdProject) {
            // Project will be created by the model if it doesn't exist
            // For now, we'll just use undefined project ID
        }
        // Get tasks from this file
        const fileDbTasks = dbTasks.filter(t => t.origin === 'todomd');
        // Create a mapping of title to DB task
        const dbTaskMap = new Map(fileDbTasks.map(t => [t.title, t]));
        // Sync tasks from file to database
        for (const mdTask of mdTasks) {
            const existingTask = dbTaskMap.get(mdTask.title);
            if (existingTask) {
                // Update existing task
                if (existingTask.isCompleted !== mdTask.completed) {
                    await (0, task_1.updateTask)(existingTask.id, {
                        isCompleted: mdTask.completed,
                    });
                }
                // Remove from map (so we know it's still in the file)
                dbTaskMap.delete(mdTask.title);
            }
            else {
                // Create new task
                await (0, task_1.createTask)({
                    title: mdTask.title,
                    isCompleted: mdTask.completed,
                    priority: mdTask.priority || 'medium',
                    origin: 'todomd',
                    projectId: todoMdProject?.id,
                });
            }
        }
        // Delete tasks that are no longer in the file
        for (const [title, task] of dbTaskMap.entries()) {
            console.log(`Deleting task no longer in TODO.md: ${title}`);
            await (0, task_1.deleteTask)(task.id);
        }
        console.log(`Synced ${mdTasks.length} tasks from ${filePath}`);
    }
    catch (error) {
        console.error(`Failed to sync TODO.md file ${filePath}:`, error);
    }
}
/**
 * Sync database tasks back to TODO.md file
 */
async function syncDatabaseToTodoMd(filePath) {
    console.log(`Writing tasks to TODO.md file: ${filePath}`);
    try {
        const tasks = await (0, task_1.getAllTasks)();
        const todoMdTasks = tasks.filter(t => t.origin === 'todomd');
        // Group by completion status
        const incompleteTasks = todoMdTasks.filter(t => !t.isCompleted);
        const completedTasks = todoMdTasks.filter(t => t.isCompleted);
        // Build file content
        let content = '# TODO\n\n';
        content += '## Tasks\n\n';
        // Incomplete tasks first
        if (incompleteTasks.length > 0) {
            incompleteTasks.forEach(task => {
                const priorityTag = task.priority && task.priority !== 'medium' ? ` !${task.priority}` : '';
                content += `- [ ] ${task.title}${priorityTag}\n`;
            });
        }
        else {
            content += 'No pending tasks!\n';
        }
        // Completed tasks
        if (completedTasks.length > 0) {
            content += '\n## Completed\n\n';
            completedTasks.forEach(task => {
                content += `- [x] ${task.title}\n`;
            });
        }
        // Write to file
        const dir = path_1.default.dirname(filePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(filePath, content, 'utf-8');
        console.log(`Wrote ${todoMdTasks.length} tasks to ${filePath}`);
    }
    catch (error) {
        console.error(`Failed to write TODO.md file ${filePath}:`, error);
    }
}
/**
 * Start watching TODO.md files for changes
 */
function startTodoMdWatcher() {
    if (fileWatcher) {
        console.log('TODO.md watcher already running');
        return;
    }
    console.log('Starting TODO.md file watcher for:', TODO_MD_PATHS);
    // Initial sync for all files
    TODO_MD_PATHS.forEach(filePath => {
        const resolvedPath = filePath.trim();
        if (fs_1.default.existsSync(resolvedPath)) {
            syncTodoMdToDatabase(resolvedPath).catch(error => {
                console.error(`Initial sync failed for ${resolvedPath}:`, error);
            });
        }
    });
    // Watch files
    fileWatcher = chokidar_1.default.watch(TODO_MD_PATHS, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true, // Don't trigger on initial add
    });
    fileWatcher
        .on('change', (filePath) => {
        console.log(`TODO.md file changed: ${filePath}`);
        syncTodoMdToDatabase(filePath).catch(error => {
            console.error(`Sync failed for ${filePath}:`, error);
        });
    })
        .on('add', (filePath) => {
        console.log(`TODO.md file added: ${filePath}`);
        syncTodoMdToDatabase(filePath).catch(error => {
            console.error(`Sync failed for ${filePath}:`, error);
        });
    })
        .on('error', (error) => {
        console.error('TODO.md watcher error:', error);
    });
    console.log('TODO.md watcher started');
}
/**
 * Stop watching TODO.md files
 */
function stopTodoMdWatcher() {
    if (fileWatcher) {
        console.log('Stopping TODO.md watcher');
        fileWatcher.close();
        fileWatcher = null;
    }
}
/**
 * Manually trigger sync for all TODO.md files
 */
async function triggerManualTodoMdSync() {
    console.log('Manual TODO.md sync triggered');
    for (const filePath of TODO_MD_PATHS) {
        const resolvedPath = filePath.trim();
        if (fs_1.default.existsSync(resolvedPath)) {
            await syncTodoMdToDatabase(resolvedPath);
        }
    }
}
//# sourceMappingURL=todoMdSync.js.map