const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const AppError = require('./utils/appError');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const globalErrorHandler = require('./controllers/errorController.js');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.enable('trust proxy');

// tell app which templating engine we are going to use
app.set('view engine', 'pug');

// tell where views(templates) are located
app.set('views', path.join(__dirname, 'views'));

// implementing CORS
app.use(cors());

// app.use(cors({
//   origin:'https://natours.com' // to enable CORS on a specific url
// }))

// for complex requests(put, patch, delete) there is a pre-flight phase and for preflight
// app.options call is made. We need to enable CORS for these complex requests in this phase as well
app.options('*', cors());

// SERVING STATIC FILES
// (all the static assets like imgs, css etc. will be served from folder called public)
// this is the reason that css/styles.css or img/favicon.png works correctly
app.use(express.static(path.join(__dirname, 'public')));

// 1) GLOBAL MIDDLEWARE

// SET HTTP SECURITY HEADERS
app.use(helmet());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// rate limiting middleware
const limiter = rateLimit({
  max: 100, // max requests
  windowMs: 60 * 60 * 1000, // time frame 1hr,
  message: 'Too many requests from same IP 😲. Try again after 1 hour.',
});

app.use('/api', limiter);

// allow leaflet cdn
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://unpkg.com https://js.stripe.com",
  );
  return next();
});

// BODY PARSER, reading data from body to req.body
// app.use(express.json());
app.use(express.json({ limit: '10kb' })); // limit body data to 10kb
app.use(cookieParser()); // parse cookies
// to get data html from form submited through action
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  }),
);

// DATA SANITIZATION
// a) data sanatization against NoSql query injections
// ({"gt":""}) this query returns true and we can login using this query
app.use(mongoSanitize()); // this removes malicious symbols ($) from body

// b) data sanatization against XSS
app.use(xss()); // it cleans user input from malicious html

// PREVENT PARAMETER POLLUTION [sort=name&sort=price] wrong logic and server will crash
// forsome parameters, we want multiple values like get all the tours with duration 5 and 8.
// We will send query ?duration=5&duration=8
// we can white list some parameters to accept duplicate values
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'price',
    ],
  }),
);

// defining custom middleware
app.use((req, res, next) => {
  console.log('Hello from Middleware 🐶');
  // console.log(req.cookies);
  // forget this call and you will never go to the next middleware
  next();
});

// to compress the response sent to client either in text form or JSON
app.use(compression());

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
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

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
