import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bookRoutes from './book.routes.js';
import circleRoutes from './circle.routes.js';
import postRoutes from './post.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/circles', circleRoutes);
router.use('/posts', postRoutes);

export default router;
