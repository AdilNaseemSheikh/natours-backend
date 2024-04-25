const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

// that's how we create sub application by using router
const router = express.Router();

// router.param('id', tourController.checkId);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

// '/api/v1/tours' is already picked by router, so we need to use / for current route
router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour); //tourController.checkBody,
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo(['admin', 'lead-guide']),
    tourController.deleteTour,
  );

module.exports = router;
