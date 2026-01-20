import { Driver, Session } from 'neo4j-driver';
/**
 * Get or create Neo4J driver instance
 */
export declare function getDriver(): Driver;
/**
 * Get a new Neo4J session
 */
export declare function getSession(): Session;
/**
 * Close the Neo4J driver
 */
export declare function closeDriver(): Promise<void>;
/**
 * Initialize database schema (constraints and indexes)
 * Should be called once on application startup
 */
export declare function initializeSchema(): Promise<void>;
/**
 * Verify Neo4J connection
 */
export declare function verifyConnection(): Promise<boolean>;
/**
 * Get database statistics
 */
export declare function getDatabaseStats(): Promise<{
    events: number;
    tasks: number;
    projects: number;
    tags: number;
}>;
//# sourceMappingURL=neo4j.d.ts.map