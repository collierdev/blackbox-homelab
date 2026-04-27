import { google } from 'googleapis';
import { getDecryptedAccessToken, getDecryptedRefreshToken, getSyncAccount, updateSyncAccount } from '../../models/syncAccount';
import { getProviderOAuthConfig } from '../../models/providerConfig';
import { createEvent, updateEvent, getEventBySyncDetails } from '../../models/event';

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
}

async function getGoogleConfig(): Promise<GoogleOAuthConfig> {
  const cfg = await getProviderOAuthConfig('google');
  if (!cfg) {
    throw new Error('Google OAuth is not configured. Configure client ID and secret in Settings > Calendar.');
  }
  return { clientId: cfg.clientId, clientSecret: cfg.clientSecret };
}

function buildOAuthClient(config: GoogleOAuthConfig, redirectUri: string): any {
  return new google.auth.OAuth2(config.clientId, config.clientSecret, redirectUri);
}

/**
 * Get authorization URL for Google OAuth
 */
export async function getAuthUrl(redirectUri: string): Promise<string> {
  const config = await getGoogleConfig();
  const oauth2Client = buildOAuthClient(config, redirectUri);
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string, redirectUri: string): Promise<any> {
  const config = await getGoogleConfig();
  const oauth2Client = buildOAuthClient(config, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Sync events from Google Calendar
 */
export async function syncGoogleCalendar(syncAccountId: string): Promise<void> {
  try {
    const config = await getGoogleConfig();
    const oauth2Client = buildOAuthClient(config, process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/sync/google/callback');
    const syncAccount = await getSyncAccount(syncAccountId);
    if (!syncAccount) {
      throw new Error('Sync account not found');
    }
    const accessToken = getDecryptedAccessToken(syncAccount);
    const refreshToken = getDecryptedRefreshToken(syncAccount);

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch events from the last 30 days and next 90 days
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 90);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Sync each event
    for (const googleEvent of events) {
      if (!googleEvent.id) continue;

      const eventData = {
        title: googleEvent.summary || 'Untitled Event',
        startDateTime: googleEvent.start?.dateTime || googleEvent.start?.date || new Date().toISOString(),
        endDateTime: googleEvent.end?.dateTime || googleEvent.end?.date || new Date().toISOString(),
        location: googleEvent.location || undefined,
        notes: googleEvent.description ? [googleEvent.description] : [],
        links: googleEvent.htmlLink ? [googleEvent.htmlLink] : [],
        origin: 'google' as const,
        priority: 'medium' as const,
        color: getColorFromGoogle(googleEvent.colorId),
        isCompleted: googleEvent.status === 'cancelled',
        isAllDay: !googleEvent.start?.dateTime,
        syncAccountId,
        remoteId: googleEvent.id,
      };

      // Check if event already exists
      const existingEvent = await getEventBySyncDetails(syncAccountId, googleEvent.id);

      if (existingEvent) {
        // Update existing event
        await updateEvent(existingEvent.id, eventData);
      } else {
        // Create new event
        await createEvent(eventData);
      }
    }

    // Update last sync time
    await updateSyncAccount(syncAccountId, {
      lastSyncAt: new Date().toISOString(),
      status: 'active',
      errorMessage: undefined,
    });

  } catch (error: any) {
    console.error('Google Calendar sync error:', error);

    // Update sync account with error
    await updateSyncAccount(syncAccountId, {
      status: 'error',
      errorMessage: error.message,
    });

    throw error;
  }
}

/**
 * Map Google color ID to hex color
 */
function getColorFromGoogle(colorId?: string | null): string {
  const colorMap: { [key: string]: string } = {
    '1': '#a4bdfc', // Lavender
    '2': '#7ae7bf', // Sage
    '3': '#dbadff', // Grape
    '4': '#ff887c', // Flamingo
    '5': '#fbd75b', // Banana
    '6': '#ffb878', // Tangerine
    '7': '#46d6db', // Peacock
    '8': '#e1e1e1', // Graphite
    '9': '#5484ed', // Blueberry
    '10': '#51b749', // Basil
    '11': '#dc2127', // Tomato
  };

  return colorMap[colorId || '9'] || '#3b82f6';
}

/**
 * Push local event to Google Calendar
 */
export async function pushEventToGoogle(
  syncAccountId: string,
  eventData: any
): Promise<string> {
  const config = await getGoogleConfig();
  const oauth2Client = buildOAuthClient(config, process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/sync/google/callback');
  const syncAccount = await getSyncAccount(syncAccountId);
  if (!syncAccount) {
    throw new Error('Sync account not found');
  }
  const accessToken = getDecryptedAccessToken(syncAccount);
  const refreshToken = getDecryptedRefreshToken(syncAccount);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const googleEvent = {
    summary: eventData.title,
    description: eventData.notes?.join('\n\n'),
    location: eventData.location,
    start: eventData.isAllDay
      ? { date: eventData.startDateTime.split('T')[0] }
      : { dateTime: eventData.startDateTime },
    end: eventData.isAllDay
      ? { date: eventData.endDateTime.split('T')[0] }
      : { dateTime: eventData.endDateTime },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: googleEvent,
  });

  return response.data.id || '';
}

/**
 * Delete event from Google Calendar
 */
export async function deleteEventFromGoogle(
  syncAccountId: string,
  remoteId: string
): Promise<void> {
  const config = await getGoogleConfig();
  const oauth2Client = buildOAuthClient(config, process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/sync/google/callback');
  const syncAccount = await getSyncAccount(syncAccountId);
  if (!syncAccount) {
    throw new Error('Sync account not found');
  }
  const accessToken = getDecryptedAccessToken(syncAccount);
  const refreshToken = getDecryptedRefreshToken(syncAccount);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: remoteId,
  });
}
