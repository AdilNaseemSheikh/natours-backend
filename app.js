const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController.js');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARE
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// defining custom middleware
app.use((req, res, next) => {
  console.log('Hello from Middleware 🐶');
  // forget this call and you will never go to the next middleware
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
// i)
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// ii)
// app.route('/api/v1/tours').get(getAllTours).post(createTour);

// iii) this process is called mounting a router on a specific route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// if code reaches here, it did not enter any of above routes

// all means every request type(get, post, patch, delete, put) & * means for all routes
app.all('*', (req, res, next) => {
  // i)
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server.`,
  // });
  // ii)
  // const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  // err.statusCode = 404;
  // err.status = 'fail';

  // if we pass anything to the next, it will automatically be considered as error
  // and all the middlewares in the stack will be skiped & Error handling
  // middleware will be called with error passed to next.
  // iii)
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
