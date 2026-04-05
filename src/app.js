const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Trust X-Forwarded-* from Render / other reverse proxies (correct req.protocol, secure cookies, etc.)
app.set('trust proxy', 1);

// ─── Security middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize()); // Prevent NoSQL injection via req.body / query

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests. Please try again in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit on auth endpoints
  message: { status: 'fail', message: 'Too many login attempts. Please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ─── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Root (avoids 404 when opening the deployed URL in a browser) ─────────
app.get('/', (req, res) => {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  const base = `${proto}://${host}`;
  res.status(200).json({
    status: 'success',
    message: 'Finance Dashboard API',
    documentation: `${base}/api/docs/`,
    health: `${base}/health`,
    apiBase: `${base}/api`,
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── API routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── 404 handler ───────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
});

// ─── Global error handler ──────────────────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
