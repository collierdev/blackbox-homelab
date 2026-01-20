import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import systemRoutes from './routes/system';
import servicesRoutes from './routes/services';
import chatRoutes from './routes/chat';
import homeassistantRoutes from './routes/homeassistant';
import go2rtcRoutes from './routes/go2rtc';
import calendarRoutes from './routes/calendar';
import todosRoutes from './routes/todos';
import projectsRoutes from './routes/projects';
import syncRoutes from './routes/sync';
import { getSystemStats } from './utils/systemInfo';
import { getGroupedEntities, checkConnection } from './utils/homeassistant';
import { initializeSchema, verifyConnection, getDatabaseStats } from './config/neo4j';
import { getAllEvents, getEventsByDateRange } from './models/event';
import { getAllTasks } from './models/task';
import { getAllProjects } from './models/project';
import { startSyncScheduler, stopSyncScheduler } from './services/sync/manager';
import { startTodoMdWatcher, stopTodoMdWatcher } from './services/todoMdSync';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/system', systemRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/homeassistant', homeassistantRoutes);
app.use('/api/go2rtc', go2rtcRoutes);
app.use('/api/calendar/events', calendarRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Socket.io for real-time stats
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const statsInterval = setInterval(async () => {
    try {
      const stats = await getSystemStats();
      socket.emit('systemStats', stats);
    } catch (error) {
      console.error('Error getting system stats:', error);
    }
  }, 2000);

  // Home Assistant updates (every 5 seconds)
  const haInterval = setInterval(async () => {
    try {
      const status = await checkConnection();
      if (status.connected) {
        const devices = await getGroupedEntities();
        socket.emit('haDevices', devices);
      }
      socket.emit('haStatus', status);
    } catch (error) {
      socket.emit('haStatus', { connected: false, error: String(error) });
    }
  }, 5000);

  // Calendar & Todo updates (every 5 seconds)
  const calendarInterval = setInterval(async () => {
    try {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const twoMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 2, 1);

      const events = await getEventsByDateRange(
        twoMonthsAgo.toISOString(),
        twoMonthsAhead.toISOString()
      );
      const tasks = await getAllTasks();
      const projects = await getAllProjects();

      socket.emit('calendarEvents', events);
      socket.emit('todos', tasks);
      socket.emit('projects', projects);
    } catch (error) {
      console.error('Error fetching calendar/todo data:', error);
      socket.emit('calendarEvents', []);
      socket.emit('todos', []);
      socket.emit('projects', []);
    }
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(statsInterval);
    clearInterval(haInterval);
    clearInterval(calendarInterval);
  });
});

// Initialize Neo4J on startup
async function initializeDatabase() {
  try {
    console.log('Verifying Neo4J connection...');
    const isConnected = await verifyConnection();

    if (!isConnected) {
      console.error('✗ Failed to connect to Neo4J');
      console.error('Make sure Neo4J is running: docker ps | grep neo4j');
      return;
    }

    console.log('Initializing Neo4J schema...');
    await initializeSchema();

    const stats = await getDatabaseStats();
    console.log('✓ Neo4J ready:', stats);

    // Start calendar sync scheduler
    console.log('Starting calendar sync scheduler...');
    startSyncScheduler();

    // Start TODO.md file watcher
    console.log('Starting TODO.md file watcher...');
    startTodoMdWatcher();

    console.log('✓ All services initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Server will continue but calendar/todo features may not work');
  }
}

httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopSyncScheduler();
  stopTodoMdWatcher();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopSyncScheduler();
  stopTodoMdWatcher();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };
