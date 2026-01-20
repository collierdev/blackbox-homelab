"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.getTaskById = getTaskById;
exports.getAllTasks = getAllTasks;
exports.getTasksByProject = getTasksByProject;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.completeTask = completeTask;
exports.createSubtask = createSubtask;
exports.reorderTasks = reorderTasks;
const uuid_1 = require("uuid");
const neo4j_1 = require("../config/neo4j");
/**
 * Create a new task
 */
async function createTask(data) {
    const session = (0, neo4j_1.getSession)();
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    try {
        const result = await session.run(`
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
      `, {
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
        });
        const task = result.records[0].get('t').properties;
        // Link to project
        if (data.projectId) {
            await linkTaskToProject(id, data.projectId);
        }
        return convertNeo4jTask(task);
    }
    finally {
        await session.close();
    }
}
/**
 * Get task by ID (with subtasks)
 */
async function getTaskById(id) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (t:Task {id: $id})
      OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
      OPTIONAL MATCH (t)-[:BELONGS_TO]->(p:Project)
      RETURN t, collect(st) as subtasks, p.id as projectId
      `, { id });
        if (result.records.length === 0) {
            return null;
        }
        const record = result.records[0];
        const task = record.get('t').properties;
        const subtasks = record.get('subtasks').map((st) => convertNeo4jTask(st.properties));
        const projectId = record.get('projectId');
        if (projectId) {
            task.projectId = projectId;
        }
        return {
            ...convertNeo4jTask(task),
            subtasks,
        };
    }
    finally {
        await session.close();
    }
}
/**
 * Get all tasks
 */
async function getAllTasks() {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (t:Task)
      WHERE NOT (t)<-[:HAS_SUBTASK]-()
      OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
      OPTIONAL MATCH (t)-[:BELONGS_TO]->(p:Project)
      RETURN t, collect(st) as subtasks, p.id as projectId
      ORDER BY t.order ASC, t.createdAt DESC
      `);
        return result.records.map((record) => {
            const task = record.get('t').properties;
            const subtasks = record.get('subtasks')
                .filter((st) => st) // Filter out nulls
                .map((st) => convertNeo4jTask(st.properties));
            const projectId = record.get('projectId');
            if (projectId) {
                task.projectId = projectId;
            }
            return {
                ...convertNeo4jTask(task),
                subtasks,
            };
        });
    }
    finally {
        await session.close();
    }
}
/**
 * Get tasks by project
 */
async function getTasksByProject(projectId) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (t:Task)-[:BELONGS_TO]->(p:Project {id: $projectId})
      WHERE NOT (t)<-[:HAS_SUBTASK]-()
      OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
      RETURN t, collect(st) as subtasks, p.id as projectId
      ORDER BY t.order ASC, t.createdAt DESC
      `, { projectId });
        return result.records.map((record) => {
            const task = record.get('t').properties;
            const subtasks = record.get('subtasks')
                .filter((st) => st)
                .map((st) => convertNeo4jTask(st.properties));
            return {
                ...convertNeo4jTask(task),
                projectId,
                subtasks,
            };
        });
    }
    finally {
        await session.close();
    }
}
/**
 * Update task
 */
async function updateTask(id, data) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        const setFields = [];
        const params = { id, updatedAt: now };
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
        const result = await session.run(`
      MATCH (t:Task {id: $id})
      SET ${setFields.join(', ')}
      RETURN t
      `, params);
        if (result.records.length === 0) {
            throw new Error(`Task ${id} not found`);
        }
        if (data.projectId !== undefined) {
            await linkTaskToProject(id, data.projectId);
        }
        const task = result.records[0].get('t').properties;
        return convertNeo4jTask(task);
    }
    finally {
        await session.close();
    }
}
/**
 * Delete task (and all subtasks)
 */
async function deleteTask(id) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (t:Task {id: $id})
      OPTIONAL MATCH (t)-[:HAS_SUBTASK*]->(st:Task)
      DETACH DELETE t, st
      RETURN count(t) as deleted
      `, { id });
        return result.records[0].get('deleted').toNumber() > 0;
    }
    finally {
        await session.close();
    }
}
/**
 * Toggle task completion
 */
async function completeTask(id) {
    const task = await getTaskById(id);
    if (!task) {
        throw new Error(`Task ${id} not found`);
    }
    return updateTask(id, { isCompleted: !task.isCompleted });
}
/**
 * Create subtask
 */
async function createSubtask(parentId, data) {
    const session = (0, neo4j_1.getSession)();
    const subtask = await createTask(data);
    try {
        await session.run(`
      MATCH (parent:Task {id: $parentId})
      MATCH (sub:Task {id: $subtaskId})
      CREATE (parent)-[:HAS_SUBTASK]->(sub)
      `, { parentId, subtaskId: subtask.id });
        return subtask;
    }
    finally {
        await session.close();
    }
}
/**
 * Reorder tasks within a project
 */
async function reorderTasks(projectId, taskIds) {
    const session = (0, neo4j_1.getSession)();
    try {
        for (let i = 0; i < taskIds.length; i++) {
            await session.run(`
        MATCH (t:Task {id: $taskId})
        SET t.order = $order
        `, { taskId: taskIds[i], order: i });
        }
    }
    finally {
        await session.close();
    }
}
/**
 * Link task to project
 */
async function linkTaskToProject(taskId, projectId) {
    const session = (0, neo4j_1.getSession)();
    try {
        // Remove existing relationship
        await session.run(`
      MATCH (t:Task {id: $taskId})-[r:BELONGS_TO]->()
      DELETE r
      `, { taskId });
        // Create new relationship
        await session.run(`
      MATCH (t:Task {id: $taskId})
      MATCH (p:Project {id: $projectId})
      CREATE (t)-[:BELONGS_TO]->(p)
      `, { taskId, projectId });
    }
    finally {
        await session.close();
    }
}
/**
 * Convert Neo4j datetime objects to ISO strings
 */
function convertNeo4jTask(task) {
    return {
        ...task,
        subtasks: task.subtasks || [],
        createdAt: task.createdAt?.toString() || task.createdAt,
        updatedAt: task.updatedAt?.toString() || task.updatedAt,
    };
}
//# sourceMappingURL=task.js.map