const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

// that's how we create sub application by using router
const router = express.Router();

// router.param('id', tourController.checkId);

// NESTED ROUTES FOR REVIEWS IN A TOUR
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   )
//   .get(reviewController.getAllReviews);

/*Above code works fine but it should not be in tourRouter because it starts with /tour/tourId. But in reviewRouter
because it it does CRUD reviews, so we re-direct it to review controller
*/

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.getMonthlyPlan,
  );

// /tours-within/500/center/45,-93/unit/mi
router
  .route('/tours-within/:distance/center/:center/unit/:unit')
  .get(tourController.getToursWithin);

// tours in ascending order from a specified distance
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// '/api/v1/tours' is already picked by router, so we need to use / for current route
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.deleteTour,
  );

module.exports = router;
