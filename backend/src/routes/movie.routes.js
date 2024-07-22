import express from 'express';
import movieController from '../controllers/movie.controller.js';

const router = express.Router();

router.get('/search', movieController.searchMovie);
export default router;