import { Router } from 'express';
import * as movieController from '../controllers/movieController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/latest-releases', movieController.getLatestReleases);
router.get('/export/json', movieController.exportMovies);
router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovieById);

router.post('/', requireAuth, movieController.createMovie);
router.post('/bulk', requireAuth, movieController.bulkImport);
router.put('/:id', requireAuth, movieController.updateMovie);
router.delete('/:id', requireAuth, movieController.deleteMovie);

export default router;
