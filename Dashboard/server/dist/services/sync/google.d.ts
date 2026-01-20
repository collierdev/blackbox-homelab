/**
 * Get authorization URL for Google OAuth
 */
export declare function getAuthUrl(): string;
/**
 * Exchange authorization code for tokens
 */
export declare function getTokensFromCode(code: string): Promise<any>;
/**
 * Sync events from Google Calendar
 */
export declare function syncGoogleCalendar(syncAccountId: string): Promise<void>;
/**
 * Push local event to Google Calendar
 */
export declare function pushEventToGoogle(syncAccountId: string, eventData: any): Promise<string>;
/**
 * Delete event from Google Calendar
 */
export declare function deleteEventFromGoogle(syncAccountId: string, remoteId: string): Promise<void>;
//# sourceMappingURL=google.d.ts.map