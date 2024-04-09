const express = require('express');
const tourController = require('../controllers/tourController');

// that's how we create sub application by using router
const router = express.Router();

router.param('id', tourController.checkId);

// '/api/v1/tours' is already picked by router, so we need to use / for current route
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkBody,tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
