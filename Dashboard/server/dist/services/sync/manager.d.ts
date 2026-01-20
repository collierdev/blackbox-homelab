/**
 * Sync a single account
 */
export declare function syncAccount(syncAccountId: string, provider: string): Promise<void>;
/**
 * Sync all active accounts
 */
export declare function syncAllAccounts(): Promise<void>;
export declare function startSyncScheduler(): void;
export declare function stopSyncScheduler(): void;
/**
 * Manually trigger sync for all accounts
 */
export declare function triggerManualSync(): Promise<{
    success: number;
    failed: number;
}>;
//# sourceMappingURL=manager.d.ts.map