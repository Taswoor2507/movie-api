import redis from '../utils/redisClient.js';
import Movie from '../models/movies.model.js';
import omdbService from '../services/omdb.service.js';
import ApiError from '../utils/ErrorHandler.util.js';
import User from '../models/user.model.js';

const searchMovie = async (req, res, next) => {
  const { title } = req.query;
  if (!title) {
     return next(new ApiError(400, 'Title query parameter is required'));
  }

  try {
    // Check Redis cache
    const cachedMovie = await redis.get(`movie:${title}`);
    if (cachedMovie) {
      return res.json(JSON.parse(cachedMovie));
    }

    // Search in local MongoDB
    let movie = await Movie.findOne({ title: new RegExp(`^${title}$`, 'i') });
    if (movie) {
      // Store in Redis cache
      await redis.set(`movie:${title}`, JSON.stringify(movie), 'EX', 3600); // Cache for 1 hour
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

    // Store in Redis cache
    await redis.set(`movie:${title}`, JSON.stringify(movie), 'EX', 3600); // Cache for 1 hour

    // Invalidate genre cache
    const genres = movie.genre;
    genres.forEach(async (genre) => {
      await redis.del(`genre:${genre}`);
    });

    res.json(movie);
  } catch (error) {
    return next(new ApiError(500, "An error occurred while searching for the movie"));
  }
};



const getMovieById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check if the movie is cached
    const cachedMovie = await redis.get(`movie:${id}`);
    if (cachedMovie) {
      return res.json(JSON.parse(cachedMovie));
    }

    // Fetch the movie from the database
    const movie = await Movie.findById(id);
    if (!movie) {
      return next(new ApiError(404, 'Movie not found'));
    }

    // Cache the movie and return the response
    await redis.set(`movie:${id}`, JSON.stringify(movie), 'EX', 3600); // Cache for 1 hour
    res.json(movie);
  } catch (error) {
    console.log(error);
    
    return next(new ApiError(500, 'An error occurred while fetchingggg the movie'));
  }
};

const getAllMovies = async (req, res, next) => {
  const cacheKey = 'allMovies';

  try {
    // Check Redis cache
    const cachedMovies = await redis.get(cacheKey);
    if (cachedMovies) {
      const parsedMovies = JSON.parse(cachedMovies);
      return res.json({ totalCount: parsedMovies.length, movies: parsedMovies });
    }

    // Fetch all movies from MongoDB
    const movies = await Movie.find({});
    const totalCount = await Movie.countDocuments(); // Get the total count of all movies

    // If no movies are found, log it and return an empty array
    if (movies.length === 0) {
      console.log("No movies found");
    }

    // Store in Redis cache
    await redis.set(cacheKey, JSON.stringify(movies), 'EX', 3600); // Cache for 1 hour

    // Respond with total count and movies
    res.json({ totalCount, movies });
  } catch (error) {
    console.log(error);
    
    return next(new ApiError(500, "An error occurred while retrieving movies"));
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

    if(rating > 5){
      return next(new ApiError(400, 'Rating should be between 1 and 5'));
    }

    // Find existing review by this user
    const existingReviewIndex = movie.reviews.findIndex(r => r.user.toString() === req.user);

    if (existingReviewIndex !== -1) {
      // Update existing review
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

    // Calculate total rating and average rating
    const totalRating = movie.reviews.reduce((acc, review) => acc + review.rating, 0);
    movie.ratings = parseFloat((totalRating / movie.reviews.length).toFixed(2));

    await movie.save();

    res.json(movie);
  } catch (error) {
    console.error('Error adding or updating review:', error);
    return next(new ApiError(500 , 'An error occurred while adding or updating the rating and review'));
  }
};



const getMoviesByGenre = async (req, res, next) => {
  const { genre } = req.query;

  // If no genre is provided, return a 400 error
  if (!genre) {
    return next(new ApiError(400, "Genre is required to fetch movies"));
  }

  // Modify the query to use case-insensitive regex to check within the array
  const query = { genre: { $in: [new RegExp(genre, "i")] } };
  const cacheKey = `genre:${genre.toLowerCase()}`;

  try {
    // Check Redis cache
    const cachedMovies = await redis.get(cacheKey);
    if (cachedMovies) {
      const parsedMovies = JSON.parse(cachedMovies);
      return res.json({ totalMovies: parsedMovies.length, movies: parsedMovies });
    }

    // Fetch from MongoDB
    const movies = await Movie.find(query);
    const totalMovies = await Movie.countDocuments(query); // Get the total count of movies in this genre

    // If no movies are found, log it and return an empty array
    if (movies.length === 0) {
      console.log(`No movies found for genre: ${genre}`);
    }

    // Store in Redis cache
    await redis.set(cacheKey, JSON.stringify(movies), 'EX', 3600); // Cache for 1 hour

    // Respond with total count first, then movies
    res.json({ totalMovies, movies });
  } catch (error) {
    return next(new ApiError(500, "An error occurred while retrieving movies"));
  }
};

export default {
    searchMovie,
    getMoviesByGenre,
    rateMovie,
    getMovieById,
    getAllMovies
  };