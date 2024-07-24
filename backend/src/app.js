
import express from 'express';
import cors from 'cors';
import movieRoutes from './routes/movie.routes.js';
import ErrorMiddleware from './middlewares/Error.middleware.js';
import userRoutes from "./routes/user.routes.js"



const app = express();

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());


app.use('/api/movies', movieRoutes);


//User Routes
app.use('/api/users', userRoutes);

//error middleware 
app.use(ErrorMiddleware)


export default app;