const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name || '';
  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please login again.', 401);

const handleJWTExpireError = (err) =>
  new AppError('Your token has expired. Please login again.', 401);

const handleValidationErrorDB = (err) => {
  const errors = Object.entries(err.errors).map(([_, value]) => value.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // Error in API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    // ERROR IN RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API ERROR
  if (req.originalUrl.startsWith('/api')) {
    // if operational, it means it is our own error then sent actual error message
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // programming error, unknown error, don't show internal message
      // console.error('ERROR 💣', err);
      res.status(err.statusCode).json({
        status: 500,
        message: 'Something went wrong 😭',
      });
    }
  } else {
    // ERROR IN RENDERED WEBSITE
    // if operational, it means it is our own error then sent actual error message
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message,
      });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: 'Please try again later',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError(error);

    sendErrorProd(error, req, res);
  }
};
