import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import ApiError from '../utils/ErrorHandler.util.js';
import dotenv from 'dotenv';

dotenv.config();

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization'); 

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token, authorization denied'));
  }

  const token = authHeader.split(' ')[1]; 

  if (!token) {
    return next(new ApiError(401, 'No token, authorization denied'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; 

    const user = await User.findById(req.user);
    if (!user || user.status !== 'Active') {
      return next(new ApiError(401, 'User is not active, go and activate your account'));
    }

    next();
  } catch (error) {
    return next(new ApiError(401, 'Token is not valid'));
  }
};

export default auth;
