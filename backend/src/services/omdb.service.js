// import axios from 'axios';

// const OMDB_API_KEY = 1652e326;
// const OMDB_BASE_URL = 'http://www.omdbapi.com/';

// async function fetchMovieByTitle(title) {
//   try {
//     const response = await axios.get(`${OMDB_BASE_URL}?t=${title}&apikey=${OMDB_API_KEY}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching movie from OMDb:', error);
//     throw error;
//   }
// }

// export default {
//   fetchMovieByTitle,
// };


// services/omdbService.js


// services/omdbService.js
import axios from 'axios';

import dotenv from 'dotenv';

// Ensure dotenv is configured to load environment variables
dotenv.config();

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = 'http://www.omdbapi.com/';

console.log('OMDB_API_KEY in omdbService:', OMDB_API_KEY); // Should log your API key

async function fetchMovieByTitle(title) {
  try {
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        t: title,
        apikey: OMDB_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching movie from OMDb:', error);
    throw error;
  }
}

export default {
  fetchMovieByTitle,
};

