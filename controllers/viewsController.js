const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.base = (req, res) => {
  // this will look into views folder and look for template named 'base'
  // passing data to template
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'Adil',
  });
};

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get all the tours
  const tours = await Tour.find({});

  // 2) Build template

  // 2) Render template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review user rating',
  });

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});
