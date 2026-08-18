import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use((err, req, res, next) => {
  try {
    fs.appendFileSync('error.log', new Date().toISOString() + ' ' + err.stack + '\n');
  } catch(e) {}
  next(err);
});

// Error handler must be the last middleware
app.use(errorHandler);

export default app;
