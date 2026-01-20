import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  projectId: string;
  tagIds: string[];
  subtasks: Task[];
  eventId?: string;
  order: number;
  origin: 'local' | 'todomd';
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new task
 */
export async function createTask(data: Partial<Task>): Promise<Task> {
  const session = getSession();
  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
      CREATE (t:Task {
        id: $id,
        title: $title,
        description: $description,
        dueDate: $dueDate,
        startDateTime: $startDateTime,
        endDateTime: $endDateTime,
        priority: $priority,
        isCompleted: $isCompleted,
        projectId: $projectId,
        tagIds: $tagIds,
        eventId: $eventId,
        order: $order,
        origin: $origin,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN t
      `,
      {
        id,
        title: data.title || '',
        description: data.description || null,
        dueDate: data.dueDate || null,
        startDateTime: data.startDateTime || null,
        endDateTime: data.endDateTime || null,
        priority: data.priority || 'medium',
        isCompleted: data.isCompleted || false,
        projectId: data.projectId || 'default',
        tagIds: data.tagIds || [],
        eventId: data.eventId || null,
        order: data.order || 0,
        origin: data.origin || 'local',
        createdAt: now,
        updatedAt: now,
      }
    );

    const task = result.records[0].get('t').properties;

    // Link to project
    if (data.projectId) {
      await linkTaskToProject(id, data.projectId);
    }

    return convertNeo4jTask(task);
  } finally {
    await session.close();
  }
}

/**
 * Get task by ID (with subtasks)
 */
export async function getTaskById(id: string): Promise<Task | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (t:Task {id: $id})
      OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
      OPTIONAL MATCH (t)-[:BELONGS_TO]->(p:Project)
      RETURN t, collect(st) as subtasks, p.id as projectId
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const task = record.get('t').properties;
    const subtasks = record.get('subtasks').map((st: any) => convertNeo4jTask(st.properties));
    const projectId = record.get('projectId');

    if (projectId) {
      task.projectId = projectId;
    }

    return {
      ...convertNeo4jTask(task),
      subtasks,
    };
  } finally {
    await session.close();
  }
}

/**
 * Get all tasks
 */
export async function getAllTasks(): Promise<Task[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (t:Task)
      WHERE NOT (t)<-[:HAS_SUBTASK]-()
      OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
      OPTIONAL MATCH (t)-[:BELONGS_TO]->(p:Project)
      RETURN t, collect(st) as subtasks, p.id as projectId
      ORDER BY t.order ASC, t.createdAt DESC
      `
    );

    return result.records.map((record) => {
      const task = record.get('t').properties;
      const subtasks = record.get('subtasks')
        .filter((st: any) => st) // Filter out nulls
        .map((st: any) => convertNeo4jTask(st.properties));
      const projectId = record.get('projectId');

      if (projectId) {
        task.projectId = projectId;
      }

      return {
        ...convertNeo4jTask(task),
        subtasks,
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Get tasks by project
 */
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (t:Task)-[:BELONGS_TO]->(p:Project {id: $projectId})
      WHERE NOT (t)<-[:HAS_SUBTASK]-()
      OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
      RETURN t, collect(st) as subtasks, p.id as projectId
      ORDER BY t.order ASC, t.createdAt DESC
      `,
      { projectId }
    );

    return result.records.map((record) => {
      const task = record.get('t').properties;
      const subtasks = record.get('subtasks')
        .filter((st: any) => st)
        .map((st: any) => convertNeo4jTask(st.properties));

      return {
        ...convertNeo4jTask(task),
        projectId,
        subtasks,
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Update task
 */
export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const setFields: string[] = [];
    const params: Record<string, any> = { id, updatedAt: now };

    if (data.title !== undefined) {
      setFields.push('t.title = $title');
      params.title = data.title;
    }
    if (data.description !== undefined) {
      setFields.push('t.description = $description');
      params.description = data.description;
    }
    if (data.dueDate !== undefined) {
      setFields.push('t.dueDate = $dueDate');
      params.dueDate = data.dueDate;
    }
    if (data.priority !== undefined) {
      setFields.push('t.priority = $priority');
      params.priority = data.priority;
    }
    if (data.isCompleted !== undefined) {
      setFields.push('t.isCompleted = $isCompleted');
      params.isCompleted = data.isCompleted;
    }
    if (data.order !== undefined) {
      setFields.push('t.order = $order');
      params.order = data.order;
    }

    setFields.push('t.updatedAt = datetime($updatedAt)');

    const result = await session.run(
      `
      MATCH (t:Task {id: $id})
      SET ${setFields.join(', ')}
      RETURN t
      `,
      params
    );

    if (result.records.length === 0) {
      throw new Error(`Task ${id} not found`);
    }

    if (data.projectId !== undefined) {
      await linkTaskToProject(id, data.projectId);
    }

    const task = result.records[0].get('t').properties;
    return convertNeo4jTask(task);
  } finally {
    await session.close();
  }
}

/**
 * Delete task (and all subtasks)
 */
export async function deleteTask(id: string): Promise<boolean> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (t:Task {id: $id})
      OPTIONAL MATCH (t)-[:HAS_SUBTASK*]->(st:Task)
      DETACH DELETE t, st
      RETURN count(t) as deleted
      `,
      { id }
    );

    return result.records[0].get('deleted').toNumber() > 0;
  } finally {
    await session.close();
  }
}

/**
 * Toggle task completion
 */
export async function completeTask(id: string): Promise<Task> {
  const task = await getTaskById(id);
  if (!task) {
    throw new Error(`Task ${id} not found`);
  }
  return updateTask(id, { isCompleted: !task.isCompleted });
}

/**
 * Create subtask
 */
export async function createSubtask(parentId: string, data: Partial<Task>): Promise<Task> {
  const session = getSession();
  const subtask = await createTask(data);

  try {
    await session.run(
      `
      MATCH (parent:Task {id: $parentId})
      MATCH (sub:Task {id: $subtaskId})
      CREATE (parent)-[:HAS_SUBTASK]->(sub)
      `,
      { parentId, subtaskId: subtask.id }
    );

    return subtask;
  } finally {
    await session.close();
  }
}

/**
 * Reorder tasks within a project
 */
export async function reorderTasks(projectId: string, taskIds: string[]): Promise<void> {
  const session = getSession();

  try {
    for (let i = 0; i < taskIds.length; i++) {
      await session.run(
        `
        MATCH (t:Task {id: $taskId})
        SET t.order = $order
        `,
        { taskId: taskIds[i], order: i }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Link task to project
 */
async function linkTaskToProject(taskId: string, projectId: string): Promise<void> {
  const session = getSession();

  try {
    // Remove existing relationship
    await session.run(
      `
      MATCH (t:Task {id: $taskId})-[r:BELONGS_TO]->()
      DELETE r
      `,
      { taskId }
    );

    // Create new relationship
    await session.run(
      `
      MATCH (t:Task {id: $taskId})
      MATCH (p:Project {id: $projectId})
      CREATE (t)-[:BELONGS_TO]->(p)
      `,
      { taskId, projectId }
    );
  } finally {
    await session.close();
  }
}

/**
 * Convert Neo4j datetime objects to ISO strings
 */
function convertNeo4jTask(task: any): Task {
  return {
    ...task,
    subtasks: task.subtasks || [],
    createdAt: task.createdAt?.toString() || task.createdAt,
    updatedAt: task.updatedAt?.toString() || task.updatedAt,
  };
}
