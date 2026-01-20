"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getAllProjects = getAllProjects;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.reorderProjects = reorderProjects;
exports.getProjectByName = getProjectByName;
const uuid_1 = require("uuid");
const neo4j_1 = require("../config/neo4j");
/**
 * Create a new project
 */
async function createProject(name, color) {
    const session = (0, neo4j_1.getSession)();
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    // Get current max order
    const orderResult = await session.run(`
    MATCH (p:Project)
    RETURN coalesce(max(p.order), -1) + 1 as nextOrder
  `);
    const nextOrder = orderResult.records[0].get('nextOrder').toNumber();
    try {
        const result = await session.run(`
      CREATE (p:Project {
        id: $id,
        name: $name,
        color: $color,
        order: $order,
        createdAt: datetime($createdAt)
      })
      RETURN p
      `, {
            id,
            name,
            color: color || '#3B82F6',
            order: nextOrder,
            createdAt: now,
        });
        const project = result.records[0].get('p').properties;
        return convertNeo4jProject(project);
    }
    finally {
        await session.close();
    }
}
/**
 * Get all projects
 */
async function getAllProjects() {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (p:Project)
      RETURN p
      ORDER BY p.order ASC
    `);
        return result.records.map((record) => convertNeo4jProject(record.get('p').properties));
    }
    finally {
        await session.close();
    }
}
/**
 * Get project by ID
 */
async function getProjectById(id) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (p:Project {id: $id})
      RETURN p
      `, { id });
        if (result.records.length === 0) {
            return null;
        }
        return convertNeo4jProject(result.records[0].get('p').properties);
    }
    finally {
        await session.close();
    }
}
/**
 * Update project
 */
async function updateProject(id, data) {
    const session = (0, neo4j_1.getSession)();
    try {
        const setFields = [];
        const params = { id };
        if (data.name !== undefined) {
            setFields.push('p.name = $name');
            params.name = data.name;
        }
        if (data.color !== undefined) {
            setFields.push('p.color = $color');
            params.color = data.color;
        }
        if (data.order !== undefined) {
            setFields.push('p.order = $order');
            params.order = data.order;
        }
        const result = await session.run(`
      MATCH (p:Project {id: $id})
      SET ${setFields.join(', ')}
      RETURN p
      `, params);
        if (result.records.length === 0) {
            throw new Error(`Project ${id} not found`);
        }
        return convertNeo4jProject(result.records[0].get('p').properties);
    }
    finally {
        await session.close();
    }
}
/**
 * Delete project (optionally cascade delete events/tasks)
 */
async function deleteProject(id, cascade = false) {
    const session = (0, neo4j_1.getSession)();
    try {
        if (id === 'default') {
            throw new Error('Cannot delete default project');
        }
        if (cascade) {
            // Delete project and all related events/tasks
            await session.run(`
        MATCH (p:Project {id: $id})
        OPTIONAL MATCH (p)<-[:BELONGS_TO]-(e:Event)
        OPTIONAL MATCH (p)<-[:BELONGS_TO]-(t:Task)
        DETACH DELETE p, e, t
        `, { id });
        }
        else {
            // Move events/tasks to default project
            await session.run(`
        MATCH (p:Project {id: $id})<-[r:BELONGS_TO]-(node)
        MATCH (default:Project {id: 'default'})
        DELETE r
        CREATE (node)-[:BELONGS_TO]->(default)
        `, { id });
            // Delete empty project
            await session.run(`
        MATCH (p:Project {id: $id})
        DETACH DELETE p
        `, { id });
        }
        return true;
    }
    finally {
        await session.close();
    }
}
/**
 * Reorder projects
 */
async function reorderProjects(projectIds) {
    const session = (0, neo4j_1.getSession)();
    try {
        for (let i = 0; i < projectIds.length; i++) {
            await session.run(`
        MATCH (p:Project {id: $projectId})
        SET p.order = $order
        `, { projectId: projectIds[i], order: i });
        }
    }
    finally {
        await session.close();
    }
}
/**
 * Get project by name
 */
async function getProjectByName(name) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (p:Project {name: $name})
      RETURN p
      `, { name });
        if (result.records.length === 0) {
            return null;
        }
        const project = result.records[0].get('p').properties;
        return convertNeo4jProject(project);
    }
    finally {
        await session.close();
    }
}
/**
 * Convert Neo4j datetime to ISO string
 */
function convertNeo4jProject(project) {
    return {
        ...project,
        createdAt: project.createdAt?.toString() || project.createdAt,
    };
}
//# sourceMappingURL=project.js.map