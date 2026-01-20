/**
 * Sync events from CalDAV calendar
 */
export declare function syncCalDAVCalendar(syncAccountId: string): Promise<void>;
/**
 * Push local event to CalDAV calendar
 */
export declare function pushEventToCalDAV(syncAccountId: string, eventData: any): Promise<string>;
/**
 * Delete event from CalDAV calendar
 */
export declare function deleteEventFromCalDAV(syncAccountId: string, remoteId: string): Promise<void>;
//# sourceMappingURL=caldav.d.ts.map