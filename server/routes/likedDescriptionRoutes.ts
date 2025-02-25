import Router from '@koa/router';
import { isAuthenticated } from '../auth';
import {
  saveLikedDescription,
  getLikedDescriptions,
} from '../controllers/likedDescriptionController';

const router = new Router();

// Protected routes that require authentication
router.post('/like-description', isAuthenticated, saveLikedDescription);
router.get('/liked-descriptions', isAuthenticated, getLikedDescriptions);

export default router;
