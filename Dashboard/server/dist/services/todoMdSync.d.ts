/**
 * Sync TODO.md file to database
 */
export declare function syncTodoMdToDatabase(filePath: string): Promise<void>;
/**
 * Sync database tasks back to TODO.md file
 */
export declare function syncDatabaseToTodoMd(filePath: string): Promise<void>;
/**
 * Start watching TODO.md files for changes
 */
export declare function startTodoMdWatcher(): void;
/**
 * Stop watching TODO.md files
 */
export declare function stopTodoMdWatcher(): void;
/**
 * Manually trigger sync for all TODO.md files
 */
export declare function triggerManualTodoMdSync(): Promise<void>;
//# sourceMappingURL=todoMdSync.d.ts.map