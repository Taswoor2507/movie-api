import axios from 'axios';
import dotenv from 'dotenv';

// Ensure dotenv is configured to load environment variables
dotenv.config();

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = process.env.OMDB_BASE_URL;

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

