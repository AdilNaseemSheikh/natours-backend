const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async function (req, res, next) {
  const reviews = await Review.find({});
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: reviews.length,
    data: { reviews },
  });
});

exports.createReview = catchAsync(async function (req, res, next) {
  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: { review: newReview },
  });
});
