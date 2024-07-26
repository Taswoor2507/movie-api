import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import ApiError from '../utils/ErrorHandler.util.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();



const auth = async (req, res, next) => {

  const token = req.header('x-auth-token');

  if (!token) {
    // return res.status(401).json({ error: 'No token, authorization denied' });
    return next(new ApiError(401 , 'No token, authorization denied'));
  }

  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user = decoded.id;

    const user = await User.findById(req.user);
    if (!user || user.status !== 'Active') {
      // return res.status(401).json({ error: 'User is not active or does not exist' });
      return next(new ApiError(401 , 'U are not active go and activate your account '));
    }

    next();
  } catch (error) {
    // console.error('Error verifying token:', error);
    // res.status(401).json({ error: 'Token is not valid' });
    return next(new ApiError(401 , 'Token is not valid'));
  }
};

export default auth;
