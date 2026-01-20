# Calendar & Todo Components - Implementation Guide

This directory contains specifications for Calendar and Todo components to be integrated into the Pi Dashboard.

## Overview

The `cal.md` file describes two interconnected components:
1. **Calendar Component** - Event management with external calendar sync
2. **Todo Component** - Task/subtask management with calendar integration

## Files in This Directory

| File | Purpose | Status |
|------|---------|--------|
| `cal.md` | Original specification | ✅ Present |
| `CLAUDE.md` | Implementation guide (this file) | ✅ Created |

---

## Current Specification Analysis

### Calendar Component

**Proposed Features:**
- ✅ CRUD operations for calendar events
- ✅ Tagging, color coding, organization
- ✅ Start/end datetime, title, location, notes, links
- ❓ 2-way sync with Google Cal, Apple Cal, other platforms
- ❓ Neo4J graph database backend
- ✅ d3.js visualization with multiple views
- ✅ Circular pie-chart-like visualization
- ✅ Subtasks support

**Data Model (JSON):**
```json
{
  "event1": {
    "title": "",
    "project": "",
    "tags": ["", "", ""],
    "startDate": "",
    "startTime": "",
    "endDate": "",
    "endTime": "",
    "location": "",
    "notes": {
      "note1": "",
      "note2": "",
      "link1": "",
      "link2": ""
    },
    "origin": "",
    "priority": "",
    "tasks": {},
    "isCompleted": ""
  }
}
```

### Todo Component

**Proposed Features:**
- ✅ CRUD operations for tasks and subtasks
- ✅ Tagging, color coding, organization
- ✅ Sorting by priority, project, date
- ✅ Calendar integration
- ❓ Automated subtask generation
- ❓ Sync with systemwide todo.md files
- ❓ AI-suggested tasks
- ✅ Drag-and-drop UI
- ✅ Project headers and sections

**Data Model (JSON):**
```json
{
  "task1": {
    "title": "",
    "project": "",
    "tags": ["", "", ""],
    "dueDate": "",
    "startDate": "",
    "startTime": "",
    "endDate": "",
    "endTime": "",
    "location": "",
    "notes": {
      "note1": "",
      "note2": "",
      "link1": "",
      "link2": ""
    },
    "origin": "",
    "calendarEvent": "",
    "priority": "",
    "subtasks": {},
    "isComplete": ""
  }
}
```

---

## Questions & Decisions Needed

### 🔴 Critical Decisions

1. **Database Choice**
   - **Proposed**: Neo4J graph database
   - **Current Dashboard**: No database (uses Docker volumes, config files)
   - **Questions**:
     - Do we really need Neo4J? What relationships require a graph DB?
     - Alternatives: PostgreSQL (relational), MongoDB (document), SQLite (embedded), or JSON files?
     - Should this integrate with existing Dashboard backend (Express/TypeScript)?

2. **External Calendar Sync**
   - **Proposed**: 2-way sync with Google Cal, Apple Cal
   - **Questions**:
     - Which calendars are priority? (Google, Apple, Outlook, CalDAV?)
     - Use OAuth flows for each provider?
     - Sync frequency (real-time via webhooks, polling every X minutes)?
     - How to handle conflicts (local vs external changes)?

3. **Visualization Library**
   - **Proposed**: d3.js
   - **Current Dashboard**: Lucide React icons, native CSS
   - **Questions**:
     - Is d3.js necessary for all views or just the circular chart?
     - Consider lighter alternatives: recharts, nivo, or custom CSS grid?

### 🟡 Implementation Details Needed

4. **Data Structure Refinements**
   - `notes` field mixes notes and links in one object - should these be separate arrays?
   - Date/time format: ISO 8601 strings? Unix timestamps? Separate date/time?
   - `origin` field purpose? (which calendar it came from?)
   - `isCompleted` vs `isComplete` - standardize naming?
   - Missing: `id` field, `createdAt`, `updatedAt` timestamps, `userId`?

5. **Todo.md Synchronization**
   - **Proposed**: "Automate synchronizing with todo.md and important documentation systemwide"
   - **Questions**:
     - Which todo.md files? (~/TODO.md, project-specific ones?)
     - Format compatibility (markdown checkboxes → JSON tasks)?
     - One-way or two-way sync?
     - How to identify which tasks belong to which file?

6. **AI Features**
   - **Proposed**: "Create a list of suggested tasks to add to the todos"
   - **Questions**:
     - Use Ollama (already installed) or Claude API?
     - What data does AI analyze? (past events, patterns, project info?)
     - How are suggestions presented/approved?

7. **Automated Task Creation**
   - **Proposed**: "Automate creating tasks/subtasks for events" and "Automate creating subtasks"
   - **Questions**:
     - What triggers automation? (keywords in event title, project type?)
     - Predefined templates for common event types?
     - User approval required or auto-create?

### 🟢 UI/UX Details

8. **Calendar Views**
   - Proposed: 2-month, month, week, day, circular
   - Which view is default?
   - How to switch between views?
   - Responsive design for mobile/tablet?

9. **Drag and Drop**
   - Library: react-dnd, @dnd-kit (already used in Dashboard), or native?
   - What can be dragged? (tasks between projects, events between days?)

10. **Color Coding**
    - User-defined colors or preset palette?
    - Color per project, tag, or priority?
    - Stored in database or frontend-only?

---

## Integration with Existing Dashboard

### Current Dashboard Architecture

**Frontend:**
- React 18 + TypeScript + Vite 7
- Tailwind CSS 4 (dark/light mode)
- Socket.io-client for real-time updates
- @dnd-kit (already installed for drag-and-drop)

**Backend:**
- Express 5 + TypeScript
- Socket.io for WebSocket
- No database (Docker volumes for data)
- Existing APIs: system stats, Docker/systemd control, Home Assistant, go2rtc cameras, AI chat (Ollama/Claude)

### Integration Points

1. **New Backend Routes Needed:**
   - `POST /api/calendar/events` - Create event
   - `GET /api/calendar/events` - List events (with filters)
   - `PUT /api/calendar/events/:id` - Update event
   - `DELETE /api/calendar/events/:id` - Delete event
   - `POST /api/todos/tasks` - Create task
   - `GET /api/todos/tasks` - List tasks
   - `PUT /api/todos/tasks/:id` - Update task
   - `DELETE /api/todos/tasks/:id` - Delete task
   - `POST /api/calendar/sync/:provider` - Trigger external sync
   - `POST /api/todos/suggest` - AI task suggestions

2. **New Frontend Components:**
   - `Calendar.tsx` - Main calendar container with view switcher
   - `CalendarGrid.tsx` - Traditional grid view
   - `CalendarCircular.tsx` - d3.js circular visualization
   - `CalendarEvent.tsx` - Individual event card
   - `TodoList.tsx` - Main todo container
   - `TodoProject.tsx` - Project section with header
   - `TodoTask.tsx` - Individual task item with subtasks
   - `EventTaskForm.tsx` - Shared form for creating/editing

3. **Data Storage:**
   - Option A: Add database container (PostgreSQL/MongoDB/Neo4J)
   - Option B: JSON files in Docker volume (simpler, current pattern)
   - Option C: SQLite database file (embedded, no extra container)

4. **Tab Navigation:**
   - Current: System / Smart Home
   - Add: Calendar / Todos (as subtabs? new main tabs?)

---

## Recommended Next Steps

### Phase 1: Requirements Clarification (Current)
- [ ] Review and update `cal.md` with decisions on critical questions
- [ ] Choose database solution
- [ ] Define external calendar sync scope (which providers, if any)
- [ ] Finalize data models with all required fields

### Phase 2: Database & Backend Setup
- [ ] Set up chosen database
- [ ] Create database schema/models
- [ ] Implement REST API endpoints
- [ ] Add WebSocket events for real-time updates

### Phase 3: Basic Calendar UI
- [ ] Create Calendar tab in dashboard
- [ ] Implement month view (most common)
- [ ] Add event creation/editing form
- [ ] Connect to backend API

### Phase 4: Todo Component
- [ ] Create Todo tab/section
- [ ] Implement project sections
- [ ] Add drag-and-drop sorting
- [ ] Connect to backend API

### Phase 5: Advanced Features
- [ ] Add week/day/2-month views
- [ ] Implement d3.js circular visualization
- [ ] Add external calendar sync (if decided)
- [ ] Implement AI task suggestions
- [ ] Add todo.md synchronization

---

## Technical Recommendations

### Database Choice
**Recommendation**: **SQLite** or **PostgreSQL**
- ✅ SQLite: Embedded, no container needed, perfect for single-user dashboard
- ✅ PostgreSQL: More powerful, supports JSON columns, easy to add container
- ❌ Neo4J: Overkill unless you have complex graph relationships (e.g., task dependencies spanning projects)
- ❌ MongoDB: Possible, but relationships between events/tasks better suited to relational or JSON-in-SQL

### External Calendar Sync
**Recommendation**: **Start without, add later if needed**
- Phase 1: Local-only calendar (faster to implement)
- Phase 2: Add read-only sync (import from Google Cal)
- Phase 3: Add 2-way sync if necessary

### Visualization
**Recommendation**: **Mix of libraries**
- Month/week/day views: Custom CSS Grid (lightweight, Tailwind-compatible)
- Circular view: d3.js (only load when viewing this specific visualization)
- Alternative circular: recharts or nivo (React-friendly, easier than d3)

### Data Format
**Recommendation**: **ISO 8601 date-times, separate notes/links arrays**
```json
{
  "id": "uuid-v4",
  "title": "Team Meeting",
  "project": "Marketing Campaign",
  "tags": ["meeting", "weekly"],
  "startDateTime": "2026-01-20T14:00:00Z",
  "endDateTime": "2026-01-20T15:00:00Z",
  "location": "Conference Room A",
  "notes": [
    "Discuss Q1 goals",
    "Review budget allocation"
  ],
  "links": [
    "https://docs.example.com/q1-goals",
    "https://sheets.example.com/budget"
  ],
  "origin": "local",
  "priority": "high",
  "color": "#FF6B6B",
  "tasks": ["task-id-1", "task-id-2"],
  "isCompleted": false,
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-19T16:45:00Z"
}
```

---

## Open Questions for User

Before proceeding with implementation, please provide input on:

1. **Database**: SQLite, PostgreSQL, or stick with JSON files?
2. **External Sync**: Which calendar providers are must-have? (Google, Apple, none to start?)
3. **Visualization Priority**: Which calendar view is most important? (month, week, circular?)
4. **AI Features**: Should we integrate with Ollama for task suggestions? Or skip AI for now?
5. **Todo.md Sync**: Which todo.md files should sync? One-way or two-way?
6. **Scope**: Build everything at once or phase it (basic calendar → todos → advanced features)?

---

## Notes

- Current Dashboard uses port 80, Socket.io on same port
- Dashboard already has tab navigation system (System/Smart Home)
- @dnd-kit already installed and working (draggable panels)
- Ollama and Claude API already integrated for AI features
- Home Assistant integration pattern can be reference for calendar sync
