import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bookRoutes from './book.routes.js';
import userBookRoutes from './userBook.routes.js';
import circleRoutes from './circle.routes.js';
import postRoutes from './post.routes.js';
import userRoutes from './user.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/user-books', userBookRoutes);
router.use('/circles', circleRoutes);
router.use('/posts', postRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);

export default router;
