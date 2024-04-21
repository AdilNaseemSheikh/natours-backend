const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({});

  // SEND RESPONSE
  res.status(200).send({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: { users },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};

exports.getUser = (req, res) => {
  const id = +req.params.id;
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};

exports.updateUser = (req, res) => {
  const id = +req.params.id;
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};

exports.deleteUser = (req, res) => {
  const id = +req.params.id;
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};
