import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import express from 'express';
import cors from 'cors';
import movieRoutes from './routes/movie.routes.js';
import ErrorMiddleware from './middlewares/Error.middleware.js';
import userRoutes from "./routes/user.routes.js"



const app = express();


// Use Helmet to set security-related HTTP headers
app.use(helmet());


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 30, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"18kb", extended:true}))

// Middleware to sanitize user inputs to prevent NoSQL injection
app.use(mongoSanitize());

app.use('/api/movies', movieRoutes);


//User Routes
app.use('/api/users', userRoutes);

//error middleware 
app.use(ErrorMiddleware)


export default app;