"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCalDAVCalendar = syncCalDAVCalendar;
exports.pushEventToCalDAV = pushEventToCalDAV;
exports.deleteEventFromCalDAV = deleteEventFromCalDAV;
const tsdav_1 = require("tsdav");
const syncAccount_1 = require("../../models/syncAccount");
const event_1 = require("../../models/event");
const CALDAV_URL = process.env.CALDAV_URL || 'https://caldav.icloud.com';
/**
 * Create CalDAV client
 */
async function createClient(username, password) {
    return await (0, tsdav_1.createDAVClient)({
        serverUrl: CALDAV_URL,
        credentials: {
            username,
            password,
        },
        authMethod: 'Basic',
        defaultAccountType: 'caldav',
    });
}
/**
 * Parse iCalendar data to event object
 */
function parseICalendarEvent(icalData, remoteId) {
    const lines = icalData.split('\n');
    const event = {
        title: 'Untitled Event',
        startDateTime: new Date().toISOString(),
        endDateTime: new Date().toISOString(),
        notes: [],
        links: [],
        isAllDay: false,
    };
    for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (key.startsWith('SUMMARY')) {
            event.title = value;
        }
        else if (key.startsWith('DTSTART')) {
            event.startDateTime = parseICalDateTime(value, key);
            event.isAllDay = key.includes('VALUE=DATE');
        }
        else if (key.startsWith('DTEND')) {
            event.endDateTime = parseICalDateTime(value, key);
        }
        else if (key.startsWith('LOCATION')) {
            event.location = value;
        }
        else if (key.startsWith('DESCRIPTION')) {
            event.notes.push(value.replace(/\\n/g, '\n'));
        }
        else if (key.startsWith('URL')) {
            event.links.push(value);
        }
        else if (key.startsWith('STATUS')) {
            event.isCompleted = value === 'CANCELLED';
        }
        else if (key.startsWith('PRIORITY')) {
            const priority = parseInt(value);
            event.priority = priority <= 4 ? 'high' : priority <= 6 ? 'medium' : 'low';
        }
    }
    return event;
}
/**
 * Parse iCalendar date/time format
 */
function parseICalDateTime(value, key) {
    // Remove any trailing characters
    value = value.replace(/[^0-9TZ]/g, '');
    if (key.includes('VALUE=DATE')) {
        // Date only (all-day event)
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        return `${year}-${month}-${day}`;
    }
    else {
        // Date-time
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        const hour = value.substring(9, 11);
        const minute = value.substring(11, 13);
        const second = value.substring(13, 15);
        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }
}
/**
 * Sync events from CalDAV calendar
 */
async function syncCalDAVCalendar(syncAccountId) {
    try {
        const syncAccount = await (0, syncAccount_1.getSyncAccount)(syncAccountId);
        if (!syncAccount) {
            throw new Error('Sync account not found');
        }
        // For CalDAV, we store username in accountIdentifier and password in accessToken
        const client = await createClient(syncAccount.accountIdentifier, syncAccount.accessToken);
        // Fetch calendars
        const calendars = await client.fetchCalendars();
        if (calendars.length === 0) {
            throw new Error('No calendars found');
        }
        // Use the first calendar (typically the default one)
        const calendar = calendars[0];
        // Fetch calendar objects (events)
        const timeRange = {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ahead
        };
        const calendarObjects = await client.fetchCalendarObjects({
            calendar,
            timeRange,
        });
        // Sync each event
        for (const calObj of calendarObjects) {
            if (!calObj.data || !calObj.url)
                continue;
            const remoteId = calObj.url.split('/').pop() || calObj.url;
            const parsedEvent = parseICalendarEvent(calObj.data, remoteId);
            const eventData = {
                ...parsedEvent,
                origin: 'caldav',
                syncAccountId,
                remoteId,
                priority: parsedEvent.priority || 'medium',
            };
            // Check if event already exists
            const existingEvent = await (0, event_1.getEventBySyncDetails)(syncAccountId, remoteId);
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
        console.error('CalDAV sync error:', error);
        // Update sync account with error
        await (0, syncAccount_1.updateSyncAccount)(syncAccountId, {
            status: 'error',
            errorMessage: error.message,
        });
        throw error;
    }
}
/**
 * Convert event data to iCalendar format
 */
function formatICalendarEvent(eventData) {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//Pi Dashboard//Calendar//EN\n';
    ical += 'BEGIN:VEVENT\n';
    ical += `UID:${eventData.remoteId || `event-${Date.now()}`}\n`;
    ical += `DTSTAMP:${now}\n`;
    if (eventData.isAllDay) {
        ical += `DTSTART;VALUE=DATE:${eventData.startDateTime.replace(/[-:]/g, '').substring(0, 8)}\n`;
        ical += `DTEND;VALUE=DATE:${eventData.endDateTime.replace(/[-:]/g, '').substring(0, 8)}\n`;
    }
    else {
        ical += `DTSTART:${eventData.startDateTime.replace(/[-:]/g, '').split('.')[0]}Z\n`;
        ical += `DTEND:${eventData.endDateTime.replace(/[-:]/g, '').split('.')[0]}Z\n`;
    }
    ical += `SUMMARY:${eventData.title}\n`;
    if (eventData.location) {
        ical += `LOCATION:${eventData.location}\n`;
    }
    if (eventData.notes && eventData.notes.length > 0) {
        ical += `DESCRIPTION:${eventData.notes.join('\\n\\n').replace(/\n/g, '\\n')}\n`;
    }
    if (eventData.links && eventData.links.length > 0) {
        ical += `URL:${eventData.links[0]}\n`;
    }
    const priorityMap = {
        high: 3,
        medium: 5,
        low: 7,
    };
    ical += `PRIORITY:${priorityMap[eventData.priority] || 5}\n`;
    if (eventData.isCompleted) {
        ical += 'STATUS:CANCELLED\n';
    }
    ical += 'END:VEVENT\n';
    ical += 'END:VCALENDAR\n';
    return ical;
}
/**
 * Push local event to CalDAV calendar
 */
async function pushEventToCalDAV(syncAccountId, eventData) {
    const syncAccount = await (0, syncAccount_1.getSyncAccount)(syncAccountId);
    if (!syncAccount) {
        throw new Error('Sync account not found');
    }
    const client = await createClient(syncAccount.accountIdentifier, syncAccount.accessToken);
    const calendars = await client.fetchCalendars();
    if (calendars.length === 0) {
        throw new Error('No calendars found');
    }
    const calendar = calendars[0];
    const icalData = formatICalendarEvent(eventData);
    const filename = `${Date.now()}.ics`;
    await client.createCalendarObject({
        calendar,
        filename,
        iCalString: icalData,
    });
    return filename;
}
/**
 * Delete event from CalDAV calendar
 */
async function deleteEventFromCalDAV(syncAccountId, remoteId) {
    const syncAccount = await (0, syncAccount_1.getSyncAccount)(syncAccountId);
    if (!syncAccount) {
        throw new Error('Sync account not found');
    }
    const client = await createClient(syncAccount.accountIdentifier, syncAccount.accessToken);
    const calendars = await client.fetchCalendars();
    if (calendars.length === 0) {
        throw new Error('No calendars found');
    }
    const calendar = calendars[0];
    await client.deleteCalendarObject({
        calendarObject: {
            url: `${calendar.url}/${remoteId}`,
            data: '',
            etag: '',
        },
    });
}
//# sourceMappingURL=caldav.js.map