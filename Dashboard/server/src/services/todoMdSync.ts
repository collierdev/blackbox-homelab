import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { createTask, updateTask, getAllTasks, deleteTask } from '../models/task';
import { getAllProjects, getProjectByName } from '../models/project';

const TODO_MD_PATHS = (process.env.TODO_MD_PATHS || '/home/jwcollie/TODO.md').split(',');

interface TodoMdTask {
  line: string;
  completed: boolean;
  title: string;
  priority?: 'low' | 'medium' | 'high';
  lineNumber: number;
  filePath: string;
}

let fileWatcher: chokidar.FSWatcher | null = null;

/**
 * Parse TODO.md file into tasks
 */
function parseTodoMd(filePath: string): TodoMdTask[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`TODO.md file not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const tasks: TodoMdTask[] = [];

    lines.forEach((line, index) => {
      // Match checkbox patterns: - [ ], - [x], - [X], * [ ], * [x], etc.
      const checkboxMatch = line.match(/^[\s]*[-*]\s*\[([ xX])\]\s*(.+)$/);

      if (checkboxMatch) {
        const completed = checkboxMatch[1].toLowerCase() === 'x';
        let title = checkboxMatch[2].trim();

        // Extract priority from tags like !high, !medium, !low
        let priority: 'low' | 'medium' | 'high' | undefined;
        const priorityMatch = title.match(/!\s*(high|medium|low)\b/i);
        if (priorityMatch) {
          priority = priorityMatch[1].toLowerCase() as 'low' | 'medium' | 'high';
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
  } catch (error) {
    console.error(`Failed to parse TODO.md file ${filePath}:`, error);
    return [];
  }
}

/**
 * Sync TODO.md file to database
 */
export async function syncTodoMdToDatabase(filePath: string): Promise<void> {
  console.log(`Syncing TODO.md file: ${filePath}`);

  try {
    const mdTasks = parseTodoMd(filePath);
    const dbTasks = await getAllTasks();
    const projects = await getAllProjects();

    // Find or create "TODO.md" project
    let todoMdProject = await getProjectByName('TODO.md');
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
          await updateTask(existingTask.id, {
            isCompleted: mdTask.completed,
          });
        }

        // Remove from map (so we know it's still in the file)
        dbTaskMap.delete(mdTask.title);
      } else {
        // Create new task
        await createTask({
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
      await deleteTask(task.id);
    }

    console.log(`Synced ${mdTasks.length} tasks from ${filePath}`);
  } catch (error) {
    console.error(`Failed to sync TODO.md file ${filePath}:`, error);
  }
}

/**
 * Sync database tasks back to TODO.md file
 */
export async function syncDatabaseToTodoMd(filePath: string): Promise<void> {
  console.log(`Writing tasks to TODO.md file: ${filePath}`);

  try {
    const tasks = await getAllTasks();
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
    } else {
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
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Wrote ${todoMdTasks.length} tasks to ${filePath}`);
  } catch (error) {
    console.error(`Failed to write TODO.md file ${filePath}:`, error);
  }
}

/**
 * Start watching TODO.md files for changes
 */
export function startTodoMdWatcher(): void {
  if (fileWatcher) {
    console.log('TODO.md watcher already running');
    return;
  }

  console.log('Starting TODO.md file watcher for:', TODO_MD_PATHS);

  // Initial sync for all files
  TODO_MD_PATHS.forEach(filePath => {
    const resolvedPath = filePath.trim();
    if (fs.existsSync(resolvedPath)) {
      syncTodoMdToDatabase(resolvedPath).catch(error => {
        console.error(`Initial sync failed for ${resolvedPath}:`, error);
      });
    }
  });

  // Watch files
  fileWatcher = chokidar.watch(TODO_MD_PATHS, {
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
export function stopTodoMdWatcher(): void {
  if (fileWatcher) {
    console.log('Stopping TODO.md watcher');
    fileWatcher.close();
    fileWatcher = null;
  }
}

/**
 * Manually trigger sync for all TODO.md files
 */
export async function triggerManualTodoMdSync(): Promise<void> {
  console.log('Manual TODO.md sync triggered');

  for (const filePath of TODO_MD_PATHS) {
    const resolvedPath = filePath.trim();
    if (fs.existsSync(resolvedPath)) {
      await syncTodoMdToDatabase(resolvedPath);
    }
  }
}
