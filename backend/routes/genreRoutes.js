// ==========================================================================
// Genre Routes
// ==========================================================================

import { Router } from 'express';
import { getDb } from '../config/db.js';
import { getAllGenres } from '../services/genreService.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const genres = await getAllGenres();
        res.json({ success: true, data: genres });
    } catch (err) {
        console.error('GET /api/genres failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch genres' });
    }
});

export default router;