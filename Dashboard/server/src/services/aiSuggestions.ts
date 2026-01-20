import { getAllTasks } from '../models/task';
import { getAllEvents } from '../models/event';
import { getAllProjects } from '../models/project';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

interface TaskSuggestion {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
  reasoning: string;
}

/**
 * Call Ollama API for completions
 */
async function callOllama(prompt: string, model: string = 'llama2'): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.response as string;
  } catch (error) {
    console.error('Ollama API call failed:', error);
    throw error;
  }
}

/**
 * Generate task suggestions based on current calendar and tasks
 */
export async function generateTaskSuggestions(limit: number = 5): Promise<TaskSuggestion[]> {
  try {
    // Fetch current data
    const tasks = await getAllTasks();
    const events = await getAllEvents();
    const projects = await getAllProjects();

    // Filter incomplete tasks
    const incompleteTasks = tasks.filter(t => !t.isCompleted);

    // Get upcoming events (next 7 days)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.startDateTime);
      return eventDate >= now && eventDate <= weekFromNow && !e.isCompleted;
    });

    // Build context for AI
    const context = buildContextForAI(incompleteTasks, upcomingEvents, projects);

    // Create prompt for Ollama
    const prompt = `You are a productivity assistant. Based on the following context, suggest ${limit} new tasks that would be helpful.

${context}

Please suggest ${limit} tasks in the following format (one per line):
TASK: [task title] | PRIORITY: [low/medium/high] | PROJECT: [project name or "none"] | REASON: [brief reason]

Keep suggestions practical, actionable, and relevant to the user's current work.`;

    // Call Ollama
    const response = await callOllama(prompt);

    // Parse response
    const suggestions = parseAISuggestions(response, projects);

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Failed to generate task suggestions:', error);
    // Return empty array instead of throwing to avoid breaking the app
    return [];
  }
}

/**
 * Build context string for AI from user's data
 */
function buildContextForAI(tasks: any[], events: any[], projects: any[]): string {
  let context = '';

  // Projects
  if (projects.length > 0) {
    context += 'ACTIVE PROJECTS:\n';
    projects.forEach(p => {
      context += `- ${p.name}\n`;
    });
    context += '\n';
  }

  // Incomplete tasks
  if (tasks.length > 0) {
    context += 'CURRENT TASKS:\n';
    tasks.slice(0, 10).forEach(t => {
      context += `- ${t.title}`;
      if (t.dueDate) {
        context += ` (due: ${new Date(t.dueDate).toLocaleDateString()})`;
      }
      context += '\n';
    });
    context += '\n';
  }

  // Upcoming events
  if (events.length > 0) {
    context += 'UPCOMING EVENTS:\n';
    events.slice(0, 10).forEach(e => {
      context += `- ${e.title} on ${new Date(e.startDateTime).toLocaleDateString()}`;
      if (e.location) {
        context += ` at ${e.location}`;
      }
      context += '\n';
    });
    context += '\n';
  }

  return context;
}

/**
 * Parse AI response into structured task suggestions
 */
function parseAISuggestions(response: string, projects: any[]): TaskSuggestion[] {
  const suggestions: TaskSuggestion[] = [];
  const lines = response.split('\n');

  for (const line of lines) {
    if (!line.includes('TASK:')) continue;

    try {
      const parts = line.split('|').map(p => p.trim());

      const titlePart = parts.find(p => p.startsWith('TASK:'));
      const priorityPart = parts.find(p => p.startsWith('PRIORITY:'));
      const projectPart = parts.find(p => p.startsWith('PROJECT:'));
      const reasonPart = parts.find(p => p.startsWith('REASON:'));

      if (!titlePart) continue;

      const title = titlePart.replace('TASK:', '').trim();
      const priority = (priorityPart?.replace('PRIORITY:', '').trim().toLowerCase() || 'medium') as 'low' | 'medium' | 'high';
      const projectName = projectPart?.replace('PROJECT:', '').trim() || '';
      const reasoning = reasonPart?.replace('REASON:', '').trim() || 'AI suggested task';

      // Find matching project
      let projectId: string | undefined;
      if (projectName && projectName.toLowerCase() !== 'none') {
        const matchingProject = projects.find(p =>
          p.name.toLowerCase().includes(projectName.toLowerCase()) ||
          projectName.toLowerCase().includes(p.name.toLowerCase())
        );
        projectId = matchingProject?.id;
      }

      suggestions.push({
        title,
        description: reasoning,
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        projectId,
        reasoning,
      });
    } catch (error) {
      console.error('Failed to parse suggestion line:', line, error);
    }
  }

  return suggestions;
}

/**
 * Analyze task patterns and provide insights
 */
export async function analyzeTaskPatterns(): Promise<{
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTasksPerProject: number;
  mostActiveProject: string | null;
  overdueTasks: number;
  insights: string[];
}> {
  const tasks = await getAllTasks();
  const projects = await getAllProjects();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const now = new Date();
  const overdueTasks = tasks.filter(t =>
    !t.isCompleted &&
    t.dueDate &&
    new Date(t.dueDate) < now
  ).length;

  // Count tasks per project
  const tasksByProject: { [key: string]: number } = {};
  tasks.forEach(t => {
    if (t.projectId) {
      tasksByProject[t.projectId] = (tasksByProject[t.projectId] || 0) + 1;
    }
  });

  const averageTasksPerProject = projects.length > 0
    ? Object.values(tasksByProject).reduce((a, b) => a + b, 0) / projects.length
    : 0;

  let mostActiveProject: string | null = null;
  let maxTasks = 0;
  for (const [projectId, count] of Object.entries(tasksByProject)) {
    if (count > maxTasks) {
      maxTasks = count;
      const project = projects.find(p => p.id === projectId);
      mostActiveProject = project?.name || null;
    }
  }

  // Generate insights
  const insights: string[] = [];

  if (completionRate > 80) {
    insights.push('Great job! Your completion rate is excellent.');
  } else if (completionRate < 40) {
    insights.push('Consider breaking down large tasks into smaller, manageable pieces.');
  }

  if (overdueTasks > 5) {
    insights.push(`You have ${overdueTasks} overdue tasks. Consider reviewing and reprioritizing them.`);
  }

  if (mostActiveProject) {
    insights.push(`Most active project: ${mostActiveProject} (${maxTasks} tasks)`);
  }

  if (tasks.filter(t => !t.dueDate && !t.isCompleted).length > 10) {
    insights.push('Many tasks don\'t have due dates. Setting deadlines can improve productivity.');
  }

  return {
    totalTasks,
    completedTasks,
    completionRate,
    averageTasksPerProject,
    mostActiveProject,
    overdueTasks,
    insights,
  };
}
