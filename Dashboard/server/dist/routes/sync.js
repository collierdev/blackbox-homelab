"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const syncAccount_1 = require("../models/syncAccount");
const google_1 = require("../services/sync/google");
const microsoft_1 = require("../services/sync/microsoft");
const caldav_1 = require("../services/sync/caldav");
const icalImport_1 = require("../services/sync/icalImport");
const manager_1 = require("../services/sync/manager");
const providerConfig_1 = require("../models/providerConfig");
const router = (0, express_1.Router)();
function getBaseUrl(req) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const forwardedHost = req.headers['x-forwarded-host'];
    const proto = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0] : req.protocol;
    const host = typeof forwardedHost === 'string' ? forwardedHost.split(',')[0] : req.get('host');
    return `${proto}://${host}`;
}
function getProviderRedirectUri(req, provider) {
    return `${getBaseUrl(req)}/api/sync/${provider}/callback`;
}
function isOAuthProvider(provider) {
    return provider === 'google' || provider === 'microsoft';
}
// Get all sync accounts
router.get('/accounts', async (_req, res) => {
    try {
        const accounts = await (0, syncAccount_1.getAllSyncAccounts)();
        // Don't send encrypted tokens to frontend
        const sanitized = accounts.map((account) => ({
            id: account.id,
            provider: account.provider,
            email: account.email,
            lastSync: account.lastSync,
            status: account.status,
            errorMessage: account.errorMessage,
            createdAt: account.createdAt,
        }));
        res.json(sanitized);
    }
    catch (error) {
        console.error('Error getting sync accounts:', error);
        res.status(500).json({ error: 'Failed to get sync accounts' });
    }
});
// Get single sync account
router.get('/accounts/:id', async (req, res) => {
    try {
        const account = await (0, syncAccount_1.getSyncAccountById)(req.params.id);
        if (!account) {
            res.status(404).json({ error: 'Sync account not found' });
            return;
        }
        // Don't send encrypted tokens
        const sanitized = {
            id: account.id,
            provider: account.provider,
            email: account.email,
            lastSync: account.lastSync,
            status: account.status,
            errorMessage: account.errorMessage,
            createdAt: account.createdAt,
        };
        res.json(sanitized);
    }
    catch (error) {
        console.error('Error getting sync account:', error);
        res.status(500).json({ error: 'Failed to get sync account' });
    }
});
// Delete/disconnect sync account
router.delete('/accounts/:id', async (req, res) => {
    try {
        const { deleteEvents } = req.query;
        const deleted = await (0, syncAccount_1.deleteSyncAccount)(req.params.id, deleteEvents === 'true');
        if (!deleted) {
            res.status(404).json({ error: 'Sync account not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting sync account:', error);
        res.status(500).json({ error: 'Failed to delete sync account' });
    }
});
router.get('/providers/status', async (_req, res) => {
    try {
        const [google, microsoft] = await Promise.all([
            (0, providerConfig_1.getProviderConfigPublic)('google'),
            (0, providerConfig_1.getProviderConfigPublic)('microsoft'),
        ]);
        res.json({ google, microsoft });
    }
    catch (error) {
        console.error('Error getting provider status:', error);
        res.status(500).json({ error: 'Failed to get provider status' });
    }
});
router.get('/providers/:provider/config', async (req, res) => {
    const provider = req.params.provider;
    if (!isOAuthProvider(provider)) {
        res.status(400).json({ error: `Unsupported provider: ${provider}` });
        return;
    }
    try {
        const config = await (0, providerConfig_1.getProviderConfigPublic)(provider);
        res.json(config);
    }
    catch (error) {
        console.error(`Error getting ${provider} config:`, error);
        res.status(500).json({ error: `Failed to get ${provider} config` });
    }
});
router.put('/providers/:provider/config', async (req, res) => {
    const provider = req.params.provider;
    if (!isOAuthProvider(provider)) {
        res.status(400).json({ error: `Unsupported provider: ${provider}` });
        return;
    }
    const { clientId, clientSecret, tenantId } = req.body || {};
    if (!clientId || !clientSecret) {
        res.status(400).json({ error: 'clientId and clientSecret are required' });
        return;
    }
    try {
        await (0, providerConfig_1.upsertProviderConfig)(provider, { clientId, clientSecret, tenantId });
        const config = await (0, providerConfig_1.getProviderConfigPublic)(provider);
        res.json(config);
    }
    catch (error) {
        console.error(`Error saving ${provider} config:`, error);
        res.status(500).json({ error: `Failed to save ${provider} config` });
    }
});
router.get('/:provider/auth', async (req, res) => {
    try {
        const provider = req.params.provider;
        let authUrl;
        const redirectUri = getProviderRedirectUri(req, provider);
        switch (provider) {
            case 'google':
                authUrl = await (0, google_1.getAuthUrl)(redirectUri);
                break;
            case 'microsoft':
                authUrl = await (0, microsoft_1.getAuthUrl)(redirectUri);
                break;
            default:
                res.status(400).json({ error: `Unsupported provider: ${provider}` });
                return;
        }
        if (req.query.redirect === 'false') {
            res.json({ authUrl });
            return;
        }
        res.redirect(authUrl);
    }
    catch (error) {
        console.error('Error creating auth URL:', error);
        res.status(500).json({ error: 'Failed to create auth URL', message: error.message });
    }
});
router.get('/:provider/callback', async (req, res) => {
    const provider = req.params.provider;
    const code = req.query.code;
    const oauthError = req.query.error;
    const redirectUri = getProviderRedirectUri(req, provider);
    if (oauthError) {
        res.status(400).send(renderCallbackHtml(false, `OAuth error: ${oauthError}`));
        return;
    }
    if (!code) {
        res.status(400).send(renderCallbackHtml(false, 'Missing OAuth authorization code.'));
        return;
    }
    try {
        if (provider === 'google') {
            const tokens = await (0, google_1.getTokensFromCode)(code, redirectUri);
            const accessToken = tokens.access_token;
            if (!accessToken)
                throw new Error('Google did not return an access token');
            const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${encodeURIComponent(accessToken)}`);
            const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};
            const email = userInfo.email || 'google-account';
            const syncAcc = await (0, syncAccount_1.createSyncAccount)({
                provider: 'google',
                email,
                accountIdentifier: email,
                accessToken,
                refreshToken: tokens.refresh_token,
                tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
            });
            await (0, google_1.syncGoogleCalendar)(syncAcc.id);
            res.send(renderCallbackHtml(true, 'Google Calendar connected and initial sync completed.'));
            return;
        }
        if (provider === 'microsoft') {
            const tokens = await (0, microsoft_1.getTokensFromCode)(code, redirectUri);
            const accessToken = tokens.access_token;
            if (!accessToken)
                throw new Error('Microsoft did not return an access token');
            const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const me = meRes.ok ? await meRes.json() : {};
            const email = me.mail || me.userPrincipalName || 'microsoft-account';
            const syncAcc = await (0, syncAccount_1.createSyncAccount)({
                provider: 'microsoft',
                email,
                accountIdentifier: email,
                accessToken,
                refreshToken: tokens.refresh_token,
                tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
                expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
            });
            await (0, microsoft_1.syncMicrosoftCalendar)(syncAcc.id);
            res.send(renderCallbackHtml(true, 'Outlook Calendar connected and initial sync completed.'));
            return;
        }
        res.status(400).send(renderCallbackHtml(false, `Unsupported provider: ${provider}`));
    }
    catch (error) {
        console.error(`Error handling ${provider} callback:`, error);
        res.status(500).send(renderCallbackHtml(false, error.message || 'Calendar connection failed.'));
    }
});
router.post('/:provider/trigger', async (req, res) => {
    const provider = req.params.provider;
    try {
        const { accountId } = req.body || {};
        if (accountId) {
            await (0, manager_1.syncAccount)(accountId, provider);
            res.json({ success: true, accountId });
            return;
        }
        const accounts = await (0, syncAccount_1.getAllSyncAccounts)();
        const providerAccounts = accounts.filter((a) => a.provider === provider);
        for (const account of providerAccounts) {
            await (0, manager_1.syncAccount)(account.id, account.provider);
        }
        res.json({ success: true, synced: providerAccounts.length });
    }
    catch (error) {
        console.error(`Error triggering ${provider} sync:`, error);
        res.status(500).json({ error: `Failed to sync ${provider}`, message: error.message });
    }
});
router.post('/caldav/connect', async (req, res) => {
    try {
        const { serverUrl, username, password, email } = req.body || {};
        if (!username || !password) {
            res.status(400).json({ error: 'username and password are required' });
            return;
        }
        if (serverUrl) {
            process.env.CALDAV_URL = serverUrl;
        }
        const syncAcc = await (0, syncAccount_1.createSyncAccount)({
            provider: 'caldav',
            email: email || username,
            accountIdentifier: username,
            accessToken: password,
        });
        await (0, caldav_1.syncCalDAVCalendar)(syncAcc.id);
        res.status(201).json({
            id: syncAcc.id,
            provider: syncAcc.provider,
            email: syncAcc.email,
            status: syncAcc.status,
        });
    }
    catch (error) {
        console.error('Error connecting CalDAV account:', error);
        res.status(500).json({ error: 'Failed to connect CalDAV account', message: error.message });
    }
});
router.post('/import/google-export', async (req, res) => {
    try {
        const { filename, fileDataBase64, projectId } = req.body || {};
        if (!filename || !fileDataBase64) {
            res.status(400).json({ error: 'filename and fileDataBase64 are required' });
            return;
        }
        const result = await (0, icalImport_1.importGoogleIcalFile)({ filename, fileDataBase64, projectId });
        res.json(result);
    }
    catch (error) {
        console.error('Error importing Google export:', error);
        res.status(500).json({ error: 'Failed to import Google export', message: error.message });
    }
});
function renderCallbackHtml(success, message) {
    const statusText = success ? 'Connected' : 'Connection Failed';
    const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${statusText}</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; background: #0b1326; color: #e2e8f0; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
      .card { max-width: 520px; padding: 24px; border-radius: 12px; border: 1px solid #243356; background: #121f38; }
      .status { font-weight: 700; margin-bottom: 8px; color: ${success ? '#22c55e' : '#ffb4ab'}; }
      .message { color: #c2c6d6; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="status">${statusText}</div>
      <div class="message">${safeMessage}</div>
    </div>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({ source: 'pi-dashboard-sync', success: ${success}, message: ${JSON.stringify(message)} }, '*');
        }
      } catch (e) {}
      setTimeout(() => window.close(), 1200);
    </script>
  </body>
</html>`;
}
exports.default = router;
//# sourceMappingURL=sync.js.map