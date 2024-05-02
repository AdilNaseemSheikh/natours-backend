const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// by default, each router has access to their routes only. But here, we want to access the other params that were passed to
// /tour/tourId/reviews as well. So, we merge params to get params from redirected route
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo(['user']),
    reviewController.createReview,
  );

module.exports = router;
