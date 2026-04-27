export interface SyncAccount {
    id: string;
    provider: 'google' | 'microsoft' | 'caldav';
    email: string;
    accountIdentifier: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: string;
    expiresAt?: string;
    lastSync?: string;
    lastSyncAt?: string;
    status: 'connected' | 'error' | 'syncing' | 'active';
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Create a new sync account
 */
export declare function createSyncAccount(data: {
    provider: 'google' | 'microsoft' | 'caldav';
    email: string;
    accountIdentifier?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: string;
    expiresAt?: string;
}): Promise<SyncAccount>;
/**
 * Get sync account by ID
 */
export declare function getSyncAccountById(id: string): Promise<SyncAccount | null>;
/**
 * Get all sync accounts
 */
export declare function getAllSyncAccounts(): Promise<SyncAccount[]>;
/**
 * Update sync account tokens
 */
export declare function updateSyncAccountTokens(id: string, accessToken: string, refreshToken?: string, tokenExpiry?: string): Promise<void>;
/**
 * Update last sync time
 */
export declare function updateLastSyncTime(id: string): Promise<void>;
/**
 * Update sync account status
 */
export declare function updateSyncAccountStatus(id: string, status: 'connected' | 'error' | 'syncing', errorMessage?: string): Promise<void>;
/**
 * Delete sync account (and optionally its synced events)
 */
export declare function deleteSyncAccount(id: string, deleteEvents?: boolean): Promise<boolean>;
/**
 * Get sync account by ID (alias for getSyncAccountById)
 */
export declare function getSyncAccount(id: string): Promise<SyncAccount | null>;
/**
 * Update sync account (simplified wrapper)
 */
export declare function updateSyncAccount(id: string, data: Partial<SyncAccount>): Promise<SyncAccount>;
/**
 * Get decrypted access token
 */
export declare function getDecryptedAccessToken(account: SyncAccount): string;
/**
 * Get decrypted refresh token
 */
export declare function getDecryptedRefreshToken(account: SyncAccount): string | undefined;
//# sourceMappingURL=syncAccount.d.ts.map