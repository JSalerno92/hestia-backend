import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bookingsRoutes from './routes/bookings.routes.js';
import publicRoutes from './routes/public.js';
import backofficeAuth from './routes/backofficeAuth.js';
import formsRoutes from './routes/forms.js';
import serviceRequestsRoutes from './routes/serviceRequests.js';
import pool from './db/index.js';
import servicesRoutes from './routes/services.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api/bookings', bookingsRoutes);
  app.use('/api', publicRoutes);
  app.use('/api/backoffice', backofficeAuth);
  app.use('/api/forms', formsRoutes(pool));
  app.use('/api/service-requests', serviceRequestsRoutes(pool));
  app.use('/api/services', servicesRoutes(pool));

  app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
