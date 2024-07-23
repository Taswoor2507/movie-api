import Movie from '../models/movies.model.js';
import omdbService from '../services/omdb.service.js';
import ApiError from '../utils/ErrorHandler.util.js';

const searchMovie = async (req, res, next) => {
  const { title } = req.query;
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

    // Save the movie data to MongoDB
    movie = new Movie({
      title: movieData.Title,
      year: movieData.Year,
      genre: movieData.Genre,
      writer: movieData.Writer,
      director: movieData.Director,
      released: new Date(movieData.Released),
      runTime: {
        hours: parseInt(movieData.Runtime.split(' ')[0].split('h')[0]) || 0,
        minutes: parseInt(movieData.Runtime.split(' ')[1].split('min')[0]) || 0,
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


export default {
    searchMovie,
  };