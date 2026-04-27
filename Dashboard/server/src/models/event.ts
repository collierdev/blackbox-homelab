import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';
import { rrulestr } from 'rrule';

export interface Event {
  id: string;
  title: string;
  startDateTime: string; // ISO 8601
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
  remoteId?: string; // ID from external calendar
  recurrenceRule?: string;
  recurrenceExDates?: string[];
  recurrenceParentId?: string;
  recurrenceInstanceStart?: string;
}

/**
 * Create a new event
 */
export async function createEvent(data: Partial<Event>): Promise<Event> {
  const session = getSession();
  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
      CREATE (e:Event {
        id: $id,
        title: $title,
        startDateTime: datetime($startDateTime),
        endDateTime: datetime($endDateTime),
        location: $location,
        notes: $notes,
        links: $links,
        origin: $origin,
        priority: $priority,
        color: $color,
        isCompleted: $isCompleted,
        isAllDay: $isAllDay,
        projectId: $projectId,
        tagIds: $tagIds,
        taskIds: $taskIds,
        syncAccountId: $syncAccountId,
        remoteId: $remoteId,
        recurrenceRule: $recurrenceRule,
        recurrenceExDates: $recurrenceExDates,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN e
      `,
      {
        id,
        title: data.title || '',
        startDateTime: data.startDateTime || new Date().toISOString(),
        endDateTime: data.endDateTime || new Date().toISOString(),
        location: data.location || null,
        notes: data.notes || [],
        links: data.links || [],
        origin: data.origin || 'local',
        priority: data.priority || 'medium',
        color: data.color || null,
        isCompleted: data.isCompleted || false,
        isAllDay: data.isAllDay || false,
        projectId: data.projectId || 'default',
        tagIds: data.tagIds || [],
        taskIds: data.taskIds || [],
        syncAccountId: data.syncAccountId || null,
        remoteId: data.remoteId || null,
        recurrenceRule: data.recurrenceRule || null,
        recurrenceExDates: data.recurrenceExDates || [],
        createdAt: now,
        updatedAt: now,
      }
    );

    const event = result.records[0].get('e').properties;

    // Link to project if specified
    if (data.projectId) {
      await linkEventToProject(id, data.projectId);
    }

    return convertNeo4jEvent(event);
  } finally {
    await session.close();
  }
}

/**
 * Get event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $id})
      OPTIONAL MATCH (e)-[:BELONGS_TO]->(p:Project)
      RETURN e, p.id as projectId
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const event = record.get('e').properties;
    const projectId = record.get('projectId');

    if (projectId) {
      event.projectId = projectId;
    }

    return convertNeo4jEvent(event);
  } finally {
    await session.close();
  }
}

/**
 * Get events by date range
 */
export async function getEventsByDateRange(
  startDate: string,
  endDate: string
): Promise<Event[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Event)
      WHERE (e.startDateTime >= datetime($startDate) AND e.startDateTime <= datetime($endDate))
         OR e.recurrenceRule IS NOT NULL
      OPTIONAL MATCH (e)-[:BELONGS_TO]->(p:Project)
      RETURN e, p.id as projectId
      ORDER BY e.startDateTime ASC
      `,
      { startDate, endDate }
    );

    const baseEvents = result.records.map((record) => {
      const event = record.get('e').properties;
      const projectId = record.get('projectId');

      if (projectId) {
        event.projectId = projectId;
      }

      return convertNeo4jEvent(event);
    });
    return expandRecurringEvents(baseEvents, startDate, endDate);
  } finally {
    await session.close();
  }
}

/**
 * Get all events
 */
export async function getAllEvents(): Promise<Event[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Event)
      OPTIONAL MATCH (e)-[:BELONGS_TO]->(p:Project)
      RETURN e, p.id as projectId
      ORDER BY e.startDateTime DESC
      LIMIT 1000
      `
    );

    return result.records.map((record) => {
      const event = record.get('e').properties;
      const projectId = record.get('projectId');

      if (projectId) {
        event.projectId = projectId;
      }

      return convertNeo4jEvent(event);
    });
  } finally {
    await session.close();
  }
}

/**
 * Update event
 */
export async function updateEvent(
  id: string,
  data: Partial<Event>
): Promise<Event> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    // Build SET clause dynamically
    const setFields: string[] = [];
    const params: Record<string, any> = { id, updatedAt: now };

    if (data.title !== undefined) {
      setFields.push('e.title = $title');
      params.title = data.title;
    }
    if (data.startDateTime !== undefined) {
      setFields.push('e.startDateTime = datetime($startDateTime)');
      params.startDateTime = data.startDateTime;
    }
    if (data.endDateTime !== undefined) {
      setFields.push('e.endDateTime = datetime($endDateTime)');
      params.endDateTime = data.endDateTime;
    }
    if (data.location !== undefined) {
      setFields.push('e.location = $location');
      params.location = data.location;
    }
    if (data.notes !== undefined) {
      setFields.push('e.notes = $notes');
      params.notes = data.notes;
    }
    if (data.links !== undefined) {
      setFields.push('e.links = $links');
      params.links = data.links;
    }
    if (data.priority !== undefined) {
      setFields.push('e.priority = $priority');
      params.priority = data.priority;
    }
    if (data.color !== undefined) {
      setFields.push('e.color = $color');
      params.color = data.color;
    }
    if (data.isCompleted !== undefined) {
      setFields.push('e.isCompleted = $isCompleted');
      params.isCompleted = data.isCompleted;
    }
    if (data.isAllDay !== undefined) {
      setFields.push('e.isAllDay = $isAllDay');
      params.isAllDay = data.isAllDay;
    }
    if (data.recurrenceRule !== undefined) {
      setFields.push('e.recurrenceRule = $recurrenceRule');
      params.recurrenceRule = data.recurrenceRule;
    }
    if (data.recurrenceExDates !== undefined) {
      setFields.push('e.recurrenceExDates = $recurrenceExDates');
      params.recurrenceExDates = data.recurrenceExDates;
    }

    setFields.push('e.updatedAt = datetime($updatedAt)');

    const result = await session.run(
      `
      MATCH (e:Event {id: $id})
      SET ${setFields.join(', ')}
      RETURN e
      `,
      params
    );

    if (result.records.length === 0) {
      throw new Error(`Event ${id} not found`);
    }

    // Update project relationship if specified
    if (data.projectId !== undefined) {
      await linkEventToProject(id, data.projectId);
    }

    const event = result.records[0].get('e').properties;
    return convertNeo4jEvent(event);
  } finally {
    await session.close();
  }
}

/**
 * Delete event
 */
export async function deleteEvent(id: string): Promise<boolean> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Event {id: $id})
      DETACH DELETE e
      RETURN count(e) as deleted
      `,
      { id }
    );

    return result.records[0].get('deleted').toNumber() > 0;
  } finally {
    await session.close();
  }
}

/**
 * Delete all events
 */
export async function deleteAllEvents(): Promise<number> {
  const session = getSession();
  try {
    const countResult = await session.run(
      `
      MATCH (e:Event)
      RETURN count(e) as total
      `
    );
    const total = countResult.records[0]?.get('total');

    await session.run(
      `
      MATCH (e:Event)
      DETACH DELETE e
      `
    );

    return typeof total?.toNumber === 'function' ? total.toNumber() : (total?.low ?? 0);
  } finally {
    await session.close();
  }
}

/**
 * Link event to project
 */
export async function linkEventToProject(
  eventId: string,
  projectId: string
): Promise<void> {
  const session = getSession();

  try {
    // Remove existing relationship
    await session.run(
      `
      MATCH (e:Event {id: $eventId})-[r:BELONGS_TO]->()
      DELETE r
      `,
      { eventId }
    );

    // Create new relationship
    await session.run(
      `
      MATCH (e:Event {id: $eventId})
      MATCH (p:Project {id: $projectId})
      CREATE (e)-[:BELONGS_TO]->(p)
      `,
      { eventId, projectId }
    );
  } finally {
    await session.close();
  }
}

/**
 * Mark event as completed
 */
export async function completeEvent(id: string): Promise<Event> {
  return updateEvent(id, { isCompleted: true });
}

/**
 * Get events by project
 */
export async function getEventsByProject(projectId: string): Promise<Event[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Event)-[:BELONGS_TO]->(p:Project {id: $projectId})
      RETURN e, p.id as projectId
      ORDER BY e.startDateTime DESC
      `,
      { projectId }
    );

    return result.records.map((record) => {
      const event = record.get('e').properties;
      event.projectId = record.get('projectId');
      return convertNeo4jEvent(event);
    });
  } finally {
    await session.close();
  }
}

/**
 * Get events by sync account (external calendar)
 */
export async function getEventsBySyncAccount(
  syncAccountId: string
): Promise<Event[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Event)-[:SYNCED_FROM]->(sa:SyncAccount {id: $syncAccountId})
      RETURN e
      ORDER BY e.startDateTime DESC
      `,
      { syncAccountId }
    );

    return result.records.map((record) => {
      const event = record.get('e').properties;
      return convertNeo4jEvent(event);
    });
  } finally {
    await session.close();
  }
}

/**
 * Convert Neo4j datetime objects to ISO strings
 */
/**
 * Get event by sync details (syncAccountId + remoteId)
 */
export async function getEventBySyncDetails(
  syncAccountId: string,
  remoteId: string
): Promise<Event | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (e:Event)
      WHERE e.syncAccountId = $syncAccountId
        AND e.remoteId = $remoteId
      RETURN e
      `,
      { syncAccountId, remoteId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const event = result.records[0].get('e').properties;
    return convertNeo4jEvent(event);
  } finally {
    await session.close();
  }
}

function convertNeo4jEvent(event: any): Event {
  return {
    ...event,
    startDateTime: event.startDateTime?.toString() || event.startDateTime,
    endDateTime: event.endDateTime?.toString() || event.endDateTime,
    createdAt: event.createdAt?.toString() || event.createdAt,
    updatedAt: event.updatedAt?.toString() || event.updatedAt,
    recurrenceExDates: event.recurrenceExDates || [],
  };
}

function expandRecurringEvents(events: Event[], rangeStartIso: string, rangeEndIso: string): Event[] {
  const expanded: Event[] = [];
  const rangeStart = new Date(rangeStartIso);
  const rangeEnd = new Date(rangeEndIso);

  for (const event of events) {
    if (!event.recurrenceRule) {
      expanded.push(event);
      continue;
    }

    try {
      const start = new Date(event.startDateTime);
      const end = new Date(event.endDateTime);
      const durationMs = end.getTime() - start.getTime();
      const rule = rrulestr(event.recurrenceRule, { dtstart: start });
      const occurrences = rule.between(rangeStart, rangeEnd, true);
      const exDateSet = new Set((event.recurrenceExDates || []).map((d) => new Date(d).toISOString()));

      for (const occurrenceStart of occurrences) {
        if (exDateSet.has(occurrenceStart.toISOString())) continue;
        const instanceStart = occurrenceStart.toISOString();
        const instanceEnd = new Date(occurrenceStart.getTime() + durationMs).toISOString();
        expanded.push({
          ...event,
          id: `${event.id}::${instanceStart}`,
          startDateTime: instanceStart,
          endDateTime: instanceEnd,
          recurrenceParentId: event.id,
          recurrenceInstanceStart: instanceStart,
        });
      }
    } catch {
      expanded.push(event);
    }
  }

  return expanded.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
}
