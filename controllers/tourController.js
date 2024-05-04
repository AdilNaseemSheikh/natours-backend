const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeature = require('../utils/apiFeature');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'),
);

exports.checkId = (req, res, next, val) => {
  console.log('id ==>>', val);
  if (+req.params.id >= tours.length) {
    return res.status(404).send({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing Name or price',
    });
  }
  next();
};

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,difficulty,ratingsAverage,summary';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // EXECUTE QUERY
//   const features = new APIFeature(Tour.find(), req.query);
//   features.filter();
//   features.sort();
//   features.limitFields();
//   features.paginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).send({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: { tours },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// exports.getTour = catchAsync(async (req, res, next) => {
//   const id = req.params.id;

//   const tour = await Tour.findById(id).populate('reviews'); // virtual populate

//   // .populate({
//   //   path: 'guides', // replace guides with whole object which the refer to
//   //   select: '-__v -passwordChangedAt', // exclude while populating
//   // });
//   if (!tour) {
//     next(new AppError(`No tour found for this id(${id}) :(`, 404));
//     return;
//   }
//   res.status(200).send({
//     status: 'success',
//     data: { tour },
//   });
// });

exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).send({ status: 'success', data: { tour: newTour } });
// });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const id = +req.params.id;
//   const tour = await Tour.findOneAndDelete(id);
//   if (!tour) {
//     next(new AppError(`No tour found for this id(${id}) :(`, 404));
//     return;
//   }
//   res.status(204).send({
//     status: 'success',
//     data: null,
//   });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const id = req.params.id;

//   const tour = await Tour.findByIdAndUpdate(id, req.body, {
//     new: true, // return updated document
//     runValidators: true,
//   });
//   if (!tour) {
//     next(new AppError(`No tour found for this id(${id}) :(`, 404));
//     return;
//   }
//   res.status(200).send({
//     status: 'success',
//     data: { tour },
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        avgRating: { $avg: '$ratingsAverage' },
        numRatings: { $sum: '$ratingsQuantity' },
        numTours: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);
  res.status(200).send({
    status: 'success',
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // startDates is an array, unwind will create a separate document for each entery.
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfToursStart: { $sum: 1 }, // + 1 on each iteration
        name: { $push: '$name' }, // create array and keep pushing
      },
    },
    {
      $addFields: { month: '$_id' }, // field name from previous stage do not starts with $
    },
    {
      $project: { _id: 0 }, // removing(0)/adding(1) fields
    },
    {
      $sort: { numOfToursStart: -1 },
    },
    {
      $limit: 6,
    },
  ]);

  res.status(200).send({
    status: 'success',
    data: { plan },
  });
});
