# Calendar & Todo Implementation Progress

**Started**: January 19, 2026
**Plan File**: `/home/jwcollie/.claude/plans/generic-wishing-pillow.md`
**Original Spec**: `/home/jwcollie/Dashboard/to_add/cal.md`

---

## Current Status Summary

**Backend**: ✅ COMPLETE (Phases 1-3)
- Neo4J database running and initialized
- 4 data models with full CRUD operations
- 4 REST API route modules
- Socket.io real-time updates
- ~2,500 lines of backend code

**Frontend**: ✅ COMPLETE (Phases 5-7, 9)
- ✅ TypeScript types added (Phase 5)
- ✅ useSocket hook updated with calendar/todo state and APIs (Phase 5)
- ✅ All Calendar React components created (Phase 6)
- ✅ All Todo React components created (Phase 7)
- ✅ Integrated with App.tsx tabs (Phase 9)

**Advanced Features**: ✅ COMPLETE (Phases 4, 8)
- ✅ Calendar sync (Google/Microsoft/Apple CalDAV)
- ✅ AI task suggestions (Ollama integration)
- ✅ Todo.md file synchronization (real-time file watching)
- ✅ d3.js visualizations (all 5 calendar views)

**Next Steps**:
1. ✅ ~~Add frontend types to `client/src/types/index.ts`~~ (DONE)
2. ✅ ~~Update `client/src/hooks/useSocket.ts` with calendar/todo state~~ (DONE)
3. ✅ ~~Create React components for Calendar views (Phase 6)~~ (DONE)
4. ✅ ~~Create React components for Todo views (Phase 7)~~ (DONE)
5. ✅ ~~Integrate with App.tsx tab navigation (Phase 9)~~ (DONE)
6. Deploy and test with Neo4J (Phase 10)
7. Implement calendar sync services (Phase 4)
8. Add AI features and TODO.md sync (Phase 8)

---

## Implementation Status

### ✅ Phase 1: Infrastructure & Database Setup (COMPLETED)

**Completed:**
- [x] 1.1 Updated `docker-compose.yml` with Neo4J container
  - Added neo4j:5.15 service on ports 7474 (HTTP) and 7687 (Bolt)
  - Added volumes: neo4j_data, neo4j_logs
  - Updated dashboard service with Neo4J environment variables
  - Using host network mode (dashboard needs host access for Docker sock)
- [x] 1.2 Added backend dependencies to `server/package.json`
  - neo4j-driver ^5.15.0
  - date-fns ^3.0.0
  - googleapis ^130.0.0
  - @microsoft/microsoft-graph-client ^3.0.7
  - tsdav ^2.0.3
  - chokidar ^3.5.3
  - uuid ^9.0.1
  - cron ^3.1.6
  - @types/uuid ^9.0.8
- [x] 1.3 Added frontend dependencies to `client/package.json`
  - d3 ^7.8.5
  - @types/d3 ^7.4.3
  - date-fns ^3.0.0
  - react-hook-form ^7.49.3
  - zod ^3.22.4
  - @hookform/resolvers ^3.3.4
- [x] 1.4 Created `.env` configuration file
  - All Neo4J connection variables
  - OAuth placeholders for Google, Microsoft, Apple
  - Encryption secret placeholder
  - Todo.md sync paths
- [x] 1.5 Created `server/src/config/neo4j.ts`
  - Driver singleton pattern
  - Session management
  - Schema initialization (constraints + indexes)
  - Connection verification
  - Database statistics
  - Graceful shutdown handlers
  - Default project creation
- [x] 1.6 Installed dependencies
  - Backend: 41 packages added
  - Frontend: 73 packages added
- [x] 1.7 Started Neo4J container
  - Container ID: 571dce49f76d
  - Running on ports 7474 (HTTP) and 7687 (Bolt)
  - Version: Neo4J 5.15.0 Community Edition
  - Verified accessible: http://192.168.50.39:7474

### ✅ Phase 2: Backend Data Models (COMPLETED)

Files created:
- [x] `server/src/models/event.ts` (473 lines)
  - CRUD operations for calendar events
  - Link events to projects
  - Support for external sync (syncAccountId, remoteId)
  - Date range queries, completion status
- [x] `server/src/models/task.ts` (398 lines)
  - CRUD operations for tasks
  - Hierarchical subtasks (HAS_SUBTASK relationship)
  - Project assignment, reordering, completion
  - Support for todo.md origin
- [x] `server/src/models/project.ts` (199 lines)
  - Project CRUD with color coding
  - Auto-ordering, cascade delete option
  - Default project protection
- [x] `server/src/models/syncAccount.ts` (268 lines)
  - OAuth token encryption/decryption
  - Google, Microsoft, CalDAV support
  - Status tracking, error messages
  - Last sync timestamp

### ✅ Phase 3: Backend API Routes (COMPLETED)

Files created:
- [x] `server/src/routes/calendar.ts` (107 lines)
  - GET / - List events (with date range and project filters)
  - GET /:id - Get single event
  - POST / - Create event
  - PUT /:id - Update event
  - DELETE /:id - Delete event
  - POST /:id/complete - Mark completed
- [x] `server/src/routes/todos.ts` (140 lines)
  - GET / - List tasks (with project filter)
  - GET /:id - Get task with subtasks
  - POST / - Create task
  - PUT /:id - Update task
  - DELETE /:id - Delete task
  - POST /:id/complete - Toggle completion
  - POST /:id/subtasks - Add subtask
  - POST /reorder - Reorder tasks
- [x] `server/src/routes/projects.ts` (113 lines)
  - GET / - List all projects
  - GET /:id - Get single project
  - POST / - Create project
  - PUT /:id - Update project
  - DELETE /:id - Delete project (with cascade option)
  - POST /reorder - Reorder projects
- [x] `server/src/routes/sync.ts` (95 lines)
  - GET /accounts - List sync accounts (sanitized)
  - GET /accounts/:id - Get sync account
  - DELETE /accounts/:id - Disconnect account
  - OAuth endpoints (placeholder for Phase 4)
- [x] Updated `server/src/index.ts`
  - Registered all 4 new route modules
  - Added Neo4J initialization on startup
  - Added Socket.io events for calendar/todos (every 5s)
  - Emits: calendarEvents, todos, projects

### ✅ Phase 4: Calendar Sync Services (COMPLETED)

Files created:
- [x] `server/src/services/sync/google.ts` - Google Calendar OAuth2 + sync (210 lines)
- [x] `server/src/services/sync/microsoft.ts` - Microsoft Graph API + sync (230 lines)
- [x] `server/src/services/sync/caldav.ts` - CalDAV (Apple iCloud) + sync (300 lines)
- [x] `server/src/services/sync/manager.ts` - Cron scheduler + sync orchestration (140 lines)

**Features:**
- OAuth2 authentication for Google and Microsoft
- Basic auth for CalDAV
- Bi-directional sync (read from external calendars)
- Push events to external calendars
- Automatic sync every 15 minutes
- Error handling and retry logic
- Token refresh for expired credentials

### ✅ Phase 5: Frontend TypeScript Types (COMPLETED)

Files modified:
- [x] `client/src/types/index.ts` (added Event, Task, Project, SyncAccount, CalendarView, SyncConflict interfaces)
- [x] `client/src/hooks/useSocket.ts` (added calendar/todo state, Socket.io listeners, and complete CRUD API functions)

**Added types:**
- Event (16 properties including sync support)
- Task (14 properties including subtask support)
- Project (5 properties)
- SyncAccount (7 properties)
- CalendarView ('month' | 'week' | 'day' | '2month' | 'circular')
- SyncConflict (conflict resolution type)

**Added to useSocket hook:**
- State: events, tasks, projects, syncAccounts
- Socket listeners: calendarEvents, todos, projects
- Event APIs: createEvent, updateEvent, deleteEvent, completeEvent
- Task APIs: createTask, updateTask, deleteTask, completeTask, createSubtask, reorderTasks
- Project APIs: createProject, updateProject, deleteProject, reorderProjects
- Sync APIs: fetchSyncAccounts, disconnectSyncAccount

### ✅ Phase 6: Frontend Calendar Components (COMPLETED)

Files created:
- [x] `client/src/components/calendar/Calendar.tsx` - Main container with view switching
- [x] `client/src/components/calendar/CalendarHeader.tsx` - Header with navigation and filters
- [x] `client/src/components/calendar/MonthView.tsx` - d3.js month grid view
- [x] `client/src/components/calendar/WeekView.tsx` - d3.js week timeline view
- [x] `client/src/components/calendar/DayView.tsx` - d3.js day schedule view
- [x] `client/src/components/calendar/TwoMonthView.tsx` - d3.js two-month side-by-side view
- [x] `client/src/components/calendar/CircularView.tsx` - d3.js circular year view
- [x] `client/src/components/calendar/EventForm.tsx` - Form for creating/editing events
- [x] `client/src/components/calendar/EventModal.tsx` - Modal for viewing event details

### ✅ Phase 7: Frontend Todo Components (COMPLETED)

Files created:
- [x] `client/src/components/todos/TodoList.tsx` - Main todo list with project grouping
- [x] `client/src/components/todos/TodoTask.tsx` - Individual task with subtask support
- [x] `client/src/components/todos/TaskForm.tsx` - Form for creating/editing tasks
- Note: TodoSuggestions.tsx deferred to Phase 8 (AI features)

### ✅ Phase 8: AI Features & Todo.md Sync (COMPLETED)

Files created:
- [x] `server/src/services/aiSuggestions.ts` - Ollama integration + task analytics (240 lines)
- [x] `server/src/services/todoMdSync.ts` - Real-time TODO.md file watcher (240 lines)

**Features:**
- AI task suggestions using local Ollama LLM
- Task pattern analysis and insights
- Bi-directional TODO.md sync (markdown ↔ database)
- Real-time file watching with chokidar
- Support for multiple TODO.md files
- Priority tags (!high, !medium, !low)
- Checkbox completion tracking

### ✅ Phase 9: Integration & Tab Navigation (COMPLETED)

Files modified/created:
- [x] `client/src/App.tsx` - Added Calendar & Tasks tab
- [x] `client/src/components/CalendarTodoView.tsx` - Created wrapper component
- [x] `server/src/index.ts` - Routes and Socket.io events already registered in Phase 3
- [x] `client/src/types/index.ts` - Updated Event and Task interfaces with UI-friendly fields
- [x] Fixed encryption functions in `server/src/models/syncAccount.ts` (deprecated crypto APIs)

### ⏳ Phase 10: Deployment & Testing (IN PROGRESS)

Tasks:
- [x] Build Docker image with all features
- [ ] Deploy with docker compose
- [ ] Verify services are running
- [ ] Test calendar CRUD operations
- [ ] Test todo CRUD operations
- [ ] Test project management
- [ ] Write Playwright E2E tests
- [ ] Run tests and document bugs
- [ ] Set up OAuth credentials (Google, Microsoft, Apple) - optional
- [ ] Test calendar sync - optional
- [ ] Test AI suggestions - optional

---

## Critical Decisions Made

1. **Database**: Neo4J graph database (for complex relationships)
2. **External Sync**: Google Calendar, Microsoft Outlook, Apple iCloud CalDAV (2-way sync)
3. **Visualization**: d3.js for all calendar views
4. **Scope**: Complete implementation (all features)

---

## Environment Variables Required

Create `/home/jwcollie/Dashboard/.env`:
```bash
# Neo4J
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=dashboard123

# Google Calendar (get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret

# Microsoft Outlook (get from https://portal.azure.com)
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_secret
MICROSOFT_TENANT_ID=common

# Apple iCloud CalDAV
CALDAV_URL=https://caldav.icloud.com
CALDAV_USERNAME=your_icloud_email
CALDAV_PASSWORD=your_app_specific_password

# Encryption for OAuth tokens
ENCRYPTION_SECRET=generate_32_char_random_string_here

# Todo.md sync paths (comma-separated)
TODO_MD_PATHS=/home/jwcollie/TODO.md,/home/jwcollie/Dashboard/TODO.md

# Existing (already set)
NODE_ENV=production
PORT=80
HA_URL=http://192.168.50.39:8123
HA_TOKEN=your_ha_token
```

---

## Graph Schema Design

**Nodes:**
- `Event` - Calendar events with datetime, title, location, notes
- `Task` - Todo items with due date, priority, completion status
- `Project` - Grouping for events and tasks
- `Tag` - Labels for categorization
- `SyncAccount` - External calendar connection info (Google/Apple/Outlook)

**Relationships:**
- `(Event)-[:BELONGS_TO]->(Project)`
- `(Task)-[:BELONGS_TO]->(Project)`
- `(Event)-[:HAS_TAG]->(Tag)`
- `(Task)-[:HAS_TAG]->(Tag)`
- `(Event)-[:CREATES_TASKS]->(Task)` - Event generates tasks
- `(Task)-[:HAS_SUBTASK]->(Task)` - Task hierarchy
- `(Task)-[:LINKED_TO]->(Event)` - Task associated with event
- `(Event)-[:SYNCED_FROM]->(SyncAccount)`

---

## Key Implementation Notes

### Neo4J Cypher Query Patterns

**Create with ID:**
```cypher
CREATE (e:Event {
  id: $id,
  title: $title,
  startDateTime: datetime($startDateTime),
  endDateTime: datetime($endDateTime),
  createdAt: datetime($createdAt),
  updatedAt: datetime($updatedAt)
})
RETURN e
```

**Fetch with relationships:**
```cypher
MATCH (e:Event {id: $id})
OPTIONAL MATCH (e)-[:BELONGS_TO]->(p:Project)
OPTIONAL MATCH (e)-[:HAS_TAG]->(tag:Tag)
RETURN e, p.id as projectId, collect(tag.id) as tagIds
```

**Date range query:**
```cypher
MATCH (e:Event)
WHERE e.startDateTime >= datetime($startDate)
  AND e.startDateTime <= datetime($endDate)
RETURN e
ORDER BY e.startDateTime
```

### OAuth Flow Pattern

1. User clicks "Connect Google Calendar"
2. Backend generates auth URL: `/api/sync/google/auth`
3. User redirects to Google consent screen
4. Google redirects back to: `/api/sync/google/callback?code=...`
5. Backend exchanges code for tokens
6. Store encrypted tokens in Neo4J SyncAccount node
7. Start cron job for periodic sync (every 15 minutes)

### Socket.io Real-time Updates

Events to emit from server:
- `calendarEvents` - Array of events (every 5 seconds)
- `todos` - Array of tasks (every 5 seconds)
- `projects` - Array of projects (every 5 seconds)
- `syncConflict` - Conflict object (when detected)
- `syncStatus` - Sync progress updates

---

## Files Modified So Far

1. `/home/jwcollie/Dashboard/docker-compose.yml` - Added Neo4J service
2. `/home/jwcollie/Dashboard/server/package.json` - Added backend dependencies
3. `/home/jwcollie/Dashboard/client/package.json` - Added frontend dependencies
4. `/home/jwcollie/Dashboard/PROGRESS.md` - This file

---

## Next Session Resume Instructions

**Current Status**: Phases 1-7 and 9 complete - Backend and Frontend fully implemented, ready for deployment testing

**To resume:**
1. Read this PROGRESS.md file
2. Start Neo4J container: `cd ~/Dashboard && docker-compose up -d neo4j`
3. Build and deploy dashboard: `npm run build && docker build -t pi-dashboard . && docker-compose up -d`
4. Test Calendar & Tasks tab at http://192.168.50.39
5. Verify CRUD operations work for events, tasks, and projects
6. Optionally implement Phase 4 (Calendar Sync) or Phase 8 (AI features)

**Quick context:**
- Backend complete: Neo4J models, REST APIs, Socket.io real-time updates
- Frontend complete: All calendar views (month/week/day/2month/circular), todo list with subtasks
- Tab navigation: System / Smart Home / **Calendar & Tasks** (fully integrated)
- Build passing: All TypeScript errors fixed
- Using React 19, Express 5, Socket.io, Tailwind 4, d3.js for visualizations

---

## Useful Commands

```bash
# Install dependencies
cd ~/Dashboard/server && npm install
cd ~/Dashboard/client && npm install

# Start Neo4J only
cd ~/Dashboard && docker-compose up -d neo4j

# View Neo4J logs
docker logs -f pi-dashboard-neo4j

# Access Neo4J browser
open http://192.168.50.39:7474

# Build and deploy full stack
cd ~/Dashboard
docker build -t pi-dashboard .
docker-compose up -d

# Check container status
docker ps

# View dashboard logs
docker logs -f pi-dashboard
```

---

**Last Updated**: January 19, 2026 - All phases complete (Full stack implementation ready for deployment)

## Implementation Summary

**Total Files Created**: 29 files
**Total Lines of Code**: ~6,500 lines

### Backend (Server)
- **Models**: 4 files (~1,100 lines) - Event, Task, Project, SyncAccount
- **Routes**: 4 files (~450 lines) - Calendar, Todos, Projects, Sync APIs
- **Services**: 6 files (~1,150 lines) - Google, Microsoft, CalDAV sync + Manager + AI + TODO.md
- **Config**: Neo4J connection + schema initialization

### Frontend (Client)
- **Calendar Components**: 9 files (~1,800 lines) - 5 d3.js views + header + forms + modal
- **Todo Components**: 3 files (~650 lines) - List + Task + Form with subtask support
- **Wrapper**: CalendarTodoView integration
- **Types**: Enhanced Event/Task interfaces with sync support

### Integration
- Socket.io real-time updates for calendar/todos/projects
- Sync scheduler (every 15 minutes)
- TODO.md file watcher (real-time)
- AI task suggestions via Ollama
- Graceful shutdown handlers
