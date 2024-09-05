import express from 'express';
import movieController from '../controllers/movie.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/search', movieController.searchMovie);
router.get('/:id', movieController.getMovieById);
router.get('/', movieController.getMovies);
router.post('/:id/rate',auth ,  movieController.rateMovie);
export default router;