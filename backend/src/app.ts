import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import adminRoutes from './routes/admin.routes';
import mentorRoutes from './routes/mentor.routes';
import studentRoutes from './routes/student.routes';
import commonRoutes from './routes/common.routes';

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      const sameOrigin = origin === `${req.protocol}://${req.get('host')}`;
      const allowed = sameOrigin || env.corsOrigins.includes(origin);
      if (!allowed) {
        res.status(403).json({ success: false, message: 'Not allowed by CORS' });
        return;
      }
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    next();
  });
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));
  app.use(pinoHttp({ logger }));

  app.use('/api', apiLimiter);

  // Swagger docs at /api/docs
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'EduFlow LMS API Docs',
    })
  );

  // Routes
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/mentor', mentorRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api', commonRoutes);

  // Local file fallback when Cloudinary is not configured
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }

  // Production: serve the built React app and fall back to index.html for
  // client-side routes (SPA). API/upload routes are excluded so unknown
  // endpoints still 404 as JSON via the notFound middleware.
  if (env.nodeEnv === 'production') {
    const frontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');
    if (fs.existsSync(frontendDist)) {
      app.use(express.static(frontendDist, { index: 'index.html' }));
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
          res.sendFile(path.join(frontendDist, 'index.html'));
          return;
        }
        next();
      });
    } else {
      logger.warn(`frontend dist not found at ${frontendDist}; API-only mode`);
    }
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
