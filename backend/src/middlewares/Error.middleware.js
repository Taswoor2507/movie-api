import ApiError from "../utils/ErrorHandler.util.js";
const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong Mongodb Id error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ApiError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ApiError(message, 400);
  }

  
 

  res.status(err.statusCode).json({
    success: false,
    data:null ,
    message: err.message,
  });
};


export default ErrorMiddleware;