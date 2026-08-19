import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config(); // Reloaded auth.js google-callback mode check

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import moduleRoutes from './routes/modules.js';
import taskRoutes from './routes/tasks.js';
import subtaskRoutes from './routes/subtasks.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import notificationReadsRoutes from './routes/notificationReads.js';
import adminNotificationRoutes from './routes/adminNotifications.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://deadlinehub-online.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.includes(cleanOrigin) || 
                      cleanOrigin.endsWith('.vercel.app') ||
                      (process.env.FRONTEND_URL && cleanOrigin === process.env.FRONTEND_URL.replace(/\/$/, '')) ||
                      (process.env.CLIENT_URL && cleanOrigin === process.env.CLIENT_URL.replace(/\/$/, ''));
    if (isAllowed) {
      return callback(null, cleanOrigin);
    }
    return callback(null, cleanOrigin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);  // Must come before generic /api routes
app.use('/api/admin/profile', profileRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notification-reads', notificationReadsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', moduleRoutes);
app.use('/api', taskRoutes);        // handles: GET /api/projects/:id/tasks, POST /api/projects/:id/tasks
app.use('/api/tasks', taskRoutes);  // handles: GET /api/tasks/pending, PUT /api/tasks/:id, DELETE /api/tasks/:id
app.use('/api', subtaskRoutes);           // handles: GET/POST /api/tasks/:id/subtasks
app.use('/api/subtasks', subtaskRoutes);  // handles: PUT /api/subtasks/:id/toggle, DELETE /api/subtasks/:id

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`DeadlineHub API Server running on port ${PORT}`);
});
