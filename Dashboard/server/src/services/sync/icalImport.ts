import AdmZip from 'adm-zip';
import { createEvent } from '../../models/event';

interface ParsedEvent {
  title: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  notes: string[];
  links: string[];
  origin: 'google';
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  isAllDay: boolean;
  remoteId?: string;
  recurrenceRule?: string;
  recurrenceExDates?: string[];
}

function unfoldLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const unfolded: string[] = [];
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfolded.length > 0) unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function parseIcsDateTime(value: string, dateOnly: boolean): { value: string; allDay: boolean } {
  const raw = value.trim();
  if (dateOnly) {
    const yyyy = raw.slice(0, 4);
    const mm = raw.slice(4, 6);
    const dd = raw.slice(6, 8);
    return { value: `${yyyy}-${mm}-${dd}`, allDay: true };
  }

  const clean = raw.endsWith('Z') ? raw.slice(0, -1) : raw;
  const yyyy = clean.slice(0, 4);
  const mm = clean.slice(4, 6);
  const dd = clean.slice(6, 8);
  const hh = clean.slice(9, 11);
  const min = clean.slice(11, 13);
  const sec = clean.slice(13, 15);
  return { value: `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}${raw.endsWith('Z') ? 'Z' : ''}`, allDay: false };
}

function parseEventsFromIcs(icsText: string): ParsedEvent[] {
  const lines = unfoldLines(icsText);
  const events: ParsedEvent[] = [];
  let inEvent = false;
  let current: ParsedEvent | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {
        title: 'Untitled Event',
        startDateTime: '',
        endDateTime: '',
        notes: [],
        links: [],
        origin: 'google',
        priority: 'medium',
        isCompleted: false,
        isAllDay: false,
      };
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (current && current.startDateTime && current.endDateTime) {
        events.push(current);
      }
      current = null;
      continue;
    }
    if (!inEvent || !current || !line.includes(':')) continue;

    const idx = line.indexOf(':');
    const key = line.slice(0, idx).toUpperCase();
    const value = line.slice(idx + 1);

    if (key.startsWith('SUMMARY')) current.title = value.trim() || 'Untitled Event';
    else if (key.startsWith('DESCRIPTION')) current.notes = [value.replace(/\\n/g, '\n').trim()];
    else if (key.startsWith('LOCATION')) current.location = value.trim();
    else if (key.startsWith('URL')) current.links = [value.trim()];
    else if (key.startsWith('UID')) current.remoteId = value.trim();
    else if (key.startsWith('RRULE')) current.recurrenceRule = value.trim();
    else if (key.startsWith('EXDATE')) {
      const dateOnly = key.includes('VALUE=DATE');
      const exDates = value
        .split(',')
        .map((v) => parseIcsDateTime(v, dateOnly).value)
        .filter(Boolean);
      current.recurrenceExDates = exDates;
    }
    else if (key.startsWith('STATUS')) current.isCompleted = value.trim().toUpperCase() === 'CANCELLED';
    else if (key.startsWith('PRIORITY')) {
      const p = Number(value.trim());
      current.priority = Number.isFinite(p) ? (p <= 4 ? 'high' : p <= 6 ? 'medium' : 'low') : 'medium';
    } else if (key.startsWith('DTSTART')) {
      const parsed = parseIcsDateTime(value, key.includes('VALUE=DATE'));
      current.startDateTime = parsed.value;
      current.isAllDay = parsed.allDay;
    } else if (key.startsWith('DTEND')) {
      const parsed = parseIcsDateTime(value, key.includes('VALUE=DATE'));
      current.endDateTime = parsed.value;
    }
  }

  return events;
}

function extractIcsTexts(filename: string, fileBuffer: Buffer): string[] {
  if (filename.toLowerCase().endsWith('.ics')) {
    return [fileBuffer.toString('utf8')];
  }

  if (filename.toLowerCase().endsWith('.zip')) {
    const zip = new AdmZip(fileBuffer);
    const icsEntries = zip.getEntries().filter((e) => !e.isDirectory && e.entryName.toLowerCase().endsWith('.ics'));
    return icsEntries.map((entry) => entry.getData().toString('utf8'));
  }

  throw new Error('Unsupported file type. Please upload a .ics or .zip file.');
}

function dedupeEvents(events: ParsedEvent[]): ParsedEvent[] {
  const seen = new Set<string>();
  const out: ParsedEvent[] = [];
  for (const e of events) {
    const key = `${e.remoteId || ''}|${e.title}|${e.startDateTime}|${e.endDateTime}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  }
  return out;
}

export async function importGoogleIcalFile(params: {
  filename: string;
  fileDataBase64: string;
  projectId?: string;
}): Promise<{ imported: number; failed: number; parsed: number; deduped: number }> {
  const fileBuffer = Buffer.from(params.fileDataBase64, 'base64');
  const icsTexts = extractIcsTexts(params.filename, fileBuffer);

  const parsed = icsTexts.flatMap((t) => parseEventsFromIcs(t));
  const deduped = dedupeEvents(parsed);
  let imported = 0;
  let failed = 0;

  for (const event of deduped) {
    try {
      await createEvent({
        title: event.title,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        location: event.location,
        notes: event.notes || [],
        links: event.links || [],
        origin: 'google',
        priority: event.priority || 'medium',
        isCompleted: Boolean(event.isCompleted),
        isAllDay: Boolean(event.isAllDay),
        projectId: params.projectId || 'default',
        tagIds: [],
        taskIds: [],
        remoteId: event.remoteId,
        recurrenceRule: event.recurrenceRule,
        recurrenceExDates: event.recurrenceExDates || [],
      });
      imported++;
    } catch {
      failed++;
    }
  }

  return { imported, failed, parsed: parsed.length, deduped: deduped.length };
}
