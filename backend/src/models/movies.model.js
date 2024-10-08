
import mongoose, { Schema } from 'mongoose';

const runTimeSchema = new Schema({
  hours: { type: Number, required: true },
  minutes: { type: Number, required: true },
  seconds: { type: Number, required: true },
});

const reviewSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 300,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const movieSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
  },
  genre: {
    type: [String], // Changed to array of strings
    required: [true, 'Genre is required'],
  },
  writer: {
    type: String,
    required: [true, 'Writer name is required'],
  },
  director: {
    type: String,
    required: [true, 'Director is required'],
  },
  released: {
    type: Date,
    required: [true, 'Released Date is required'],
  },
  runTime: {
    type: runTimeSchema,
    required: true,
  },
  actors: [
    {
      type: String,
      required: true,
      trim: true,
    }
  ],
  language: {
    type: String,
    required: [true, 'Language is required'],
  },
  plot: {
    type: String,
    required: [true, 'Plot is required'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
  },
  poster: {
    type: String,
    required: [true, 'Poster URL is required'],
  },
  awards: {
    type: String,
    required: [false, 'Awards are optional'],
  },
  imdbRating: {
    type: Number,
    required: [false, 'IMDB Rating is optional'],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
  },
  boxOffice: {
    type: String,
    required: [false, 'Box Office is optional'],
  },
  production: {
    type: String,
    default: 'N/A',
  },
  imdbVotes: {
    type: Number,
    required: [false, 'IMDB Votes is optional'],
  },
  metaScore: {
    type: Number,
    required: [false, 'Meta Score is optional'],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  noOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [reviewSchema]
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
