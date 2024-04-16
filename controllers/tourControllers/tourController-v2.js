// WITHOUT CATCHASYNC

const fs = require('fs');
const Tour = require('../../models/tourModel');
const APIFeature = require('../../utils/apiFeature');

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

exports.getAllTours = async (req, res) => {
  console.log(req.query);
  try {
    // EXECUTE QUERY
    const features = new APIFeature(Tour.find(), req.query);
    features.filter();
    features.sort();
    features.limitFields();
    features.paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).send({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTour = async (req, res) => {
  const id = req.params.id;

  try {
    const tour = await Tour.findById(id);
    res.status(200).send({
      status: 'success',
      data: { tour },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // method 1
    // const newTour=new Tour({})
    // newTour.save()

    // method 2
    const newTour = await Tour.create(req.body);

    res.status(201).send({ status: 'success', data: { tour: newTour } });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }

  // tours.push(newTour);
  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   (err) => {
  //     res.status(201).send({ status: 'success', data: { tour: newTour } });
  //   },
  // );
};

exports.deleteTour = async (req, res) => {
  const id = +req.params.id;
  try {
    await Tour.findOneAndDelete(id);
    res.status(204).send({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updateTour = async (req, res) => {
  const id = req.params.id;
  try {
    const tour = await Tour.findByIdAndUpdate(id, req.body, {
      new: true, // return updated document
      runValidators: true,
    });
    res.status(200).send({
      status: 'success',
      data: { tour },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          // grouping should be based on _id (null means dont group). If we group based on difficulty,
          // tour with same difficulty will be grouped together in one object along with its stats
          // _id: {$toUpper:"$difficulty"},
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
          avgPrice: 1, // 1 means ascending
        },
      },
      // {
      //   $match: {
      //     _id: { $ne: 'EASY' },
      //   },
      // },
    ]);
    res.status(200).send({
      status: 'success',
      data: { stats },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};
