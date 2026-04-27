"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSyncAccount = createSyncAccount;
exports.getSyncAccountById = getSyncAccountById;
exports.getAllSyncAccounts = getAllSyncAccounts;
exports.updateSyncAccountTokens = updateSyncAccountTokens;
exports.updateLastSyncTime = updateLastSyncTime;
exports.updateSyncAccountStatus = updateSyncAccountStatus;
exports.deleteSyncAccount = deleteSyncAccount;
exports.getSyncAccount = getSyncAccount;
exports.updateSyncAccount = updateSyncAccount;
exports.getDecryptedAccessToken = getDecryptedAccessToken;
exports.getDecryptedRefreshToken = getDecryptedRefreshToken;
const uuid_1 = require("uuid");
const neo4j_1 = require("../config/neo4j");
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'CHANGE_ME_IN_PRODUCTION';
/**
 * Encrypt token
 */
function encryptToken(token) {
    // Create a key from the secret (32 bytes for AES-256)
    const key = crypto_1.default.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
    // Generate a random IV (16 bytes for AES)
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
}
/**
 * Decrypt token
 */
function decryptToken(encrypted) {
    // Create a key from the secret (32 bytes for AES-256)
    const key = crypto_1.default.scryptSync(ENCRYPTION_SECRET, 'salt', 32);
    // Extract IV from encrypted data
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Create a new sync account
 */
async function createSyncAccount(data) {
    const session = (0, neo4j_1.getSession)();
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    try {
        const result = await session.run(`
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
      `, {
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
        });
        const account = result.records[0].get('sa').properties;
        return convertNeo4jSyncAccount(account);
    }
    finally {
        await session.close();
    }
}
/**
 * Get sync account by ID
 */
async function getSyncAccountById(id) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (sa:SyncAccount {id: $id})
      RETURN sa
      `, { id });
        if (result.records.length === 0) {
            return null;
        }
        return convertNeo4jSyncAccount(result.records[0].get('sa').properties);
    }
    finally {
        await session.close();
    }
}
/**
 * Get all sync accounts
 */
async function getAllSyncAccounts() {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (sa:SyncAccount)
      RETURN sa
      ORDER BY sa.createdAt DESC
    `);
        return result.records.map((record) => convertNeo4jSyncAccount(record.get('sa').properties));
    }
    finally {
        await session.close();
    }
}
/**
 * Update sync account tokens
 */
async function updateSyncAccountTokens(id, accessToken, refreshToken, tokenExpiry) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        await session.run(`
      MATCH (sa:SyncAccount {id: $id})
      SET sa.accessToken = $accessToken,
          sa.refreshToken = $refreshToken,
          sa.tokenExpiry = $tokenExpiry,
          sa.updatedAt = datetime($updatedAt)
      `, {
            id,
            accessToken: encryptToken(accessToken),
            refreshToken: refreshToken ? encryptToken(refreshToken) : null,
            tokenExpiry: tokenExpiry || null,
            updatedAt: now,
        });
    }
    finally {
        await session.close();
    }
}
/**
 * Update last sync time
 */
async function updateLastSyncTime(id) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        await session.run(`
      MATCH (sa:SyncAccount {id: $id})
      SET sa.lastSync = $lastSync,
          sa.updatedAt = datetime($updatedAt)
      `, { id, lastSync: now, updatedAt: now });
    }
    finally {
        await session.close();
    }
}
/**
 * Update sync account status
 */
async function updateSyncAccountStatus(id, status, errorMessage) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        await session.run(`
      MATCH (sa:SyncAccount {id: $id})
      SET sa.status = $status,
          sa.errorMessage = $errorMessage,
          sa.updatedAt = datetime($updatedAt)
      `, {
            id,
            status,
            errorMessage: errorMessage || null,
            updatedAt: now,
        });
    }
    finally {
        await session.close();
    }
}
/**
 * Delete sync account (and optionally its synced events)
 */
async function deleteSyncAccount(id, deleteEvents = false) {
    const session = (0, neo4j_1.getSession)();
    try {
        if (deleteEvents) {
            // Delete account and all synced events
            await session.run(`
        MATCH (sa:SyncAccount {id: $id})
        OPTIONAL MATCH (sa)<-[:SYNCED_FROM]-(e:Event)
        DETACH DELETE sa, e
        `, { id });
        }
        else {
            // Just delete the account, mark events as local
            await session.run(`
        MATCH (sa:SyncAccount {id: $id})<-[r:SYNCED_FROM]-(e:Event)
        SET e.origin = 'local'
        DELETE r
        `, { id });
            await session.run(`
        MATCH (sa:SyncAccount {id: $id})
        DETACH DELETE sa
        `, { id });
        }
        return true;
    }
    finally {
        await session.close();
    }
}
/**
 * Get sync account by ID (alias for getSyncAccountById)
 */
async function getSyncAccount(id) {
    return getSyncAccountById(id);
}
/**
 * Update sync account (simplified wrapper)
 */
async function updateSyncAccount(id, data) {
    const session = (0, neo4j_1.getSession)();
    try {
        const updates = [];
        const params = { id };
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
        const result = await session.run(`
      MATCH (sa:SyncAccount {id: $id})
      SET ${updates.join(', ')}
      RETURN sa
      `, params);
        if (result.records.length === 0) {
            throw new Error('Sync account not found');
        }
        const account = result.records[0].get('sa').properties;
        return convertNeo4jSyncAccount(account);
    }
    finally {
        await session.close();
    }
}
/**
 * Get decrypted access token
 */
function getDecryptedAccessToken(account) {
    return decryptToken(account.accessToken);
}
/**
 * Get decrypted refresh token
 */
function getDecryptedRefreshToken(account) {
    return account.refreshToken ? decryptToken(account.refreshToken) : undefined;
}
/**
 * Convert Neo4j datetime to ISO string
 */
function convertNeo4jSyncAccount(account) {
    return {
        ...account,
        createdAt: account.createdAt?.toString() || account.createdAt,
        updatedAt: account.updatedAt?.toString() || account.updatedAt,
    };
}
//# sourceMappingURL=syncAccount.js.map