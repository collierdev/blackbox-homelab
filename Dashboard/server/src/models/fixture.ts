import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';

export interface LightFixture {
  id: string;
  name: string;
  lightIds: string[];  // Home Assistant entity IDs
  icon?: string;       // Icon name (e.g., 'lamp', 'ceiling', 'chandelier')
  room?: string;       // Room name for grouping
  order: number;       // Display order
  createdAt: string;
  updatedAt: string;
}

export interface CreateFixtureInput {
  name: string;
  lightIds: string[];
  icon?: string;
  room?: string;
}

export interface UpdateFixtureInput {
  name?: string;
  lightIds?: string[];
  icon?: string;
  room?: string;
  order?: number;
}

// Create a new fixture
export async function createFixture(input: CreateFixtureInput): Promise<LightFixture> {
  const session = getSession();
  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    // Get max order for new fixtures
    const orderResult = await session.run(`
      MATCH (f:LightFixture)
      RETURN COALESCE(MAX(f.order), -1) + 1 as nextOrder
    `);
    const order = orderResult.records[0]?.get('nextOrder')?.toNumber?.() ??
                  orderResult.records[0]?.get('nextOrder') ?? 0;

    const result = await session.run(`
      CREATE (f:LightFixture {
        id: $id,
        name: $name,
        lightIds: $lightIds,
        icon: $icon,
        room: $room,
        order: $order,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN f
    `, {
      id,
      name: input.name,
      lightIds: input.lightIds,
      icon: input.icon || null,
      room: input.room || null,
      order,
      createdAt: now,
      updatedAt: now
    });

    const node = result.records[0].get('f').properties;
    return {
      ...node,
      order: typeof node.order?.toNumber === 'function' ? node.order.toNumber() : node.order,
      createdAt: node.createdAt.toString(),
      updatedAt: node.updatedAt.toString()
    };
  } finally {
    await session.close();
  }
}

// Get all fixtures
export async function getAllFixtures(): Promise<LightFixture[]> {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (f:LightFixture)
      RETURN f
      ORDER BY f.order ASC, f.name ASC
    `);

    return result.records.map(record => {
      const node = record.get('f').properties;
      return {
        ...node,
        order: typeof node.order?.toNumber === 'function' ? node.order.toNumber() : node.order,
        createdAt: node.createdAt.toString(),
        updatedAt: node.updatedAt.toString()
      };
    });
  } finally {
    await session.close();
  }
}

// Get fixture by ID
export async function getFixtureById(id: string): Promise<LightFixture | null> {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (f:LightFixture {id: $id})
      RETURN f
    `, { id });

    if (result.records.length === 0) {
      return null;
    }

    const node = result.records[0].get('f').properties;
    return {
      ...node,
      order: typeof node.order?.toNumber === 'function' ? node.order.toNumber() : node.order,
      createdAt: node.createdAt.toString(),
      updatedAt: node.updatedAt.toString()
    };
  } finally {
    await session.close();
  }
}

// Get fixtures by room
export async function getFixturesByRoom(room: string): Promise<LightFixture[]> {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (f:LightFixture {room: $room})
      RETURN f
      ORDER BY f.order ASC, f.name ASC
    `, { room });

    return result.records.map(record => {
      const node = record.get('f').properties;
      return {
        ...node,
        order: typeof node.order?.toNumber === 'function' ? node.order.toNumber() : node.order,
        createdAt: node.createdAt.toString(),
        updatedAt: node.updatedAt.toString()
      };
    });
  } finally {
    await session.close();
  }
}

// Update fixture
export async function updateFixture(id: string, input: UpdateFixtureInput): Promise<LightFixture | null> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const setClauses: string[] = ['f.updatedAt = datetime($updatedAt)'];
    const params: Record<string, unknown> = { id, updatedAt: now };

    if (input.name !== undefined) {
      setClauses.push('f.name = $name');
      params.name = input.name;
    }
    if (input.lightIds !== undefined) {
      setClauses.push('f.lightIds = $lightIds');
      params.lightIds = input.lightIds;
    }
    if (input.icon !== undefined) {
      setClauses.push('f.icon = $icon');
      params.icon = input.icon;
    }
    if (input.room !== undefined) {
      setClauses.push('f.room = $room');
      params.room = input.room;
    }
    if (input.order !== undefined) {
      setClauses.push('f.order = $order');
      params.order = input.order;
    }

    const result = await session.run(`
      MATCH (f:LightFixture {id: $id})
      SET ${setClauses.join(', ')}
      RETURN f
    `, params);

    if (result.records.length === 0) {
      return null;
    }

    const node = result.records[0].get('f').properties;
    return {
      ...node,
      order: typeof node.order?.toNumber === 'function' ? node.order.toNumber() : node.order,
      createdAt: node.createdAt.toString(),
      updatedAt: node.updatedAt.toString()
    };
  } finally {
    await session.close();
  }
}

// Delete fixture
export async function deleteFixture(id: string): Promise<boolean> {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (f:LightFixture {id: $id})
      DELETE f
      RETURN count(f) as deleted
    `, { id });

    const deleted = result.records[0]?.get('deleted');
    return (typeof deleted?.toNumber === 'function' ? deleted.toNumber() : deleted) > 0;
  } finally {
    await session.close();
  }
}

// Add light to fixture
export async function addLightToFixture(fixtureId: string, lightId: string): Promise<LightFixture | null> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const result = await session.run(`
      MATCH (f:LightFixture {id: $fixtureId})
      WHERE NOT $lightId IN f.lightIds
      SET f.lightIds = f.lightIds + $lightId,
          f.updatedAt = datetime($updatedAt)
      RETURN f
    `, { fixtureId, lightId, updatedAt: now });

    if (result.records.length === 0) {
      // Light might already be in fixture, get current state
      return getFixtureById(fixtureId);
    }

    const node = result.records[0].get('f').properties;
    return {
      ...node,
      order: typeof node.order?.toNumber === 'function' ? node.order.toNumber() : node.order,
      createdAt: node.createdAt.toString(),
      updatedAt: node.updatedAt.toString()
    };
  } finally {
    await session.close();
  }
}

// Remove light from fixture
export async function removeLightFromFixture(fixtureId: string, lightId: string): Promise<LightFixture | null> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const result = await session.run(`
      MATCH (f:LightFixture {id: $fixtureId})
      SET f.lightIds = [x IN f.lightIds WHERE x <> $lightId],
          f.updatedAt = datetime($updatedAt)
      RETURN f
    `, { fixtureId, lightId, updatedAt: now });

    if (result.records.length === 0) {
      return null;
    }

    const node = result.records[0].get('f').properties;
    return {
      ...node,
      order: typeof node.order?.toNumber === 'function' ? node.order.toNumber() : node.order,
      createdAt: node.createdAt.toString(),
      updatedAt: node.updatedAt.toString()
    };
  } finally {
    await session.close();
  }
}

// Reorder fixtures
export async function reorderFixtures(fixtureOrders: { id: string; order: number }[]): Promise<void> {
  const session = getSession();

  try {
    for (const { id, order } of fixtureOrders) {
      await session.run(`
        MATCH (f:LightFixture {id: $id})
        SET f.order = $order
      `, { id, order });
    }
  } finally {
    await session.close();
  }
}
