import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import versions from './routes/versions';
import dependencies from './routes/dependencies';
import compatibility from './routes/compatibility';
import health from './routes/health';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware for all API routes
app.use('/api/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

// Mount API routes
app.route('/api/versions', versions);
app.route('/api/versions/dependencies', dependencies);
app.route('/api/projects/compatibility', compatibility);
app.route('/api/health', health);

export default app;
