"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertProviderConfig = upsertProviderConfig;
exports.getProviderConfigPublic = getProviderConfigPublic;
exports.getProviderOAuthConfig = getProviderOAuthConfig;
const crypto_1 = __importDefault(require("crypto"));
const neo4j_1 = require("../config/neo4j");
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'CHANGE_ME_IN_PRODUCTION';
function encryptSecret(value) {
    const key = crypto_1.default.scryptSync(ENCRYPTION_SECRET, 'provider-config-salt', 32);
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}
function decryptSecret(value) {
    const [ivHex, encrypted] = value.split(':');
    const key = crypto_1.default.scryptSync(ENCRYPTION_SECRET, 'provider-config-salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
async function upsertProviderConfig(provider, data) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        await session.run(`
      MERGE (pc:ProviderConfig {provider: $provider})
      SET pc.clientId = $clientId,
          pc.clientSecret = $clientSecret,
          pc.tenantId = $tenantId,
          pc.updatedAt = datetime($updatedAt)
      `, {
            provider,
            clientId: data.clientId,
            clientSecret: encryptSecret(data.clientSecret),
            tenantId: data.tenantId || null,
            updatedAt: now,
        });
    }
    finally {
        await session.close();
    }
}
async function getProviderConfigPublic(provider) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (pc:ProviderConfig {provider: $provider})
      RETURN pc
      LIMIT 1
      `, { provider });
        if (result.records.length === 0) {
            return { provider, configured: false };
        }
        const pc = result.records[0].get('pc').properties;
        return {
            provider,
            configured: Boolean(pc.clientId && pc.clientSecret),
            clientId: pc.clientId,
            tenantId: pc.tenantId || undefined,
            updatedAt: pc.updatedAt?.toString?.() || pc.updatedAt,
        };
    }
    finally {
        await session.close();
    }
}
async function getProviderOAuthConfig(provider) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (pc:ProviderConfig {provider: $provider})
      RETURN pc
      LIMIT 1
      `, { provider });
        if (result.records.length > 0) {
            const pc = result.records[0].get('pc').properties;
            if (pc.clientId && pc.clientSecret) {
                return {
                    provider,
                    clientId: pc.clientId,
                    clientSecret: decryptSecret(pc.clientSecret),
                    tenantId: pc.tenantId || undefined,
                };
            }
        }
    }
    finally {
        await session.close();
    }
    // Fallback to env vars for backwards compatibility
    if (provider === 'google' && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        return {
            provider,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        };
    }
    if (provider === 'microsoft' && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
        return {
            provider,
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
        };
    }
    return null;
}
//# sourceMappingURL=providerConfig.js.map