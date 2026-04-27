import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';
import crypto from 'crypto';

export interface SyncAccount {
  id: string;
  provider: 'google' | 'microsoft' | 'caldav';
  email: string;
  accountIdentifier: string; // For CalDAV username
  accessToken: string; // Encrypted
  refreshToken?: string; // Encrypted
  tokenExpiry?: string;
  expiresAt?: string; // Token expiration datetime
  lastSync?: string;
  lastSyncAt?: string; // Last sync datetime
  status: 'connected' | 'error' | 'syncing' | 'active';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'CHANGE_ME_IN_PRODUCTION';

/**
 * Encrypt token
 */
function encryptToken(token: string): string {
  // Create a key from the secret (32 bytes for AES-256)
  const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
  // Generate a random IV (16 bytes for AES)
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt token
 */
function decryptToken(encrypted: string): string {
  // Create a key from the secret (32 bytes for AES-256)
  const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
  // Extract IV from encrypted data
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Create a new sync account
 */
export async function createSyncAccount(data: {
  provider: 'google' | 'microsoft' | 'caldav';
  email: string;
  accountIdentifier?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: string;
  expiresAt?: string;
}): Promise<SyncAccount> {
  const session = getSession();
  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
      CREATE (sa:SyncAccount {
        id: $id,
        provider: $provider,
        email: $email,
        accountIdentifier: $accountIdentifier,
        accessToken: $accessToken,
        refreshToken: $refreshToken,
        tokenExpiry: $tokenExpiry,
        expiresAt: $expiresAt,
        lastSync: $lastSync,
        lastSyncAt: $lastSyncAt,
        status: $status,
        errorMessage: $errorMessage,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN sa
      `,
      {
        id,
        provider: data.provider,
        email: data.email,
        accountIdentifier: data.accountIdentifier || data.email,
        accessToken: encryptToken(data.accessToken),
        refreshToken: data.refreshToken ? encryptToken(data.refreshToken) : null,
        tokenExpiry: data.tokenExpiry || null,
        expiresAt: data.expiresAt || null,
        lastSync: null,
        lastSyncAt: null,
        status: 'active',
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
      }
    );

    const account = result.records[0].get('sa').properties;
    return convertNeo4jSyncAccount(account);
  } finally {
    await session.close();
  }
}

/**
 * Get sync account by ID
 */
export async function getSyncAccountById(id: string): Promise<SyncAccount | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (sa:SyncAccount {id: $id})
      RETURN sa
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    return convertNeo4jSyncAccount(result.records[0].get('sa').properties);
  } finally {
    await session.close();
  }
}

/**
 * Get all sync accounts
 */
export async function getAllSyncAccounts(): Promise<SyncAccount[]> {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (sa:SyncAccount)
      RETURN sa
      ORDER BY sa.createdAt DESC
    `);

    return result.records.map((record) =>
      convertNeo4jSyncAccount(record.get('sa').properties)
    );
  } finally {
    await session.close();
  }
}

/**
 * Update sync account tokens
 */
export async function updateSyncAccountTokens(
  id: string,
  accessToken: string,
  refreshToken?: string,
  tokenExpiry?: string
): Promise<void> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    await session.run(
      `
      MATCH (sa:SyncAccount {id: $id})
      SET sa.accessToken = $accessToken,
          sa.refreshToken = $refreshToken,
          sa.tokenExpiry = $tokenExpiry,
          sa.updatedAt = datetime($updatedAt)
      `,
      {
        id,
        accessToken: encryptToken(accessToken),
        refreshToken: refreshToken ? encryptToken(refreshToken) : null,
        tokenExpiry: tokenExpiry || null,
        updatedAt: now,
      }
    );
  } finally {
    await session.close();
  }
}

/**
 * Update last sync time
 */
export async function updateLastSyncTime(id: string): Promise<void> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    await session.run(
      `
      MATCH (sa:SyncAccount {id: $id})
      SET sa.lastSync = $lastSync,
          sa.updatedAt = datetime($updatedAt)
      `,
      { id, lastSync: now, updatedAt: now }
    );
  } finally {
    await session.close();
  }
}

/**
 * Update sync account status
 */
export async function updateSyncAccountStatus(
  id: string,
  status: 'connected' | 'error' | 'syncing',
  errorMessage?: string
): Promise<void> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    await session.run(
      `
      MATCH (sa:SyncAccount {id: $id})
      SET sa.status = $status,
          sa.errorMessage = $errorMessage,
          sa.updatedAt = datetime($updatedAt)
      `,
      {
        id,
        status,
        errorMessage: errorMessage || null,
        updatedAt: now,
      }
    );
  } finally {
    await session.close();
  }
}

/**
 * Delete sync account (and optionally its synced events)
 */
export async function deleteSyncAccount(
  id: string,
  deleteEvents: boolean = false
): Promise<boolean> {
  const session = getSession();

  try {
    if (deleteEvents) {
      // Delete account and all synced events
      await session.run(
        `
        MATCH (sa:SyncAccount {id: $id})
        OPTIONAL MATCH (sa)<-[:SYNCED_FROM]-(e:Event)
        DETACH DELETE sa, e
        `,
        { id }
      );
    } else {
      // Just delete the account, mark events as local
      await session.run(
        `
        MATCH (sa:SyncAccount {id: $id})<-[r:SYNCED_FROM]-(e:Event)
        SET e.origin = 'local'
        DELETE r
        `,
        { id }
      );

      await session.run(
        `
        MATCH (sa:SyncAccount {id: $id})
        DETACH DELETE sa
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
 * Get sync account by ID (alias for getSyncAccountById)
 */
export async function getSyncAccount(id: string): Promise<SyncAccount | null> {
  return getSyncAccountById(id);
}

/**
 * Update sync account (simplified wrapper)
 */
export async function updateSyncAccount(
  id: string,
  data: Partial<SyncAccount>
): Promise<SyncAccount> {
  const session = getSession();

  try {
    const updates: string[] = [];
    const params: any = { id };

    if (data.accessToken !== undefined) {
      updates.push('sa.accessToken = $accessToken');
      params.accessToken = encryptToken(data.accessToken);
    }

    if (data.refreshToken !== undefined) {
      updates.push('sa.refreshToken = $refreshToken');
      params.refreshToken = data.refreshToken ? encryptToken(data.refreshToken) : null;
    }

    if (data.expiresAt !== undefined) {
      updates.push('sa.expiresAt = datetime($expiresAt)');
      params.expiresAt = data.expiresAt;
    }

    if (data.lastSyncAt !== undefined) {
      updates.push('sa.lastSyncAt = datetime($lastSyncAt)');
      params.lastSyncAt = data.lastSyncAt;
    }

    if (data.status !== undefined) {
      updates.push('sa.status = $status');
      params.status = data.status;
    }

    if (data.errorMessage !== undefined) {
      updates.push('sa.errorMessage = $errorMessage');
      params.errorMessage = data.errorMessage;
    }

    updates.push('sa.updatedAt = datetime($updatedAt)');
    params.updatedAt = new Date().toISOString();

    const result = await session.run(
      `
      MATCH (sa:SyncAccount {id: $id})
      SET ${updates.join(', ')}
      RETURN sa
      `,
      params
    );

    if (result.records.length === 0) {
      throw new Error('Sync account not found');
    }

    const account = result.records[0].get('sa').properties;
    return convertNeo4jSyncAccount(account);
  } finally {
    await session.close();
  }
}

/**
 * Get decrypted access token
 */
export function getDecryptedAccessToken(account: SyncAccount): string {
  return decryptToken(account.accessToken);
}

/**
 * Get decrypted refresh token
 */
export function getDecryptedRefreshToken(account: SyncAccount): string | undefined {
  return account.refreshToken ? decryptToken(account.refreshToken) : undefined;
}

/**
 * Convert Neo4j datetime to ISO string
 */
function convertNeo4jSyncAccount(account: any): SyncAccount {
  return {
    ...account,
    createdAt: account.createdAt?.toString() || account.createdAt,
    updatedAt: account.updatedAt?.toString() || account.updatedAt,
  };
}
