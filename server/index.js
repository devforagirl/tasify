import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 3001;
const TICK_INTERVAL = 3000; // ms between events

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// -- Mock Data --

const TASK_NAMES = [
  'Refactor Auth Module',
  'Optimize Database Queries',
  'Update API Documentation',
  'Fix Memory Leak in Event Loop',
  'Add Unit Tests for Payment Flow',
  'Migrate Legacy Config to YAML',
  'Implement Rate Limiting Middleware',
  'Review Pull Request #1423',
];

const EVENT_TEMPLATES = [
  { event_name: 'task_started', severity: 'INFO' },
  { event_name: 'file_edited', severity: 'INFO' },
  { event_name: 'task_progress', severity: 'INFO' },
  { event_name: 'task_completed', severity: 'SUCCESS' },
  { event_name: 'warning_raised', severity: 'WARNING' },
  { event_name: 'error_occurred', severity: 'ERROR' },
  { event_name: 'hook_triggered', severity: 'INFO' },
  { event_name: 'state_synced', severity: 'SUCCESS' },
];

const STATUSES = ['IDLE', 'THINKING', 'EXECUTING', 'HOOK_TRIGGERED', 'ERROR'];

// -- Helpers --

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEvent() {
  const template = randomItem(EVENT_TEMPLATES);
  return {
    type: 'CLAUDE_EVENT',
    payload: {
      id: uuidv4(),
      event_name: template.event_name,
      timestamp: Math.floor(Date.now() / 1000),
      severity: template.severity,
      details: {
        task_name: randomItem(TASK_NAMES),
        message: `${template.event_name} — simulated event`,
        duration: `${(Math.random() * 30 + 1).toFixed(1)}s`,
      },
    },
  };
}

function generateStateChange() {
  return {
    status: randomItem(STATUSES),
    timestamp: Date.now(),
  };
}

// -- REST Endpoint --

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// -- Socket.io Events --

io.on('connection', (socket) => {
  console.log(`[server] client connected: ${socket.id}`);

  let interval = null;

  // Start pushing mock events
  socket.on('start', () => {
    console.log(`[server] starting mock stream for ${socket.id}`);
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      const event = generateEvent();
      socket.emit('CLAUDE_EVENT', event);

      // Also emit a state change occasionally
      if (Math.random() < 0.3) {
        socket.emit('STATE_CHANGE', generateStateChange());
      }
    }, TICK_INTERVAL);
  });

  // Handle incoming commands from the dashboard
  socket.on('COMMAND', (command) => {
    console.log(`[server] received command:`, command);

    const { command: cmd, params } = command;
    if (cmd === 'EXECUTE_ACTION') {
      const actionType = params?.action_type;

      switch (actionType) {
        case 'STOP_TASK':
          socket.emit('CLAUDE_EVENT', {
            type: 'CLAUDE_EVENT',
            payload: {
              id: uuidv4(),
              event_name: 'task_interrupted',
              timestamp: Math.floor(Date.now() / 1000),
              severity: 'WARNING',
              details: { message: 'Task interrupted by user' },
            },
          });
          socket.emit('STATE_CHANGE', { status: 'IDLE' });
          break;

        case 'SYNC_STATE':
          socket.emit('CLAUDE_EVENT', {
            type: 'CLAUDE_EVENT',
            payload: {
              id: uuidv4(),
              event_name: 'state_synced',
              timestamp: Math.floor(Date.now() / 1000),
              severity: 'SUCCESS',
              details: { message: 'State synchronized successfully' },
            },
          });
          break;

        case 'TRIGGER_MOCK_HOOK':
          socket.emit('CLAUDE_EVENT', {
            type: 'CLAUDE_EVENT',
            payload: {
              id: uuidv4(),
              event_name: 'hook_triggered',
              timestamp: Math.floor(Date.now() / 1000),
              severity: 'INFO',
              details: {
                event_name: params.event_name || 'custom_event',
                message: `Mock hook triggered: ${params.event_name || 'custom_event'}`,
              },
            },
          });
          socket.emit('STATE_CHANGE', { status: 'HOOK_TRIGGERED' });
          break;

        default:
          socket.emit('CLAUDE_EVENT', {
            type: 'CLAUDE_EVENT',
            payload: {
              id: uuidv4(),
              event_name: 'unknown_command',
              timestamp: Math.floor(Date.now() / 1000),
              severity: 'WARNING',
              details: { message: `Unknown action: ${actionType}` },
            },
          });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`[server] client disconnected: ${socket.id}`);
    if (interval) clearInterval(interval);
  });
});

// -- Start --

httpServer.listen(PORT, () => {
  console.log(`[server] Mock server running on http://localhost:${PORT}`);
  console.log(`[server] WebSocket ready for connections`);
});
