const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  console.log(tour, user, price);
  if (!tour || !user || !price) return next();

  await Booking.create({
    tour,
    user,
    price,
  });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tourId = req.params.tourId;

  // 1) Get currently booked tour
  const tour = await Tour.findById(tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // stripe will do get request to our success url so,
    // we can pass query string with 3 things needed to create a booking (bookingModel)
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    // this field allow us to pass in some data about the session being created, cuz after the purchase,
    // we will get this session object, then we can use this field to add a new booking in our database
    // and also, this is only gonna work in deployed website
    client_reference_id: tourId, // This is used to pass additional data about the session
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100, // Stripe expects the amount value in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // 3) Send session in response

  res.status(200).json({
    status: 'success',
    session,
  });
});
