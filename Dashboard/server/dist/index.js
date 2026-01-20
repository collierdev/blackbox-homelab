"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const system_1 = __importDefault(require("./routes/system"));
const services_1 = __importDefault(require("./routes/services"));
const chat_1 = __importDefault(require("./routes/chat"));
const homeassistant_1 = __importDefault(require("./routes/homeassistant"));
const go2rtc_1 = __importDefault(require("./routes/go2rtc"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const todos_1 = __importDefault(require("./routes/todos"));
const projects_1 = __importDefault(require("./routes/projects"));
const sync_1 = __importDefault(require("./routes/sync"));
const systemInfo_1 = require("./utils/systemInfo");
const homeassistant_2 = require("./utils/homeassistant");
const neo4j_1 = require("./config/neo4j");
const event_1 = require("./models/event");
const task_1 = require("./models/task");
const project_1 = require("./models/project");
const manager_1 = require("./services/sync/manager");
const todoMdSync_1 = require("./services/todoMdSync");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use('/api/system', system_1.default);
app.use('/api/services', services_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/homeassistant', homeassistant_1.default);
app.use('/api/go2rtc', go2rtc_1.default);
app.use('/api/calendar/events', calendar_1.default);
app.use('/api/todos', todos_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/sync', sync_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const clientPath = path_1.default.join(__dirname, '../client/dist');
    app.use(express_1.default.static(clientPath));
    app.get('/{*path}', (req, res) => {
        res.sendFile(path_1.default.join(clientPath, 'index.html'));
    });
}
// Socket.io for real-time stats
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    const statsInterval = setInterval(async () => {
        try {
            const stats = await (0, systemInfo_1.getSystemStats)();
            socket.emit('systemStats', stats);
        }
        catch (error) {
            console.error('Error getting system stats:', error);
        }
    }, 2000);
    // Home Assistant updates (every 5 seconds)
    const haInterval = setInterval(async () => {
        try {
            const status = await (0, homeassistant_2.checkConnection)();
            if (status.connected) {
                const devices = await (0, homeassistant_2.getGroupedEntities)();
                socket.emit('haDevices', devices);
            }
            socket.emit('haStatus', status);
        }
        catch (error) {
            socket.emit('haStatus', { connected: false, error: String(error) });
        }
    }, 5000);
    // Calendar & Todo updates (every 5 seconds)
    const calendarInterval = setInterval(async () => {
        try {
            const now = new Date();
            const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const twoMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 2, 1);
            const events = await (0, event_1.getEventsByDateRange)(twoMonthsAgo.toISOString(), twoMonthsAhead.toISOString());
            const tasks = await (0, task_1.getAllTasks)();
            const projects = await (0, project_1.getAllProjects)();
            socket.emit('calendarEvents', events);
            socket.emit('todos', tasks);
            socket.emit('projects', projects);
        }
        catch (error) {
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
        const isConnected = await (0, neo4j_1.verifyConnection)();
        if (!isConnected) {
            console.error('✗ Failed to connect to Neo4J');
            console.error('Make sure Neo4J is running: docker ps | grep neo4j');
            return;
        }
        console.log('Initializing Neo4J schema...');
        await (0, neo4j_1.initializeSchema)();
        const stats = await (0, neo4j_1.getDatabaseStats)();
        console.log('✓ Neo4J ready:', stats);
        // Start calendar sync scheduler
        console.log('Starting calendar sync scheduler...');
        (0, manager_1.startSyncScheduler)();
        // Start TODO.md file watcher
        console.log('Starting TODO.md file watcher...');
        (0, todoMdSync_1.startTodoMdWatcher)();
        console.log('✓ All services initialized');
    }
    catch (error) {
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
    (0, manager_1.stopSyncScheduler)();
    (0, todoMdSync_1.stopTodoMdWatcher)();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    (0, manager_1.stopSyncScheduler)();
    (0, todoMdSync_1.stopTodoMdWatcher)();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map