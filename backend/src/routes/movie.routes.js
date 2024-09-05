import express from 'express';
import movieController from '../controllers/movie.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/search', movieController.searchMovie);
router.get('/getById/:id', movieController.getMovieById);
router.get('/all', movieController.getAllMovies);
router.get('/', movieController.getMoviesByGenre);
router.post('/:id/rate',auth ,  movieController.rateMovie);
export default router;