const express = require('express');
const viewsController = require('../controllers/viewsController');

const router = express.Router();

// SSR using pug
router.route('/').get(viewsController.getOverview);

router.route('/tour/:slug').get(viewsController.getTour);

module.exports = router;
