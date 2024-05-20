const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeature = require('../utils/apiFeature');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

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

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  // test if uploaded file is image
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('Not an image. Please upload only images', 400),
      false,
    );
  }
};

const upload = multer({ fileFilter: multerFilter, storage: multerStorage });

// upload.array('images', 5)

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) cover image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);

  // req.body is picked while saving in factory middleware
  req.body.imageCover = imageCoverFilename;

  // 2) other image
  req.body.images = [];
  await Promise.all(
    // as the callback to map is async, it will return a promise and using map will return array of promises.
    // we await that whole array so that move to next line when all the promises are finished
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
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

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, unit, center } = req.params;
  const [lat, lng] = center.split(',');
  // we need to convert distance to radian, thats what centerSphere expects
  const radiusOfEarth = unit === 'mi' ? 3963.2 : 6378.1; // unit should be mi or km
  const radius = distance / radiusOfEarth;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in format lat,lng.',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    // find tours where start location is within the radius of specified distance from a given point
    // https://www.mongodb.com/docs/manual/reference/operator/query/geoWithin/
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res
    .status(200)
    .json({ status: 'success', results: tours.length, data: { data: tours } });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance', // field which will be created and where distance will be stored
        distanceMultiplier: multiplier, // convert into km/mi
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: { data: distances },
  });
});
