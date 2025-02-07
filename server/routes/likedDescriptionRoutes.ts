import Router from '@koa/router';
import {
  saveLikedDescription,
  getLikedDescriptions,
} from '../controllers/likedDescriptionController';

const router = new Router();

router.post('/like-description', saveLikedDescription);
router.get('/liked-descriptions/:userId', getLikedDescriptions);

export default router;
