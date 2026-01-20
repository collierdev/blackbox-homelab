export interface Event {
    id: string;
    title: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    notes: string[];
    links: string[];
    origin: 'local' | 'google' | 'microsoft' | 'caldav';
    priority: 'low' | 'medium' | 'high';
    color?: string;
    isCompleted: boolean;
    isAllDay: boolean;
    projectId?: string;
    tagIds: string[];
    taskIds: string[];
    createdAt: string;
    updatedAt: string;
    syncAccountId?: string;
    remoteId?: string;
}
/**
 * Create a new event
 */
export declare function createEvent(data: Partial<Event>): Promise<Event>;
/**
 * Get event by ID
 */
export declare function getEventById(id: string): Promise<Event | null>;
/**
 * Get events by date range
 */
export declare function getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]>;
/**
 * Get all events
 */
export declare function getAllEvents(): Promise<Event[]>;
/**
 * Update event
 */
export declare function updateEvent(id: string, data: Partial<Event>): Promise<Event>;
/**
 * Delete event
 */
export declare function deleteEvent(id: string): Promise<boolean>;
/**
 * Link event to project
 */
export declare function linkEventToProject(eventId: string, projectId: string): Promise<void>;
/**
 * Mark event as completed
 */
export declare function completeEvent(id: string): Promise<Event>;
/**
 * Get events by project
 */
export declare function getEventsByProject(projectId: string): Promise<Event[]>;
/**
 * Get events by sync account (external calendar)
 */
export declare function getEventsBySyncAccount(syncAccountId: string): Promise<Event[]>;
/**
 * Convert Neo4j datetime objects to ISO strings
 */
/**
 * Get event by sync details (syncAccountId + remoteId)
 */
export declare function getEventBySyncDetails(syncAccountId: string, remoteId: string): Promise<Event | null>;
//# sourceMappingURL=event.d.ts.map