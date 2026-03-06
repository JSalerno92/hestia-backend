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
import bookingRoute from './routes/bookings.js';
// backoffice
import adminAuthRoutes from './routes/admin.auth.routes.js';
import adminServices from './routes/admin.service.routes.js';
import adminProviders from './routes/admin.providers.routes.js';
import adminAvailability from './routes/admin.availability.routes.js';
import { requireBackofficeAuth } from './middleware/authBackoffice.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://192.168.1.40:5173',
      'https://dainty-genie-f95ae5.netlify.app',
      'https://casahestia.com.ar',
      'https://www.casahestia.com.ar'
    ],
    credentials: true
  }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api/bookings', bookingsRoutes);
  app.use('/api', publicRoutes);
  app.use('/api/backoffice', backofficeAuth);
  app.use('/api/forms', formsRoutes(pool));
  app.use('/api/service-requests', serviceRequestsRoutes(pool));
  app.use('/api/services', servicesRoutes(pool));
  app.use('/api/bookings', bookingRoute);

  // backoffice
  app.use('/api/admin/auth', adminAuthRoutes);
  app.use('/api/admin/services', requireBackofficeAuth, adminServices);
  app.use('/api/admin/providers', requireBackofficeAuth, adminProviders);
  app.use('/api/admin/availability', requireBackofficeAuth, adminAvailability);

  app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}