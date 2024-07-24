import Movie from '../models/movies.model.js';
import omdbService from '../services/omdb.service.js';
import ApiError from '../utils/ErrorHandler.util.js';
import User from '../models/user.model.js';

const searchMovie = async (req, res, next) => {
  const { title } = req.query;
  console.log(title);
  if (!title) {
     return next(new ApiError(400 , 'Title query parameter is required'));
  }


  
  try {
    // Search in local MongoDB
    let movie = await Movie.findOne({ title: new RegExp(`^${title}$`, 'i') });
    if (movie) {
      return res.json(movie);
    }

    // If not found locally, search in OMDb API
    const movieData = await omdbService.fetchMovieByTitle(title);
    if (movieData.Response === 'False') {
      
      return next(new ApiError(404, 'Movie not found'));
    }

    // Parse runtime
    const runtimeMinutes = parseInt(movieData.Runtime.split(' ')[0]) || 0;
    const hours = Math.floor(runtimeMinutes / 60);
    const minutes = runtimeMinutes % 60;

    // Save the movie data to MongoDB
    movie = new Movie({
      title: movieData.Title,
      year: movieData.Year,
      genre: movieData.Genre.split(', ').map(g => g.trim()), // Convert genres to array
      writer: movieData.Writer,
      director: movieData.Director,
      released: new Date(movieData.Released),
      runTime: {
        hours: hours,
        minutes: minutes,
        seconds: 0,
      },
      actors: movieData.Actors.split(', '),
      language: movieData.Language,
      plot: movieData.Plot,
      country: movieData.Country,
      poster: movieData.Poster,
      awards: movieData.Awards || '',
      imdbRating: parseFloat(movieData.imdbRating) || 0,
      type: movieData.Type,
      boxOffice: movieData.BoxOffice || '',
      production: movieData.Production || 'N/A',
      imdbVotes: parseInt(movieData.imdbVotes.replace(/,/g, '')) || 0,
      metaScore: parseInt(movieData.Metascore) || 0,
    });
    await movie.save();

    res.json(movie);
  } catch (error) {
    return next(new ApiError(500 , "An error occurred while searching for the movie" ))
  }
};
const getMovieById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const movie = await Movie.findById(id);
    if (!movie) {
      return next(new ApiError(404 , 'Movie not found'));
    }

    res.json(movie);
  } catch (error) {
    // console.error('Error fetching movie by ID:', error);
    return next(new ApiError(500 , 'An error occurred while fetching the movied'));
  }
};

const rateMovie = async (req, res, next) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  if (!rating || !review) {
    return next(new ApiError(400 , 'Rating and review are required'));
  }

  try {
    const user = await User.findById(req.user);
    if (!user) {
      return next(new ApiError(401 , 'User not found'));
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return next(new ApiError(404 , 'Movie not found'));
    }

    let totalRating = movie.reviews.reduce((acc, review) => acc + review.rating, 0);
    const existingReviewIndex = movie.reviews.findIndex(r => r.user.toString() === req.user);

    if (existingReviewIndex !== -1) {
      // Update existing review
      totalRating -= movie.reviews[existingReviewIndex].rating;
      movie.reviews[existingReviewIndex].rating = rating;
      movie.reviews[existingReviewIndex].comment = review;
    } else {
      // Add new review
      const newReview = {
        user: req.user,
        name: user.username,
        rating: rating,
        comment: review,
      };
      movie.reviews.push(newReview);
      movie.noOfReviews += 1;
    }

    totalRating += rating;
    // Recalculate the average rating
    movie.ratings = totalRating / movie.reviews.length;

    await movie.save();

    res.json(movie);
  } catch (error) {
    // console.error('Error adding or updating review:', error);
    return next(new ApiError(500 , 'An error occurred while adding or updating the rating and review'));
  }
};

const getMovies = async (req, res, next) => {
  const { genre } = req.query;
  const query = genre ? { genre: { $in: [genre] } } : {};

  try {
   
     const movies = await Movie.find(query);
    res.json(movies);
  } catch (error) {
    return next(new ApiError(500, "An error occurred while retrieving movies"))
  }
};

export default {
    searchMovie,
    getMovies,
    rateMovie,
    getMovieById,
  };