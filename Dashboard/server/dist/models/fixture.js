"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFixture = createFixture;
exports.getAllFixtures = getAllFixtures;
exports.getFixtureById = getFixtureById;
exports.getFixturesByRoom = getFixturesByRoom;
exports.updateFixture = updateFixture;
exports.deleteFixture = deleteFixture;
exports.addLightToFixture = addLightToFixture;
exports.removeLightFromFixture = removeLightFromFixture;
exports.reorderFixtures = reorderFixtures;
const uuid_1 = require("uuid");
const neo4j_1 = require("../config/neo4j");
// Create a new fixture
async function createFixture(input) {
    const session = (0, neo4j_1.getSession)();
    const id = (0, uuid_1.v4)();
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
    }
    finally {
        await session.close();
    }
}
// Get all fixtures
async function getAllFixtures() {
    const session = (0, neo4j_1.getSession)();
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
    }
    finally {
        await session.close();
    }
}
// Get fixture by ID
async function getFixtureById(id) {
    const session = (0, neo4j_1.getSession)();
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
    }
    finally {
        await session.close();
    }
}
// Get fixtures by room
async function getFixturesByRoom(room) {
    const session = (0, neo4j_1.getSession)();
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
    }
    finally {
        await session.close();
    }
}
// Update fixture
async function updateFixture(id, input) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        const setClauses = ['f.updatedAt = datetime($updatedAt)'];
        const params = { id, updatedAt: now };
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
    }
    finally {
        await session.close();
    }
}
// Delete fixture
async function deleteFixture(id) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (f:LightFixture {id: $id})
      DELETE f
      RETURN count(f) as deleted
    `, { id });
        const deleted = result.records[0]?.get('deleted');
        return (typeof deleted?.toNumber === 'function' ? deleted.toNumber() : deleted) > 0;
    }
    finally {
        await session.close();
    }
}
// Add light to fixture
async function addLightToFixture(fixtureId, lightId) {
    const session = (0, neo4j_1.getSession)();
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
    }
    finally {
        await session.close();
    }
}
// Remove light from fixture
async function removeLightFromFixture(fixtureId, lightId) {
    const session = (0, neo4j_1.getSession)();
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
    }
    finally {
        await session.close();
    }
}
// Reorder fixtures
async function reorderFixtures(fixtureOrders) {
    const session = (0, neo4j_1.getSession)();
    try {
        for (const { id, order } of fixtureOrders) {
            await session.run(`
        MATCH (f:LightFixture {id: $id})
        SET f.order = $order
      `, { id, order });
        }
    }
    finally {
        await session.close();
    }
}
//# sourceMappingURL=fixture.js.map