"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriver = getDriver;
exports.getSession = getSession;
exports.closeDriver = closeDriver;
exports.initializeSchema = initializeSchema;
exports.verifyConnection = verifyConnection;
exports.getDatabaseStats = getDatabaseStats;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'dashboard123';
let driver = null;
/**
 * Get or create Neo4J driver instance
 */
function getDriver() {
    if (!driver) {
        driver = neo4j_driver_1.default.driver(URI, neo4j_driver_1.default.auth.basic(USER, PASSWORD), {
            maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        });
        console.log(`Neo4J driver created for ${URI}`);
    }
    return driver;
}
/**
 * Get a new Neo4J session
 */
function getSession() {
    return getDriver().session();
}
/**
 * Close the Neo4J driver
 */
async function closeDriver() {
    if (driver) {
        await driver.close();
        driver = null;
        console.log('Neo4J driver closed');
    }
}
/**
 * Initialize database schema (constraints and indexes)
 * Should be called once on application startup
 */
async function initializeSchema() {
    const session = getSession();
    try {
        console.log('Initializing Neo4J schema...');
        // Constraints (unique IDs)
        await session.run(`
      CREATE CONSTRAINT event_id IF NOT EXISTS
      FOR (e:Event) REQUIRE e.id IS UNIQUE
    `);
        await session.run(`
      CREATE CONSTRAINT task_id IF NOT EXISTS
      FOR (t:Task) REQUIRE t.id IS UNIQUE
    `);
        await session.run(`
      CREATE CONSTRAINT project_id IF NOT EXISTS
      FOR (p:Project) REQUIRE p.id IS UNIQUE
    `);
        await session.run(`
      CREATE CONSTRAINT tag_id IF NOT EXISTS
      FOR (tag:Tag) REQUIRE tag.id IS UNIQUE
    `);
        await session.run(`
      CREATE CONSTRAINT sync_account_id IF NOT EXISTS
      FOR (sa:SyncAccount) REQUIRE sa.id IS UNIQUE
    `);
        await session.run(`
      CREATE CONSTRAINT provider_config_provider IF NOT EXISTS
      FOR (pc:ProviderConfig) REQUIRE pc.provider IS UNIQUE
    `);
        // Indexes for performance
        await session.run(`
      CREATE INDEX event_datetime IF NOT EXISTS
      FOR (e:Event) ON (e.startDateTime, e.endDateTime)
    `);
        await session.run(`
      CREATE INDEX task_due IF NOT EXISTS
      FOR (t:Task) ON (t.dueDate)
    `);
        await session.run(`
      CREATE INDEX task_project IF NOT EXISTS
      FOR (t:Task) ON (t.projectId)
    `);
        await session.run(`
      CREATE INDEX event_completed IF NOT EXISTS
      FOR (e:Event) ON (e.isCompleted)
    `);
        await session.run(`
      CREATE INDEX task_completed IF NOT EXISTS
      FOR (t:Task) ON (t.isCompleted)
    `);
        console.log('✓ Neo4J schema initialized successfully');
        // Create default project if it doesn't exist
        await session.run(`
      MERGE (p:Project {id: 'default'})
      ON CREATE SET
        p.name = 'Personal',
        p.color = '#3B82F6',
        p.order = 0,
        p.createdAt = datetime()
    `);
        console.log('✓ Default project created');
    }
    catch (error) {
        console.error('Error initializing Neo4J schema:', error);
        throw error;
    }
    finally {
        await session.close();
    }
}
/**
 * Verify Neo4J connection
 */
async function verifyConnection() {
    const session = getSession();
    try {
        const result = await session.run('RETURN 1 as num');
        // Neo4j returns Integer objects, not plain numbers - use toNumber() or check .low property
        const num = result.records[0]?.get('num');
        const isConnected = result.records.length > 0 && (num === 1 ||
            (num && typeof num.toNumber === 'function' && num.toNumber() === 1) ||
            (num && num.low === 1));
        if (isConnected) {
            console.log('✓ Neo4J connection verified');
        }
        return isConnected;
    }
    catch (error) {
        console.error('✗ Neo4J connection failed:', error);
        return false;
    }
    finally {
        await session.close();
    }
}
/**
 * Get database statistics
 */
async function getDatabaseStats() {
    const session = getSession();
    try {
        const result = await session.run(`
      MATCH (e:Event)
      WITH count(e) as events
      MATCH (t:Task)
      WITH events, count(t) as tasks
      MATCH (p:Project)
      WITH events, tasks, count(p) as projects
      MATCH (tag:Tag)
      RETURN events, tasks, projects, count(tag) as tags
    `);
        if (result.records.length === 0) {
            return { events: 0, tasks: 0, projects: 0, tags: 0 };
        }
        const record = result.records[0];
        return {
            events: record.get('events').toNumber(),
            tasks: record.get('tasks').toNumber(),
            projects: record.get('projects').toNumber(),
            tags: record.get('tags').toNumber(),
        };
    }
    catch (error) {
        console.error('Error getting database stats:', error);
        return { events: 0, tasks: 0, projects: 0, tags: 0 };
    }
    finally {
        await session.close();
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing Neo4J driver...');
    await closeDriver();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Closing Neo4J driver...');
    await closeDriver();
    process.exit(0);
});
//# sourceMappingURL=neo4j.js.map