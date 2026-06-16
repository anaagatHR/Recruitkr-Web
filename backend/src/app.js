import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';

import { env } from './config/env.js';
import { getDynamicSitemap } from './controllers/seo.controller.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/auth.routes.js';
import blogRoutes from './routes/blog.routes.js';
import contactRoutes from './routes/contact.routes.js';
import apiRoutes from './routes/index.js';
import teamRoutes from "./routes/teamRoutes.js";
import uploadRoutes from './routes/upload.routes.js';

const app = express();
const parseOrigins = (value = '') =>
  value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const configuredOrigins = parseOrigins(env.CORS_ORIGIN);
const localDevOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];
const allowedOrigins = new Set([
  ...configuredOrigins,
  env.FRONTEND_URL.replace(/\/$/, ''),
  ...(env.NODE_ENV === 'production' ? [] : localDevOrigins),
]);

const buildCorsError = (origin) => {
  const error = new Error('CORS origin not allowed');
  error.statusCode = 403;
  error.code = 'CORS_ORIGIN_REJECTED';
  error.origin = origin;
  return error;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Requests from Postman, curl, mobile apps, SSR, and server-to-server calls
    // often have no Origin header. They are not browser CORS requests.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn('[cors] rejected origin', {
      origin,
      method: 'origin-check',
      allowedOrigins: Array.from(allowedOrigins),
      nodeEnv: env.NODE_ENV,
    });

    return callback(buildCorsError(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(
  helmet({
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers.accept?.includes('text/event-stream') || req.path.includes('/events/stream')) {
        return false;
      }

      return compression.filter(req, res);
    },
  }),
);
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: false, limit: '8mb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});
app.use(hpp());
if (env.NODE_ENV === 'production') {
  app.use(globalLimiter);
}
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));


app.get('/sitemap.xml', getDynamicSitemap);
app.get('/api/sitemap.xml', getDynamicSitemap);
app.use(['/api/v1/blogs', '/api/blogposts'], (req, _res, next) => {
  console.info('[blog:request]', {
    method: req.method,
    path: req.originalUrl,
    origin: req.headers.origin || 'unknown',
  });
  next();
});

app.use('/api/v1', apiRoutes);
app.use('/api/uploads', uploadRoutes);
// Backwards-compatible auth alias for clients expecting /api/auth/... instead of /api/v1/auth/...
app.use('/api/auth', authRoutes);
app.use('/api/blogposts', blogRoutes);
app.use('/api/contact', contactRoutes);


app.use("/api/team", teamRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
