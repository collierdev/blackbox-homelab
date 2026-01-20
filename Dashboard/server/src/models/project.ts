import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';

export interface Project {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  color?: string
): Promise<Project> {
  const session = getSession();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Get current max order
  const orderResult = await session.run(`
    MATCH (p:Project)
    RETURN coalesce(max(p.order), -1) + 1 as nextOrder
  `);
  const nextOrder = orderResult.records[0].get('nextOrder').toNumber();

  try {
    const result = await session.run(
      `
      CREATE (p:Project {
        id: $id,
        name: $name,
        color: $color,
        order: $order,
        createdAt: datetime($createdAt)
      })
      RETURN p
      `,
      {
        id,
        name,
        color: color || '#3B82F6',
        order: nextOrder,
        createdAt: now,
      }
    );

    const project = result.records[0].get('p').properties;
    return convertNeo4jProject(project);
  } finally {
    await session.close();
  }
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<Project[]> {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (p:Project)
      RETURN p
      ORDER BY p.order ASC
    `);

    return result.records.map((record) =>
      convertNeo4jProject(record.get('p').properties)
    );
  } finally {
    await session.close();
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (p:Project {id: $id})
      RETURN p
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    return convertNeo4jProject(result.records[0].get('p').properties);
  } finally {
    await session.close();
  }
}

/**
 * Update project
 */
export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<Project> {
  const session = getSession();

  try {
    const setFields: string[] = [];
    const params: Record<string, any> = { id };

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

    const result = await session.run(
      `
      MATCH (p:Project {id: $id})
      SET ${setFields.join(', ')}
      RETURN p
      `,
      params
    );

    if (result.records.length === 0) {
      throw new Error(`Project ${id} not found`);
    }

    return convertNeo4jProject(result.records[0].get('p').properties);
  } finally {
    await session.close();
  }
}

/**
 * Delete project (optionally cascade delete events/tasks)
 */
export async function deleteProject(
  id: string,
  cascade: boolean = false
): Promise<boolean> {
  const session = getSession();

  try {
    if (id === 'default') {
      throw new Error('Cannot delete default project');
    }

    if (cascade) {
      // Delete project and all related events/tasks
      await session.run(
        `
        MATCH (p:Project {id: $id})
        OPTIONAL MATCH (p)<-[:BELONGS_TO]-(e:Event)
        OPTIONAL MATCH (p)<-[:BELONGS_TO]-(t:Task)
        DETACH DELETE p, e, t
        `,
        { id }
      );
    } else {
      // Move events/tasks to default project
      await session.run(
        `
        MATCH (p:Project {id: $id})<-[r:BELONGS_TO]-(node)
        MATCH (default:Project {id: 'default'})
        DELETE r
        CREATE (node)-[:BELONGS_TO]->(default)
        `,
        { id }
      );

      // Delete empty project
      await session.run(
        `
        MATCH (p:Project {id: $id})
        DETACH DELETE p
        `,
        { id }
      );
    }

    return true;
  } finally {
    await session.close();
  }
}

/**
 * Reorder projects
 */
export async function reorderProjects(projectIds: string[]): Promise<void> {
  const session = getSession();

  try {
    for (let i = 0; i < projectIds.length; i++) {
      await session.run(
        `
        MATCH (p:Project {id: $projectId})
        SET p.order = $order
        `,
        { projectId: projectIds[i], order: i }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Get project by name
 */
export async function getProjectByName(name: string): Promise<Project | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (p:Project {name: $name})
      RETURN p
      `,
      { name }
    );

    if (result.records.length === 0) {
      return null;
    }

    const project = result.records[0].get('p').properties;
    return convertNeo4jProject(project);
  } finally {
    await session.close();
  }
}

/**
 * Convert Neo4j datetime to ISO string
 */
function convertNeo4jProject(project: any): Project {
  return {
    ...project,
    createdAt: project.createdAt?.toString() || project.createdAt,
  };
}
