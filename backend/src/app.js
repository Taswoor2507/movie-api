
import express from 'express';
import cors from 'cors';
import movieRoutes from './routes/movie.routes.js';



const app = express();

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());


app.use('/api/movies', movieRoutes);

export default app;