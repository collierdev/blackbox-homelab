"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthUrl = getAuthUrl;
exports.getTokensFromCode = getTokensFromCode;
exports.syncMicrosoftCalendar = syncMicrosoftCalendar;
exports.pushEventToMicrosoft = pushEventToMicrosoft;
exports.deleteEventFromMicrosoft = deleteEventFromMicrosoft;
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const syncAccount_1 = require("../../models/syncAccount");
const event_1 = require("../../models/event");
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/sync/microsoft/callback';
/**
 * Get authorization URL for Microsoft OAuth
 */
function getAuthUrl() {
    const scopes = ['Calendars.ReadWrite', 'offline_access'];
    const scopeString = scopes.join(' ');
    return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?` +
        `client_id=${MICROSOFT_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(scopeString)}` +
        `&response_mode=query`;
}
/**
 * Exchange authorization code for tokens
 */
async function getTokensFromCode(code) {
    const tokenEndpoint = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', MICROSOFT_CLIENT_ID);
    params.append('client_secret', MICROSOFT_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', MICROSOFT_REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });
    if (!response.ok) {
        throw new Error(`Failed to exchange code: ${response.statusText}`);
    }
    return await response.json();
}
/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
    const tokenEndpoint = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', MICROSOFT_CLIENT_ID);
    params.append('client_secret', MICROSOFT_CLIENT_SECRET);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });
    if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
    }
    return await response.json();
}
/**
 * Create Microsoft Graph client
 */
function createGraphClient(accessToken) {
    return microsoft_graph_client_1.Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });
}
/**
 * Sync events from Microsoft Calendar
 */
async function syncMicrosoftCalendar(syncAccountId) {
    try {
        let syncAccount = await (0, syncAccount_1.getSyncAccount)(syncAccountId);
        if (!syncAccount) {
            throw new Error('Sync account not found');
        }
        // Refresh token if needed
        if (syncAccount.expiresAt && new Date(syncAccount.expiresAt) < new Date()) {
            if (!syncAccount.refreshToken) {
                throw new Error('No refresh token available');
            }
            const tokens = await refreshAccessToken(syncAccount.refreshToken);
            await (0, syncAccount_1.updateSyncAccount)(syncAccountId, {
                accessToken: tokens.access_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            });
            syncAccount = await (0, syncAccount_1.getSyncAccount)(syncAccountId);
        }
        const client = createGraphClient(syncAccount.accessToken);
        // Fetch events from the last 30 days and next 90 days
        const startDateTime = new Date();
        startDateTime.setDate(startDateTime.getDate() - 30);
        const endDateTime = new Date();
        endDateTime.setDate(endDateTime.getDate() + 90);
        const events = await client
            .api('/me/calendar/events')
            .query({
            $filter: `start/dateTime ge '${startDateTime.toISOString()}' and start/dateTime le '${endDateTime.toISOString()}'`,
            $orderby: 'start/dateTime',
            $top: 100,
        })
            .get();
        // Sync each event
        for (const msEvent of events.value) {
            const eventData = {
                title: msEvent.subject || 'Untitled Event',
                startDateTime: msEvent.start.dateTime,
                endDateTime: msEvent.end.dateTime,
                location: msEvent.location?.displayName,
                notes: msEvent.body?.content ? [msEvent.body.content] : [],
                links: msEvent.webLink ? [msEvent.webLink] : [],
                origin: 'microsoft',
                priority: msEvent.importance === 'high' ? 'high' : 'medium',
                color: getColorFromMicrosoft(msEvent.categories),
                isCompleted: msEvent.isCancelled || false,
                isAllDay: msEvent.isAllDay || false,
                syncAccountId,
                remoteId: msEvent.id,
            };
            // Check if event already exists
            const existingEvent = await (0, event_1.getEventBySyncDetails)(syncAccountId, msEvent.id);
            if (existingEvent) {
                // Update existing event
                await (0, event_1.updateEvent)(existingEvent.id, eventData);
            }
            else {
                // Create new event
                await (0, event_1.createEvent)(eventData);
            }
        }
        // Update last sync time
        await (0, syncAccount_1.updateSyncAccount)(syncAccountId, {
            lastSyncAt: new Date().toISOString(),
            status: 'active',
            errorMessage: undefined,
        });
    }
    catch (error) {
        console.error('Microsoft Calendar sync error:', error);
        // Update sync account with error
        await (0, syncAccount_1.updateSyncAccount)(syncAccountId, {
            status: 'error',
            errorMessage: error.message,
        });
        throw error;
    }
}
/**
 * Map Microsoft categories to hex color
 */
function getColorFromMicrosoft(categories) {
    if (!categories || categories.length === 0)
        return '#3b82f6';
    const colorMap = {
        'Red category': '#dc2127',
        'Orange category': '#ff887c',
        'Yellow category': '#fbd75b',
        'Green category': '#51b749',
        'Blue category': '#5484ed',
        'Purple category': '#dbadff',
    };
    return colorMap[categories[0]] || '#3b82f6';
}
/**
 * Push local event to Microsoft Calendar
 */
async function pushEventToMicrosoft(syncAccountId, eventData) {
    const syncAccount = await (0, syncAccount_1.getSyncAccount)(syncAccountId);
    if (!syncAccount) {
        throw new Error('Sync account not found');
    }
    const client = createGraphClient(syncAccount.accessToken);
    const msEvent = {
        subject: eventData.title,
        body: {
            contentType: 'text',
            content: eventData.notes?.join('\n\n'),
        },
        start: {
            dateTime: eventData.startDateTime,
            timeZone: 'UTC',
        },
        end: {
            dateTime: eventData.endDateTime,
            timeZone: 'UTC',
        },
        location: eventData.location ? {
            displayName: eventData.location,
        } : undefined,
        isAllDay: eventData.isAllDay,
    };
    const response = await client
        .api('/me/calendar/events')
        .post(msEvent);
    return response.id;
}
/**
 * Delete event from Microsoft Calendar
 */
async function deleteEventFromMicrosoft(syncAccountId, remoteId) {
    const syncAccount = await (0, syncAccount_1.getSyncAccount)(syncAccountId);
    if (!syncAccount) {
        throw new Error('Sync account not found');
    }
    const client = createGraphClient(syncAccount.accessToken);
    await client
        .api(`/me/calendar/events/${remoteId}`)
        .delete();
}
//# sourceMappingURL=microsoft.js.map