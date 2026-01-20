/**
 * Get authorization URL for Microsoft OAuth
 */
export declare function getAuthUrl(): string;
/**
 * Exchange authorization code for tokens
 */
export declare function getTokensFromCode(code: string): Promise<any>;
/**
 * Sync events from Microsoft Calendar
 */
export declare function syncMicrosoftCalendar(syncAccountId: string): Promise<void>;
/**
 * Push local event to Microsoft Calendar
 */
export declare function pushEventToMicrosoft(syncAccountId: string, eventData: any): Promise<string>;
/**
 * Delete event from Microsoft Calendar
 */
export declare function deleteEventFromMicrosoft(syncAccountId: string, remoteId: string): Promise<void>;
//# sourceMappingURL=microsoft.d.ts.map