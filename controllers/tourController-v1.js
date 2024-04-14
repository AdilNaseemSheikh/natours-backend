// WITHOUT API CLASSES

const fs = require('fs');
const Tour = require('../models/tourModel');

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
    // BUILD QUERY

    // 1.1) exclude unnecessary keywords from query
    const queryObj = { ...req.query };

    const excludeFields = ['sort', 'fields', 'limit', 'page'];

    excludeFields.forEach((el) => delete queryObj[el]);

    // 1.2) enable gte etc. operators

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`,
    );

    // const tours = query
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    let query = Tour.find(JSON.parse(queryString));

    // 2) sorting
    let sortBy = '-createdAt'; // default sorting, - is for ascending
    if (req.query.sort) {
      sortBy = req.query.sort.replaceAll(',', ' ');
      // 'price ratingsAverage' if two has same price then it will be sorted according to their ratingsAverage
    }
    query.sort(sortBy);

    // 3) limiting fields
    let fields = '-__v'; //- is to exclude. By default, everything will be included except __v
    if (req.query.fields) {
      fields = req.query.fields.replaceAll(',', ' ');
    }
    query = query.select(fields);

    // 4) pagination
    // page=2&limit=5
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const toursCount = await Tour.countDocuments();
      if (skip >= toursCount) {
        throw new Error('This page does not exist');
      }
    }

    // EXECUTE QUERY
    const tours = await query;

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
