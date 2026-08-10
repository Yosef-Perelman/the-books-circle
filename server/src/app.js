import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

// Error handler must be the last middleware
app.use(errorHandler);

export default app;
